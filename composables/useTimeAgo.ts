/**
 * timeAgo — converts a date string to a human-readable relative label.
 *
 * Rules:
 *   - Same calendar day  → "Today at 14:32"
 *   - Previous day       → "Yesterday at 09:15"
 *   - Within 7 days      → "3 days ago"
 *   - Same year, older   → "10 May"
 *   - Different year     → "10 May 2023"
 */
export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return ''

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''

  const now = new Date()

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const diffDays = Math.round((todayStart.getTime() - dateStart.getTime()) / 86400000)

  const timeLabel = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  if (diffDays === 0) return `Today at ${timeLabel}`
  if (diffDays === 1) return `Yesterday at ${timeLabel}`
  if (diffDays < 7) return `${diffDays} days ago`

  const sameYear = date.getFullYear() === now.getFullYear()
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

export function useTimeAgo() {
  return { timeAgo }
}
