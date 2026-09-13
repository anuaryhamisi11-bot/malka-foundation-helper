import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/getSession'
import { hasPermission } from '@/lib/permissions/permissions'
import { ok, unauthorized, forbidden } from '@/lib/utils/apiResponse'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorized()
  if (!(await hasPermission(user.role, 'audit.view'))) return forbidden()

  const { searchParams } = req.nextUrl
  const module_ = searchParams.get('module') || undefined
  const action = searchParams.get('action') || undefined
  const status = searchParams.get('status') || undefined
  const userId = searchParams.get('userId') || undefined

  const logs = await prisma.auditLog.findMany({
    where: {
      module: module_,
      action: action,
      status: status,
      userId: userId
    },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 200
  })

  return ok({
    logs: logs.map((l) => ({
      id: l.id,
      action: l.action,
      module: l.module,
      status: l.status,
      metadata: l.metadata,
      userName: l.user?.fullName || 'System',
      createdAt: l.createdAt
    }))
  })
}
