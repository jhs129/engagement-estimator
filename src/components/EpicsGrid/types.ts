export interface EpicRow {
  id: string
  name: string
  description: string | null
  isFoundation: boolean
  order: number
  storyHours: number
  foundationHours: number
  totalHours: number
  percent: number
}

export interface EpicsGridProps {
  estimateId: string
  initialRows: EpicRow[]
}

export type SaveState = 'idle' | 'saving' | 'error'
