import { getCurrentUser } from '@/lib/auth/getSession'
import { ok } from '@/lib/utils/apiResponse'

export async function GET() {
  const user = await getCurrentUser()
  return ok({ user })
}
