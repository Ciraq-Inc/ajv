import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Customer-facing files must use the brand/ink tokens only (XOS refresh).
const FILES = [
  'layouts/customer.vue',
  'pages/[pharmacy]/index.vue',
  'pages/[pharmacy]/orders.vue',
  'pages/[pharmacy]/products.vue',
  'pages/drugs.vue',
  'pages/index.vue',
  'pages/error.vue',
  'pages/privacy.vue',
  'pages/customer/index.vue',
  'pages/customer/activate.vue',
  'pages/customer/verify-email.vue',
  'pages/customer/reset-password.vue',
  'pages/oauth/authorize.vue',
  'components/PharmacySelection.vue',
  'components/Navbar.vue',
  'components/Login.vue',
  'components/GuestCheckoutForm.vue',
  'components/ProductsTable.vue',
  'components/ProductsGrid.vue',
  'components/OrderSuccessModal.vue',
  'components/CancelOrderModal.vue',
  'components/ConfirmDialog.vue',
  'components/NotFound.vue',
  'components/CartSidebar.vue',
  'components/auth/EmailResetPassword.vue',
  'components/home/HomeQuickRequest.vue',
  'components/home/HomeHowItWorks.vue',
  'components/customers/orderRequests.vue',
]

const PALETTE = /\b(zinc|slate|gray|emerald|green|teal|rose|indigo|violet|blue|purple|orange|yellow|stone|neutral)-\d{2,3}\b/
const HEX = /\[#[0-9a-fA-F]{3,8}\]|(?<![&\w])#[0-9a-fA-F]{6}\b/
const TINY = /text-\[(9|10|11|13)px\]/
const GRAD = /gradient|(?<=[\s"'])(from|via|to)-[a-z]/

describe.each(FILES)('%s', (file) => {
  const src = readFileSync(resolve(__dirname, '../..', file), 'utf8')
  const tpl = src.slice(0, src.indexOf('<script') > 0 ? src.indexOf('<script') : undefined).replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ''))
  const lines = (re: RegExp) => tpl.split('\n').map((l, i) => (re.test(l) ? `${i + 1}: ${l.trim().slice(0, 80)}` : '')).filter(Boolean)

  it('uses brand/ink tokens, not stock palettes', () => expect(lines(PALETTE)).toEqual([]))
  it('has no hard-coded hex colours', () => expect(lines(HEX)).toEqual([]))
  it('has no text smaller than 12px', () => expect(lines(TINY)).toEqual([]))
  it('has no gradients', () => expect(lines(GRAD)).toEqual([]))
})
