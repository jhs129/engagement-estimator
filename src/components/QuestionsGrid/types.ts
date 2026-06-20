export interface QuestionRow {
  id: string
  type: 'Question' | 'Assumption'
  description: string
  notes: string | null
  order: number
}

export interface QuestionsGridProps {
  estimateId: string
  initialRows: QuestionRow[]
}

export type SaveState = 'idle' | 'saving' | 'error'
