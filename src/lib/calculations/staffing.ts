interface StaffingDelta {
  plannedHours: number
  staffedHours: number
  delta: number
  status: 'green' | 'yellow' | 'red'
}

export function calculateStaffingDelta(
  plannedHours: number,
  staffedHours: number
): StaffingDelta {
  const delta = staffedHours - plannedHours
  const absDelta = Math.abs(delta)
  const base = Math.max(plannedHours, staffedHours)
  let status: 'green' | 'yellow' | 'red'
  if (base === 0) {
    status = 'green'
  } else if (absDelta / base <= 0.1) {
    status = 'green'
  } else if (absDelta / base <= 0.25) {
    status = 'yellow'
  } else {
    status = 'red'
  }
  return { plannedHours, staffedHours, delta, status }
}

export function calculateBalanceCheck(
  meanHours: number | null,
  totalStaffingHours: number
): 'none' | 'green' | 'yellow' | 'red' {
  const mean = meanHours ?? 0
  if (mean === 0 && totalStaffingHours === 0) return 'none'
  const diff = Math.abs(mean - totalStaffingHours)
  const base = Math.max(mean, totalStaffingHours)
  if (diff / base <= 0.1) return 'green'
  if (diff / base <= 0.25) return 'yellow'
  return 'red'
}
