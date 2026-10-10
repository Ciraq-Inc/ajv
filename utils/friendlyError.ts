export const SERVER_PROBLEM = 'Something went wrong on our side. Please try again in a moment.'
export const NETWORK_PROBLEM = 'We could not reach MedsGH. Check your connection and try again.'

const NETWORK = /failed to fetch|networkerror|network request failed|load failed/i
const TECHNICAL = /\bER_[A-Z_]+|\bECONN|ETIMEDOUT|\btable '|doesn't exist|\bsql\b|unknown column|unexpected token|is not valid json|<!doctype|undefined is not|cannot read prop/i

/** Turns an error message from the wire into one a customer can act on. */
export const friendlyApiMessage = (message: string | undefined, status: number): string => {
  const text = (message ?? '').trim()
  if (NETWORK.test(text)) return NETWORK_PROBLEM
  if (status >= 500 || TECHNICAL.test(text)) return SERVER_PROBLEM
  return text || SERVER_PROBLEM
}
