import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/auth/password'
import { createSession, SESSION_COOKIE } from '@/lib/auth/session'
import { loginSchema } from '@/lib/validation/schemas'
import { logActivity } from '@/lib/security/audit'
import { checkRateLimit } from '@/lib/security/rateLimit'
import { ok, fail } from '@/lib/utils/apiResponse'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'

  if (!checkRateLimit(`login:${ip}`, 10, 5 * 60 * 1000)) {
    return fail('Too many login attempts. Please wait a few minutes and try again.', 429)
  }

  const body = await req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return fail('Please enter a username and password.', 400)
  }

  const { username, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { username }, include: { role: true } })

  // Constant-shaped response whether the user exists or not, so the error
  // never reveals which part (username vs password) was wrong.
  if (!user) {
    await logActivity({ action: 'LOGIN_FAILED', module: 'auth', status: 'FAILURE', ip, metadata: { username } })
    return fail('Invalid username or password.', 401)
  }

  if (user.status !== 'ACTIVE') {
    await logActivity({ userId: user.id, action: 'LOGIN_FAILED', module: 'auth', status: 'FAILURE', ip, metadata: { reason: 'disabled' } })
    return fail('This account has been disabled. Contact your administrator.', 403)
  }

  const validPassword = await verifyPassword(password, user.passwordHash)
  if (!validPassword) {
    await logActivity({ userId: user.id, action: 'LOGIN_FAILED', module: 'auth', status: 'FAILURE', ip, metadata: { reason: 'bad_password' } })
    return fail('Invalid username or password.', 401)
  }

  const userAgent = req.headers.get('user-agent') || undefined
  const { token, expiresAt } = await createSession(user.id, user.role.name, userAgent, ip)

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
  await logActivity({ userId: user.id, action: 'LOGIN_SUCCESS', module: 'auth', status: 'SUCCESS', ip })

  const response = ok({
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role.name,
      roleLabel: user.role.label,
      profileImageUrl: user.profileImageUrl
    }
  })

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt
  })

  return response
}
