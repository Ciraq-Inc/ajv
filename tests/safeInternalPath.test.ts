import { describe, expect, it } from 'vitest'
import { safeInternalPath } from '../utils/safeInternalPath'

describe('safeInternalPath', () => {
  it.each([
    ['/admin/dashboard', '/admin/dashboard'],
    ['/admin/oauth/authorize?client_id=a&redirect_uri=https%3A%2F%2Fx.test', '/admin/oauth/authorize?client_id=a&redirect_uri=https%3A%2F%2Fx.test'],
    ['/data/consumer', '/data/consumer'],
  ])('keeps the in-app path %s', (input, expected) => {
    expect(safeInternalPath(input)).toBe(expected)
  })

  it.each([
    'https://evil.example/admin',
    '//evil.example',
    '/\\evil.example',
    '\\\\evil.example',
    'javascript:alert(1)',
    'admin/dashboard',
    '/\t/evil.example',
    '',
    null,
    undefined,
  ])('rejects %j', (input) => {
    expect(safeInternalPath(input as string | null | undefined)).toBeNull()
  })
})
