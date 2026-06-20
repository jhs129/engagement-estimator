export interface StoryTeamMemberHours {
  teamMemberId: string
  hours: number
}

export interface StoryRow {
  id: string
  epicId: string
  storyTask: string
  description: string | null
  assumptions: string | null
  deliverables: string | null
  disabled: boolean
  testable: boolean
  estimateLow: number | null
  estimateHigh: number | null
  estimateMean: number | null
  order: number
  staffingAllocations: StoryTeamMemberHours[]
}

export interface EpicGroup {
  id: string
  name: string
  isFoundation: boolean
}

export interface TeamMemberCol {
  id: string
  abbreviation: string
  title: string
}

export interface StoriesGridProps {
  estimateId: string
  initialStories: StoryRow[]
  epics: EpicGroup[]
  teamMembers: TeamMemberCol[]
}

export type SaveState = 'idle' | 'saving' | 'error'
