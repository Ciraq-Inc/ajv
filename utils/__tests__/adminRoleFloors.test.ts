import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { ADMIN_PAGE_FLOORS, canAccessAdminPage } from '../adminRoleFloors'

const ROLE_RANK: Record<string, number> = {
  data_consumer: 0,
  business_analyst: 1,
  order_processor: 2,
  support_agent: 3,
  auditor: 4,
  manager: 5,
  admin: 6,
  super_admin: 7,
}
const hasRoleFor = (role: string) => (required: string) =>
  ROLE_RANK[role] !== undefined && ROLE_RANK[required] !== undefined && ROLE_RANK[role] >= ROLE_RANK[required]

describe('canAccessAdminPage', () => {
  it('lets a role through exactly when it meets the floor', () => {
    expect(canAccessAdminPage(hasRoleFor('manager'), '/admin/signups')).toBe(true)
    expect(canAccessAdminPage(hasRoleFor('auditor'), '/admin/signups')).toBe(false)
    expect(canAccessAdminPage(hasRoleFor('admin'), '/admin/sms-billing')).toBe(false)
    expect(canAccessAdminPage(hasRoleFor('super_admin'), '/admin/sms-billing')).toBe(true)
  })

  it('does not gate a page that has no floor', () => {
    expect(canAccessAdminPage(hasRoleFor('business_analyst'), '/admin/security')).toBe(true)
  })

  it('denies a page nobody has listed, rather than showing it by accident', () => {
    expect(canAccessAdminPage(hasRoleFor('super_admin'), '/admin/not-a-page')).toBe(false)
  })
})

// Every admin page must declare, in its own definePageMeta, the same floor this map holds:
// the route guard reads the page's meta, the sidebar reads the map.
const PAGES_DIR = join(__dirname, '..', '..', 'pages', 'admin')
const NOT_GATED = new Set(['/admin/login', '/admin/reset-password', '/admin/unauthorized', '/admin/oauth/authorize'])

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : full.endsWith('.vue') ? [full] : []
  })

const routeOf = (file: string): string => {
  const rel = relative(PAGES_DIR, file).split(sep).join('/').replace(/\.vue$/, '').replace(/\/index$/, '')
  return rel === 'index' ? '/admin' : `/admin/${rel}`
}

const declaredFloor = (file: string): string | null => {
  const src = readFileSync(file, 'utf8')
  return src.match(/requiredRole:\s*['"]([a-z_]+)['"]/)?.[1] ?? null
}

describe('admin pages agree with the floor map', () => {
  const pages = walk(PAGES_DIR).map((file) => ({ file, route: routeOf(file) })).filter((p) => !NOT_GATED.has(p.route))

  it.each(pages.map((p) => [p.route, p.file]))('%s', (route, file) => {
    expect(ADMIN_PAGE_FLOORS, `${route} is missing from ADMIN_PAGE_FLOORS`).toHaveProperty([route])
    expect(declaredFloor(file as string)).toBe(ADMIN_PAGE_FLOORS[route as string])
  })

  it('has no entries for pages that do not exist', () => {
    const real = new Set(pages.map((p) => p.route))
    expect(Object.keys(ADMIN_PAGE_FLOORS).filter((r) => !real.has(r))).toEqual([])
  })
})
