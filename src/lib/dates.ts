/** Tarih yardımcıları — kütüphanesiz, yerel saat dilimiyle çalışır. */

/** Haftanın pazartesisi 00:00 (Avrupa/Türkiye usulü). */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = (d.getDay() + 6) % 7 // Pazartesi = 0
  d.setDate(d.getDate() - day)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/** Date → "2026-10-23" (yerel saate göre, UTC kayması olmadan) */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** "2026-10-23" → yerel gece yarısı Date */
export function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

/** Varsayılan aralık: bu haftanın pazartesi–pazar */
export function thisWeekRange(now = new Date()) {
  const from = startOfWeek(now)
  return { from: toISODate(from), to: toISODate(addDays(from, 6)) }
}

export function formatDayHeading(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

export function formatTime(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

export function formatShortRange(from: Date, to: Date, locale: string) {
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
  return `${fmt.format(from)} – ${fmt.format(to)}`
}
