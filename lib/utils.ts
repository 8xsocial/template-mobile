/**
 * Shared utility helpers.
 */

/** Returns initials from a display name (up to 2 characters). */
export function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** Delay for N milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Returns true if the email looks valid. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/**
 * Format a date relative to now (Today, Yesterday, or locale date string).
 */
export function formatRelativeDate(date: Date | string): string {
  const d     = typeof date === 'string' ? new Date(date) : date
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (target.getTime() === today.getTime())     return 'Today'
  if (target.getTime() === yesterday.getTime()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * Darken or lighten a hex colour by a given amount (−255 to +255).
 * Negative values darken; positive values lighten.
 */
export function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, Math.min(255, (num >> 16) + amount))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount))
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount))
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}
