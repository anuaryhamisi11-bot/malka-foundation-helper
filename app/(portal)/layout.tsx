import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/getSession'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex">
      <Sidebar role={user.role} className="w-64 bg-brand-900 hidden md:flex md:flex-col" />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar fullName={user.fullName} roleLabel={user.roleLabel} profileImageUrl={user.profileImageUrl} />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
