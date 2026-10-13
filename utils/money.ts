// One way to show an amount of money in the admin portal: "GHS 1,234.50".
const amountFormat = new Intl.NumberFormat('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

type Amount = number | string | null | undefined

const toNumber = (value: Amount): number => {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

/** The number alone, for tables and inputs whose label already says GHS. */
export const formatAmount = (value: Amount): string => {
  const text = amountFormat.format(Math.abs(toNumber(value)))
  // A tiny negative rounds to 0.00; never show it as -0.00.
  return toNumber(value) < 0 && text !== '0.00' ? `-${text}` : text
}

export const formatGhs = (value: Amount): string => {
  const text = formatAmount(value)
  return text.startsWith('-') ? `-GHS ${text.slice(1)}` : `GHS ${text}`
}

export const formatSignedGhs = (value: Amount): string => {
  const text = formatGhs(value)
  return toNumber(value) > 0 && text !== 'GHS 0.00' ? `+${text}` : text
}
