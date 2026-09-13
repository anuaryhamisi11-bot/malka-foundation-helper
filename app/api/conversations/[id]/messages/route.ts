import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/getSession'
import { createMessageSchema } from '@/lib/validation/schemas'
import { ok, fail, unauthorized, forbidden } from '@/lib/utils/apiResponse'

// Membership is verified on every read AND every write - a user can never
// pull another user's private conversation by guessing/changing the id.
async function assertMember(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } }
  })
  return !!participant
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return unauthorized()
  if (!(await assertMember(params.id, user.id))) return forbidden('You do not have access to this conversation.')

  const before = req.nextUrl.searchParams.get('before')

  const messages = await prisma.message.findMany({
    where: { conversationId: params.id, createdAt: before ? { lt: new Date(before) } : undefined },
    include: { sender: true },
    orderBy: { createdAt: 'desc' },
    take: 30
  })

  return ok({
    messages: messages.reverse().map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: m.sender.fullName,
      senderImageUrl: m.sender.profileImageUrl,
      content: m.deletedAt ? '[message deleted]' : m.content,
      replyToId: m.replyToId,
      editedAt: m.editedAt,
      createdAt: m.createdAt,
      isMine: m.senderId === user.id
    }))
  })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return unauthorized()
  if (!(await assertMember(params.id, user.id))) return forbidden('You do not have access to this conversation.')

  const body = await req.json().catch(() => null)
  const parsed = createMessageSchema.safeParse(body)
  if (!parsed.success) return fail('Message cannot be empty.')

  const message = await prisma.message.create({
    data: {
      conversationId: params.id,
      senderId: user.id,
      content: parsed.data.content,
      replyToId: parsed.data.replyToId || null
    },
    include: { sender: true }
  })

  await prisma.conversation.update({ where: { id: params.id }, data: { updatedAt: new Date() } })

  const otherParticipants = await prisma.conversationParticipant.findMany({
    where: { conversationId: params.id, userId: { not: user.id } }
  })

  await prisma.notification.createMany({
    data: otherParticipants.map((p) => ({
      userId: p.userId,
      type: 'MESSAGE',
      title: `New message from ${user.fullName}`,
      body: parsed.data.content.slice(0, 140),
      link: '/chat'
    }))
  })

  return ok({
    message: {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: message.sender.fullName,
      senderImageUrl: message.sender.profileImageUrl,
      content: message.content,
      replyToId: message.replyToId,
      editedAt: null,
      createdAt: message.createdAt,
      isMine: true
    }
  })
}
