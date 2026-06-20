export interface LaborRoleOption {
  id: string
  fullTitle: string
  abbreviation: string
  rackRate: number
}

export interface TeamMemberRow {
  id: string
  laborRoleId: string | null
  laborRoleName: string | null
  titleOverride: string | null
  abbreviationOverride: string | null
  rackRateOverride: number | null
  adjustedClientRate: number | null
  targetedResource: string | null
  order: number
}

export interface TeamGridProps {
  estimateId: string
  initialRows: TeamMemberRow[]
  laborRoles: LaborRoleOption[]
}

export type SaveState = 'idle' | 'saving' | 'error'
