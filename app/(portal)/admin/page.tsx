import { getCurrentUser } from '@/lib/auth/getSession'
import { hasPermission } from '@/lib/permissions/permissions'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function AdminOverviewPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!(await hasPermission(user.role, 'users.manage'))) redirect('/dashboard')

  const [totalUsers, activeUsers, disabledUsers, roleGroups, recentLogins, failedLogins, upcomingMeetings, activeProjects] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'DISABLED' } }),
      prisma.user.groupBy({ by: ['roleId'], _count: true }),
      prisma.auditLog.findMany({ where: { action: 'LOGIN_SUCCESS' }, orderBy: { createdAt: 'desc' }, take: 5, include: { user: true } }),
      prisma.auditLog.count({ where: { action: 'LOGIN_FAILED', createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } } }),
      prisma.meeting.count({ where: { startTime: { gte: new Date() } } }),
      prisma.project.count({ where: { status: 'ACTIVE' } })
    ])

  const roles = await prisma.role.findMany()
  const roleMap = new Map(roles.map((r) => [r.id, r.label]))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin overview</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Total users" value={totalUsers} />
        <Stat label="Active users" value={activeUsers} />
        <Stat label="Disabled users" value={disabledUsers} />
        <Stat label="Failed logins (24h)" value={failedLogins} />
        <Stat label="Upcoming meetings" value={upcomingMeetings} />
        <Stat label="Active projects" value={activeProjects} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-3">Role distribution</h2>
          <ul className="space-y-1 text-sm">
            {roleGroups.map((g) => (
              <li key={g.roleId} className="flex justify-between border-b last:border-0 py-1">
                <span>{roleMap.get(g.roleId) || 'Unknown'}</span>
                <span className="font-semibold">{g._count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">Recent logins</h2>
          <ul className="space-y-1 text-sm">
            {recentLogins.map((log) => (
              <li key={log.id} className="flex justify-between border-b last:border-0 py-1">
                <span>{log.user?.fullName || 'Unknown user'}</span>
                <span className="text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
