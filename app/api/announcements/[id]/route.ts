import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/getSession'
import { hasPermission } from '@/lib/permissions/permissions'
import { logActivity } from '@/lib/security/audit'
import { ok, fail, unauthorized, forbidden, notFound } from '@/lib/utils/apiResponse'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getCurrentUser()
  if (!admin) return unauthorized()
  if (!(await hasPermission(admin.role, 'announcements.manage'))) return forbidden()

  const existing = await prisma.announcement.findUnique({ where: { id: params.id } })
  if (!existing) return notFound()

  const body = await req.json().catch(() => ({}))
  const published = typeof body.published === 'boolean' ? body.published : undefined

  const updated = await prisma.announcement.update({
    where: { id: params.id },
    data: {
      title: body.title ?? undefined,
      body: body.body ?? undefined,
      targetRoles: body.targetRoles ?? undefined,
      publishedAt: published === undefined ? undefined : published ? new Date() : null
    }
  })

  await logActivity({ userId: admin.id, action: 'ANNOUNCEMENT_UPDATED', module: 'announcements', status: 'SUCCESS', metadata: { announcementId: updated.id } })
  return ok({ announcement: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getCurrentUser()
  if (!admin) return unauthorized()
  if (!(await hasPermission(admin.role, 'announcements.manage'))) return forbidden()

  await prisma.announcement.delete({ where: { id: params.id } }).catch(() => null)
  await logActivity({ userId: admin.id, action: 'ANNOUNCEMENT_DELETED', module: 'announcements', status: 'SUCCESS', metadata: { announcementId: params.id } })
  return ok({ success: true })
}
