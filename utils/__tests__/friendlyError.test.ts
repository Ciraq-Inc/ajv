import { describe, expect, it } from 'vitest'
import { friendlyApiMessage, SERVER_PROBLEM, NETWORK_PROBLEM } from '../friendlyError'

describe('friendlyApiMessage', () => {
  it('hides database wording behind a plain sentence', () => {
    expect(friendlyApiMessage("Table 'rigel_medsgh_db.customer_verified_emails' doesn't exist", 500)).toBe(SERVER_PROBLEM)
    expect(friendlyApiMessage('ER_BAD_FIELD_ERROR: Unknown column', 400)).toBe(SERVER_PROBLEM)
    expect(friendlyApiMessage('connect ECONNREFUSED 127.0.0.1:3307', 502)).toBe(SERVER_PROBLEM)
  })

  it('replaces any server error message with the plain sentence', () => {
    expect(friendlyApiMessage('Internal Server Error', 500)).toBe(SERVER_PROBLEM)
    expect(friendlyApiMessage('', 503)).toBe(SERVER_PROBLEM)
  })

  it('keeps deliberate messages the person can act on', () => {
    expect(friendlyApiMessage('Incorrect phone number or password', 401)).toBe('Incorrect phone number or password')
    expect(friendlyApiMessage('Too many attempts. Try again in 15 minutes.', 429)).toBe('Too many attempts. Try again in 15 minutes.')
  })

  it('explains a lost connection, and a reply that is not JSON', () => {
    expect(friendlyApiMessage('Failed to fetch', 0)).toBe(NETWORK_PROBLEM)
    expect(friendlyApiMessage('NetworkError when attempting to fetch resource.', 0)).toBe(NETWORK_PROBLEM)
    expect(friendlyApiMessage('Unexpected token < in JSON at position 0', 502)).toBe(SERVER_PROBLEM)
  })
})
