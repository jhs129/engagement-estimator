export interface StaffingWeekEntry {
  weekStartDate: string
  hours: number
}

export interface StaffingMemberRow {
  teamMemberId: string
  title: string
  abbreviation: string
  plannedHours: number
  staffedHours: number
  staffingDelta: number
  deltaStatus: 'green' | 'yellow' | 'red'
  weeklyHours: Record<string, number>
}

export interface StaffingGridProps {
  estimateId: string
  initialRows: StaffingMemberRow[]
  weekColumns: string[]
  estimatedStartDate: string | null
}
