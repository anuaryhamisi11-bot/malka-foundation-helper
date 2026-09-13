import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySessionToken, revokeSession } from '@/lib/auth/session'
import { logActivity } from '@/lib/security/audit'
import { ok } from '@/lib/utils/apiResponse'

export async function POST() {
  const token = cookies().get(SESSION_COOKIE)?.value
  if (token) {
    const payload = await verifySessionToken(token)
    if (payload) {
      await revokeSession(payload.sid)
      await logActivity({ userId: payload.sub, action: 'LOGOUT', module: 'auth', status: 'SUCCESS' })
    }
  }

  const response = ok({ success: true })
  response.cookies.delete(SESSION_COOKIE)
  return response
}
