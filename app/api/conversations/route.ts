import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/getSession'
import { hasPermission } from '@/lib/permissions/permissions'
import { createConversationSchema } from '@/lib/validation/schemas'
import { ok, fail, unauthorized, forbidden } from '@/lib/utils/apiResponse'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return unauthorized()

  // A user only ever sees conversations they are a participant in - this
  // is enforced by the WHERE clause itself, not by hiding rows on the client.
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId: user.id } } },
    include: {
      participants: { include: { user: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: true } }
    },
    orderBy: { updatedAt: 'desc' }
  })

  const result = await Promise.all(
    conversations.map(async (c) => {
      const me = c.participants.find((p) => p.userId === user.id)
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: c.id,
          deletedAt: null,
          senderId: { not: user.id },
          createdAt: { gt: me?.lastReadAt || new Date(0) }
        }
      })
      return {
        id: c.id,
        type: c.type,
        name: c.name,
        imageUrl: c.imageUrl,
        updatedAt: c.updatedAt,
        unreadCount,
        participants: c.participants.map((p) => ({ id: p.user.id, fullName: p.user.fullName, profileImageUrl: p.user.profileImageUrl })),
        lastMessage: c.messages[0]
          ? { content: c.messages[0].content, senderName: c.messages[0].sender.fullName, createdAt: c.messages[0].createdAt }
          : null
      }
    })
  )

  return ok({ conversations: result })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorized()
  if (!(await hasPermission(user.role, 'chat.use'))) return forbidden('You are not authorized to use internal chat.')

  const body = await req.json().catch(() => null)
  const parsed = createConversationSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid conversation input.')

  if (parsed.data.type === 'CHANNEL' && !(await hasPermission(user.role, 'chat.manage_channels'))) {
    return forbidden('You are not authorized to create organizational channels.')
  }

  const participantIds = Array.from(new Set([user.id, ...parsed.data.participantIds]))

  // For a direct 1:1 chat, reuse an existing conversation between the same
  // two people instead of creating duplicates.
  if (parsed.data.type === 'DIRECT' && participantIds.length === 2) {
    const existing = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: participantIds.map((id) => ({ participants: { some: { userId: id } } }))
      }
    })
    if (existing) return ok({ conversation: existing })
  }

  const conversation = await prisma.conversation.create({
    data: {
      type: parsed.data.type,
      name: parsed.data.name,
      createdById: user.id,
      participants: {
        create: participantIds.map((id) => ({ userId: id, isAdmin: id === user.id }))
      }
    }
  })

  return ok({ conversation })
}
