import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { formatAmount, formatGhs, formatSignedGhs } from '../money'

// Every amount the admin portal shows reads the same way: "GHS 1,234.50", always two decimals,
// never "NaN" and never a bare "1" where "1.00" is meant.
describe('formatGhs', () => {
  it('always shows two decimals with a thousands separator', () => {
    expect(formatGhs(5)).toBe('GHS 5.00')
    expect(formatGhs(1234.5)).toBe('GHS 1,234.50')
    expect(formatGhs(1234567.891)).toBe('GHS 1,234,567.89')
  })

  it('reads numeric strings from the API', () => {
    expect(formatGhs('12.5')).toBe('GHS 12.50')
  })

  it('shows zero for a missing or unreadable amount instead of NaN', () => {
    expect(formatGhs(null)).toBe('GHS 0.00')
    expect(formatGhs(undefined)).toBe('GHS 0.00')
    expect(formatGhs('')).toBe('GHS 0.00')
    expect(formatGhs('abc')).toBe('GHS 0.00')
  })

  it('puts the minus sign in front of the currency', () => {
    expect(formatGhs(-5)).toBe('-GHS 5.00')
  })

  it('does not show negative zero', () => {
    expect(formatGhs(-0.001)).toBe('GHS 0.00')
  })
})

describe('formatAmount', () => {
  it('is the same number without the currency, for tables whose header says GHS', () => {
    expect(formatAmount(1234.5)).toBe('1,234.50')
    expect(formatAmount(null)).toBe('0.00')
  })
})

describe('formatSignedGhs', () => {
  it('marks gains and losses and leaves zero unmarked', () => {
    expect(formatSignedGhs(12)).toBe('+GHS 12.00')
    expect(formatSignedGhs(-12)).toBe('-GHS 12.00')
    expect(formatSignedGhs(0)).toBe('GHS 0.00')
  })
})

// A hand-written "GHS {{ x.toFixed(2) }}" drifts: no thousands separator, "GH₵" in one place and
// "₵" in another, a bare "1" where "1.00" is meant. The admin portal goes through utils/money.
describe('admin screens', () => {
  const ROOT = join(__dirname, '..', '..')
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) return files(full)
      return /\.(vue|ts|js)$/.test(name) && !full.includes('__tests__') ? [full] : []
    })
  const surfaces = [
    'pages/admin', 'components/admin', 'components/sms', 'components/order-requests', 'components/payables',
    'composables/useAccountsWorkbench.ts', 'composables/useOrderRequestFormatters.ts', 'utils/constants/sms.js',
  ]
  const sources = surfaces.flatMap((entry) => {
    const full = join(ROOT, entry)
    return (statSync(full).isDirectory() ? files(full) : [full]).map((file) => ({
      file: relative(ROOT, file).split(sep).join('/'),
      text: readFileSync(file, 'utf8'),
    }))
  })

  it('never writes a currency symbol or code in front of a hand-formatted number', () => {
    const offenders = sources.flatMap(({ file, text }) =>
      text.split(/\r?\n/)
        .map((line, i) => ({ file, line: i + 1, text: line.trim() }))
        .filter((l) => /(GH[S₵]|₵) ?(\{\{|\$\{)/.test(l.text) && !/formatGhs|formatCurrency|formatMoney|formatAmount|formatSignedCurrency/.test(l.text))
        .map((l) => `${l.file}:${l.line}`))
    expect(offenders).toEqual([])
  })

  it('never builds an amount with toFixed(2) next to a currency', () => {
    const offenders = sources.flatMap(({ file, text }) =>
      text.split(/\r?\n/)
        .map((line, i) => ({ file, line: i + 1, text: line }))
        .filter((l) => /GH[S₵][^'"`]*\.toFixed\(2\)|₵[^'"`]*\.toFixed\(2\)/.test(l.text))
        .map((l) => `${l.file}:${l.line}`))
    expect(offenders).toEqual([])
  })
})
