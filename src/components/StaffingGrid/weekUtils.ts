/**
 * Pure date arithmetic for week column generation.
 * Never uses new Date() without explicit arguments.
 */

/** Parse a YYYY-MM-DD string into year, month (0-based), day components. */
function parseIsoDate(iso: string): { year: number; month: number; day: number } {
  const parts = iso.split('-')
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10) - 1,
    day: parseInt(parts[2], 10),
  }
}

/** Format a Date to YYYY-MM-DD. */
function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Format a Date to MM/DD for column headers. */
export function formatWeekHeader(iso: string): string {
  const { year, month, day } = parseIsoDate(iso)
  const d = new Date(year, month, day)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dy = String(d.getDate()).padStart(2, '0')
  return `${m}/${dy}`
}

/** Format a Date to a readable full date for tooltips. */
export function formatWeekTooltip(iso: string): string {
  const { year, month, day } = parseIsoDate(iso)
  const d = new Date(year, month, day)
  return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Snap a YYYY-MM-DD date to the nearest past (or same) Monday.
 * Monday = 1 in JS Date (0=Sun, 1=Mon, ..., 6=Sat).
 */
export function snapToMonday(iso: string): string {
  const { year, month, day } = parseIsoDate(iso)
  const d = new Date(year, month, day)
  const dow = d.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  // Days to subtract: 0 if already Monday, (dow - 1) otherwise, but if Sunday (0) subtract 6
  const daysBack = dow === 0 ? 6 : dow - 1
  const monday = new Date(year, month, day - daysBack)
  return toIsoDate(monday)
}

/** Add N weeks to a YYYY-MM-DD date. */
function addWeeks(iso: string, weeks: number): string {
  const { year, month, day } = parseIsoDate(iso)
  const d = new Date(year, month, day + weeks * 7)
  return toIsoDate(d)
}

/**
 * Generate all Monday YYYY-MM-DD strings from startDate through endDate (inclusive).
 */
function allMondaysBetween(startIso: string, endIso: string): string[] {
  const { year: sy, month: sm, day: sd } = parseIsoDate(startIso)
  const { year: ey, month: em, day: ed } = parseIsoDate(endIso)
  const start = new Date(sy, sm, sd)
  const end = new Date(ey, em, ed)
  const result: string[] = []
  const current = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  while (current <= end) {
    result.push(toIsoDate(current))
    current.setDate(current.getDate() + 7)
  }
  return result
}

/**
 * Compute the full set of week columns to display.
 *
 * startDate: YYYY-MM-DD (already snapped to Monday)
 * existingWeeks: array of YYYY-MM-DD strings (weeks with data)
 *
 * Logic:
 *   endDate = max(latestWeekWithData, startDate + 12 weeks) + 4 additional weeks
 */
export function getWeekColumns(startDate: string, existingWeeks: string[]): string[] {
  const snappedStart = snapToMonday(startDate)

  // Find the latest week with data
  const sortedExisting = [...existingWeeks].sort()
  const latestExisting = sortedExisting.length > 0 ? sortedExisting[sortedExisting.length - 1] : null

  // startDate + 12 weeks
  const twelveWeeksOut = addWeeks(snappedStart, 12)

  // max(latestExisting, twelveWeeksOut)
  let rangeEnd: string
  if (latestExisting && latestExisting > twelveWeeksOut) {
    rangeEnd = latestExisting
  } else {
    rangeEnd = twelveWeeksOut
  }

  // + 4 additional weeks
  const endDate = addWeeks(rangeEnd, 4)

  return allMondaysBetween(snappedStart, endDate)
}

/** Fallback Monday when no date is available. Using 2025-01-06 (a known Monday). */
export const FALLBACK_START_DATE = '2025-01-06'
