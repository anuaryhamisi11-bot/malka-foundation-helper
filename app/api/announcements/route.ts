import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/getSession'
import { hasPermission } from '@/lib/permissions/permissions'
import { createAnnouncementSchema } from '@/lib/validation/schemas'
import { logActivity } from '@/lib/security/audit'
import { ok, fail, unauthorized, forbidden } from '@/lib/utils/apiResponse'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return unauthorized()

  const announcements = await prisma.announcement.findMany({
    where: {
      publishedAt: { not: null },
      OR: [{ targetRoles: { isEmpty: true } }, { targetRoles: { has: user.role } }]
    },
    include: { createdBy: true },
    orderBy: { publishedAt: 'desc' }
  })

  return ok({
    announcements: announcements.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      publishedAt: a.publishedAt,
      createdByName: a.createdBy.fullName
    }))
  })
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentUser()
  if (!admin) return unauthorized()
  if (!(await hasPermission(admin.role, 'announcements.manage'))) return forbidden()

  const body = await req.json().catch(() => null)
  const parsed = createAnnouncementSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid announcement input.')

  const announcement = await prisma.announcement.create({
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      targetRoles: parsed.data.targetRoles,
      publishedAt: parsed.data.published ? new Date() : null,
      createdById: admin.id
    }
  })

  if (parsed.data.published) {
    const recipients = await prisma.user.findMany({
      where: parsed.data.targetRoles.length ? { role: { name: { in: parsed.data.targetRoles } } } : {},
      select: { id: true }
    })
    await prisma.notification.createMany({
      data: recipients.map((r) => ({
        userId: r.id,
        type: 'ANNOUNCEMENT',
        title: 'New announcement',
        body: parsed.data.title,
        link: '/announcements'
      }))
    })
  }

  await logActivity({ userId: admin.id, action: 'ANNOUNCEMENT_CREATED', module: 'announcements', status: 'SUCCESS', metadata: { announcementId: announcement.id } })

  return ok({ announcement })
}
