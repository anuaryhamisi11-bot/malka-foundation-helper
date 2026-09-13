import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/getSession'
import { hasPermission } from '@/lib/permissions/permissions'
import { aiPromptSchema } from '@/lib/validation/schemas'
import { askAI } from '@/lib/ai/aiClient'
import { logActivity } from '@/lib/security/audit'
import { ok, fail, unauthorized, forbidden } from '@/lib/utils/apiResponse'

// Admin-only. The assistant never receives raw database access - this route
// gathers a small, pre-authorized summary (never passwords, hashes, tokens,
// or connection strings) and hands ONLY that text to the AI provider.
async function buildAuthorizedContext() {
  const [userStats, meetings, projects, notifications] = await Promise.all([
    prisma.user.groupBy({ by: ['status'], _count: true }),
    prisma.meeting.findMany({ orderBy: { startTime: 'desc' }, take: 10, select: { title: true, status: true, startTime: true } }),
    prisma.project.findMany({ orderBy: { updatedAt: 'desc' }, take: 10, select: { name: true, status: true } }),
    prisma.notification.count({ where: { isRead: false } })
  ])

  return `Organization snapshot (authorized administrative data only):
User status counts: ${JSON.stringify(userStats)}
Recent meetings: ${JSON.stringify(meetings)}
Recent projects: ${JSON.stringify(projects)}
Unread notifications across the portal: ${notifications}`
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentUser()
  if (!admin) return unauthorized()
  if (!(await hasPermission(admin.role, 'ai.use'))) return forbidden('The Admin AI assistant is restricted to authorized administrators.')

  const body = await req.json().catch(() => null)
  const parsed = aiPromptSchema.safeParse(body)
  if (!parsed.success) return fail('Please enter a message.')

  let conversation = parsed.data.conversationId
    ? await prisma.aIConversation.findFirst({ where: { id: parsed.data.conversationId, userId: admin.id } })
    : null

  if (!conversation) {
    conversation = await prisma.aIConversation.create({ data: { userId: admin.id, title: parsed.data.message.slice(0, 60) } })
  }

  await prisma.aIMessage.create({ data: { aiConversationId: conversation.id, role: 'USER', content: parsed.data.message } })

  const context = await buildAuthorizedContext()

  let reply: string
  try {
    reply = await askAI([
      { role: 'system', content: `You are the Admin AI assistant for the Malka Foundation Helper portal. Only use the authorized data provided below. Never invent user data, and never reveal secrets, passwords or credentials.\n\n${context}` },
      { role: 'user', content: parsed.data.message }
    ])
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'The AI assistant is not available right now.', 503)
  }

  await prisma.aIMessage.create({ data: { aiConversationId: conversation.id, role: 'ASSISTANT', content: reply } })
  await logActivity({ userId: admin.id, action: 'AI_QUERY', module: 'ai', status: 'SUCCESS' })

  return ok({ conversationId: conversation.id, reply })
}

export async function GET() {
  const admin = await getCurrentUser()
  if (!admin) return unauthorized()
  if (!(await hasPermission(admin.role, 'ai.use'))) return forbidden()

  const conversations = await prisma.aIConversation.findMany({
    where: { userId: admin.id },
    orderBy: { createdAt: 'desc' },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
    take: 5
  })

  return ok({ conversations })
}
