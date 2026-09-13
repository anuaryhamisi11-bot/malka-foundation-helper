import { getCurrentUser } from '@/lib/auth/getSession'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const [upcomingMeetings, myProjects, unreadNotifications, recentDocuments] = await Promise.all([
    prisma.meeting.findMany({
      where: {
        startTime: { gte: new Date() },
        OR: [{ participants: { some: { userId: user.id } } }, { createdById: user.id }]
      },
      orderBy: { startTime: 'asc' },
      take: 5
    }),
    prisma.project.findMany({
      where: { OR: [{ coordinatorId: user.id }, { members: { some: { userId: user.id } } }] },
      take: 5,
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    prisma.document.findMany({
      where: { OR: [{ allowedRoles: { has: user.role } }, { uploadedById: user.id }] },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.fullName.split(' ')[0]}</h1>
        <p className="text-gray-500">{user.roleLabel} &middot; Malka Foundation Helper</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Unread notifications" value={unreadNotifications} href="/notifications" />
        <StatCard label="Upcoming meetings" value={upcomingMeetings.length} href="/meetings" />
        <StatCard label="Active projects" value={myProjects.length} href="/projects" />
        <StatCard label="Recent documents" value={recentDocuments.length} href="/documents" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">Upcoming meetings</h2>
          {upcomingMeetings.length === 0 && <p className="text-sm text-gray-500">No upcoming meetings.</p>}
          <ul className="space-y-2">
            {upcomingMeetings.map((m) => (
              <li key={m.id} className="flex justify-between text-sm border-b last:border-0 py-2">
                <Link href={`/meetings/${m.id}`} className="font-medium text-brand-700 hover:underline">
                  {m.title}
                </Link>
                <span className="text-gray-500">{new Date(m.startTime).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">My projects</h2>
          {myProjects.length === 0 && <p className="text-sm text-gray-500">No projects assigned yet.</p>}
          <ul className="space-y-2">
            {myProjects.map((p) => (
              <li key={p.id} className="flex justify-between text-sm border-b last:border-0 py-2">
                <Link href={`/projects/${p.id}`} className="font-medium text-brand-700 hover:underline">
                  {p.name}
                </Link>
                <span className="badge bg-gray-100 text-gray-700">{p.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="card hover:shadow-md transition-shadow block">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </Link>
  )
}
