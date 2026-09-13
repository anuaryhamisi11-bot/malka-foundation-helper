import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Middleware runs on the Edge runtime, so it uses `jose` directly rather than
// the Node-only session helpers in lib/auth. It only checks that a valid,
// unexpired session token is present. Full permission checks (which pages
// and API routes a role may use) happen server-side again in every page and
// API route via lib/permissions - this is defense in depth, not the only gate.

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/favicon.ico']

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true
  if (pathname.startsWith('/_next')) return true
  if (pathname.startsWith('/preview')) return true
  if (pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|css|js)$/)) return true
  return false
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  const token = req.cookies.get('mfh_session')?.value

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret-change-me')
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    const res = NextResponse.redirect(url)
    res.cookies.delete('mfh_session')
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|preview).*)']
}
