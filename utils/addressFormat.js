const NOISY_ADDRESS_PARTS = [
  'ghana',
  'ghana.',
  'greater accra region',
  'accra metropolitan',
  'ayawaso west municipal district',
  'ayawaso east municipal district',
  'ayawaso north municipal district',
  'ga east municipal district',
  'ga west municipal district',
  'ga south municipal district',
  'tema metropolitan',
  'ghana post',
  'digital address'
]

const CITY_PARTS = [
  'accra',
  'kumasi',
  'tema',
  'takoradi',
  'tamale',
  'cape coast',
  'kasoa',
  'ho',
  'koforidua',
  'sunyani',
  'wa',
  'bolgatanga'
]

const ROAD_KEYWORDS = [
  'road',
  'rd',
  'street',
  'st',
  'avenue',
  'ave',
  'lane',
  'ln',
  'close',
  'crescent',
  'high street',
  'drive',
  'dr',
  'way',
  'junction'
]

const splitAddressParts = (value) => {
  return String(value || '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
}

const normalizeAddressPart = (value) => {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\b[A-Z]{1,3}-\d{2,6}-\d{1,6}\b/gi, '')
    .replace(/\bG[A-Z]-?\d{2,6}-\d{1,6}\b/gi, '')
    .replace(/\b[A-Z]{2}\s?\d{1,4}\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

const isUsefulAddressPart = (value) => {
  if (!value) return false

  const normalized = value.toLowerCase().trim()
  if (!normalized) return false
  if (NOISY_ADDRESS_PARTS.includes(normalized)) return false
  if (/^\d+$/.test(normalized)) return false

  return true
}

export const getCleanAddressParts = (value) => {
  const parts = splitAddressParts(value)
    .map(normalizeAddressPart)
    .filter(isUsefulAddressPart)

  const seen = new Set()
  const deduped = parts.filter((part) => {
    const key = part.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const scored = deduped.map((part, index) => {
    const normalized = part.toLowerCase()
    const wordCount = normalized.split(/\s+/).filter(Boolean).length
    let score = index

    if (index === 0) score -= 10
    if (CITY_PARTS.includes(normalized)) score += 30
    if (ROAD_KEYWORDS.some((keyword) => normalized.includes(keyword))) score += 10
    if (/\d/.test(normalized)) score += 12
    if (wordCount >= 5) score += 6
    if (wordCount <= 2 && !CITY_PARTS.includes(normalized)) score -= 2

    return { part, score, index }
  })

  return scored
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score
      return a.index - b.index
    })
    .map(entry => entry.part)
}

export const getCompactAddressLines = (value, { primaryCount = 3 } = {}) => {
  const parts = getCleanAddressParts(value)
  if (!parts.length) {
    return {
      parts: [],
      primary: '',
      secondary: ''
    }
  }

  return {
    parts,
    primary: parts.slice(0, primaryCount).join(', '),
    secondary: parts.slice(primaryCount).join(', ')
  }
}

export const formatCompactAddress = (value, { primaryCount = 3, fallback = '' } = {}) => {
  const { primary, secondary } = getCompactAddressLines(value, { primaryCount })
  return primary || secondary || fallback
}
