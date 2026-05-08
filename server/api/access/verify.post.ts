import { readBody, createError } from 'h3'
import { timingSafeEqual } from 'node:crypto'

// Access-control credential check moved server-side so the password is no
// longer bundled into the client JS. This is still an env-configured shared
// credential and is intended as a soft gate only — the proper auth rebuild
// (Sprint 1) replaces this entire pattern. Do not extend this surface.

const safeEqual = (a: string, b: string): boolean => {
  const ab = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const validUser = String((config as any).accessControlUsername || '').trim()
  const validPass = String((config as any).accessControlPassword || '')

  if (!validUser || !validPass) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Access control is not configured',
    })
  }

  const body = await readBody<{ username?: string; password?: string }>(event)
  const submittedUser = String(body?.username || '').trim()
  const submittedPass = String(body?.password || '')

  if (!submittedUser || !submittedPass) {
    throw createError({ statusCode: 400, statusMessage: 'Missing credentials' })
  }

  const ok = safeEqual(submittedUser, validUser) && safeEqual(submittedPass, validPass)

  if (!ok) {
    // Generic message — never reveal which field was wrong.
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  return { ok: true }
})
