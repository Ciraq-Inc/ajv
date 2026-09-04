export const isSessionError = (error: unknown): boolean => {
  const status = Number((error as { status?: unknown } | null)?.status)
  if (status === 401 || status === 403) return true

  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return /session expired|unauthori[sz]ed|invalid token|log in again|authentication required/.test(message)
}

export const sessionExpiredMessage = 'Your session has expired. Sign in again to continue.'
