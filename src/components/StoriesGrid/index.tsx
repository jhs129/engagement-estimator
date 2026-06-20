'use client'

import { useState, useCallback } from 'react'
import type { StoryRow, EpicGroup, TeamMemberCol, StoriesGridProps } from './types'
import { StoryRowItem } from './StoryRowItem'
import { EpicGroupHeader } from './EpicGroupHeader'
import { exportStoriesToCsv } from './csvExport'

let localIdCounter = 0
function nextLocalId(): string {
  localIdCounter += 1
  return `local-${localIdCounter}`
}

const headerCellStyle: React.CSSProperties = {
  padding: '10px 10px',
  fontFamily: 'var(--font-display)',
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--cc-gray-mid)',
  borderRight: '1px solid var(--cc-gray-light)',
  whiteSpace: 'nowrap',
  backgroundColor: 'var(--cc-parchment)',
}

const totalCellStyle: React.CSSProperties = {
  padding: '10px 10px',
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  fontWeight: 700,
  color: 'var(--cc-black)',
  borderRight: '1px solid var(--cc-gray-light)',
  textAlign: 'right',
  backgroundColor: 'var(--cc-parchment)',
}

export function StoriesGrid({
  estimateId,
  initialStories,
  epics,
  teamMembers,
}: StoriesGridProps) {
  const [stories, setStories] = useState<StoryRow[]>(initialStories)

  // Group stories by epic, ordered by epic list order, then story.order within group
  const epicOrder: Record<string, number> = {}
  epics.forEach((e, i) => {
    epicOrder[e.id] = i
  })

  const storiesByEpic: Record<string, StoryRow[]> = {}
  epics.forEach((e) => {
    storiesByEpic[e.id] = []
  })
  stories.forEach((s) => {
    if (!storiesByEpic[s.epicId]) storiesByEpic[s.epicId] = []
    storiesByEpic[s.epicId].push(s)
  })
  Object.keys(storiesByEpic).forEach((epicId) => {
    storiesByEpic[epicId].sort((a, b) => a.order - b.order)
  })

  const handlePatchStory = useCallback(
    async (storyId: string, changes: Partial<StoryRow>) => {
      // Optimistic update
      setStories((prev) =>
        prev.map((s) => (s.id === storyId ? { ...s, ...changes } : s))
      )

      if (storyId.startsWith('local-')) return

      try {
        const res = await fetch(`/api/estimates/${estimateId}/stories/${storyId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(changes),
        })
        if (!res.ok) {
          console.error('Failed to save story changes', await res.text())
        }
      } catch (err) {
        console.error('Error saving story', err)
      }
    },
    [estimateId]
  )

  const handlePatchStaffing = useCallback(
    async (storyId: string, teamMemberId: string, hours: number) => {
      // Optimistic update of staffingAllocations
      setStories((prev) =>
        prev.map((s) => {
          if (s.id !== storyId) return s
          const existing = s.staffingAllocations.find((a) => a.teamMemberId === teamMemberId)
          if (existing) {
            return {
              ...s,
              staffingAllocations: s.staffingAllocations.map((a) =>
                a.teamMemberId === teamMemberId ? { ...a, hours } : a
              ),
            }
          }
          return {
            ...s,
            staffingAllocations: [...s.staffingAllocations, { teamMemberId, hours }],
          }
        })
      )

      if (storyId.startsWith('local-')) return

      try {
        const res = await fetch(
          `/api/estimates/${estimateId}/stories/${storyId}/staffing`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ allocations: [{ teamMemberId, hours }] }),
          }
        )
        if (!res.ok) {
          console.error('Failed to save staffing', await res.text())
        }
      } catch (err) {
        console.error('Error saving staffing', err)
      }
    },
    [estimateId]
  )

  const handleAddStory = useCallback(
    async (epicId: string) => {
      const epicStories = storiesByEpic[epicId] ?? []
      const nextOrder = epicStories.length > 0
        ? Math.max(...epicStories.map((s) => s.order)) + 1
        : 0

      const tempId = nextLocalId()
      const newStory: StoryRow = {
        id: tempId,
        epicId,
        storyTask: '',
        description: null,
        assumptions: null,
        deliverables: null,
        disabled: false,
        testable: false,
        estimateLow: null,
        estimateHigh: null,
        estimateMean: null,
        order: nextOrder,
        staffingAllocations: [],
      }

      setStories((prev) => [...prev, newStory])

      try {
        const res = await fetch(`/api/estimates/${estimateId}/stories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ epicId, storyTask: 'New story', order: nextOrder }),
        })
        if (res.ok) {
          const created: StoryRow = await res.json()
          setStories((prev) =>
            prev.map((s) =>
              s.id === tempId
                ? { ...newStory, id: created.id, storyTask: created.storyTask }
                : s
            )
          )
        }
      } catch (err) {
        console.error('Error creating story', err)
      }
    },
    [estimateId, storiesByEpic]
  )

  const handleDeleteStory = useCallback(
    async (storyId: string, label: string) => {
      if (label.trim()) {
        if (!window.confirm('Delete this story?')) return
      }

      setStories((prev) => prev.filter((s) => s.id !== storyId))

      if (storyId.startsWith('local-')) return

      try {
        await fetch(`/api/estimates/${estimateId}/stories/${storyId}`, {
          method: 'DELETE',
        })
      } catch (err) {
        console.error('Error deleting story', err)
      }
    },
    [estimateId]
  )

  const handleMoveUp = useCallback(
    async (storyId: string) => {
      const story = stories.find((s) => s.id === storyId)
      if (!story) return
      const epicStories = (storiesByEpic[story.epicId] ?? []).filter((s) => !s.id.startsWith('local-'))
      const idx = epicStories.findIndex((s) => s.id === storyId)
      if (idx <= 0) return

      const prev = epicStories[idx - 1]
      const newOrderCurrent = prev.order
      const newOrderPrev = story.order

      setStories((all) =>
        all.map((s) => {
          if (s.id === storyId) return { ...s, order: newOrderCurrent }
          if (s.id === prev.id) return { ...s, order: newOrderPrev }
          return s
        })
      )

      try {
        await Promise.all([
          fetch(`/api/estimates/${estimateId}/stories/${storyId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: newOrderCurrent }),
          }),
          fetch(`/api/estimates/${estimateId}/stories/${prev.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: newOrderPrev }),
          }),
        ])
      } catch (err) {
        console.error('Error reordering stories', err)
      }
    },
    [estimateId, stories, storiesByEpic]
  )

  const handleMoveDown = useCallback(
    async (storyId: string) => {
      const story = stories.find((s) => s.id === storyId)
      if (!story) return
      const epicStories = (storiesByEpic[story.epicId] ?? []).filter((s) => !s.id.startsWith('local-'))
      const idx = epicStories.findIndex((s) => s.id === storyId)
      if (idx < 0 || idx >= epicStories.length - 1) return

      const next = epicStories[idx + 1]
      const newOrderCurrent = next.order
      const newOrderNext = story.order

      setStories((all) =>
        all.map((s) => {
          if (s.id === storyId) return { ...s, order: newOrderCurrent }
          if (s.id === next.id) return { ...s, order: newOrderNext }
          return s
        })
      )

      try {
        await Promise.all([
          fetch(`/api/estimates/${estimateId}/stories/${storyId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: newOrderCurrent }),
          }),
          fetch(`/api/estimates/${estimateId}/stories/${next.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: newOrderNext }),
          }),
        ])
      } catch (err) {
        console.error('Error reordering stories', err)
      }
    },
    [estimateId, stories, storiesByEpic]
  )

  const handleExport = useCallback(() => {
    exportStoriesToCsv(stories, epics, teamMembers, estimateId)
  }, [stories, epics, teamMembers, estimateId])

  // Grand totals for footer
  const grandMean = stories
    .filter((s) => !s.disabled)
    .reduce((sum, s) => sum + (s.estimateMean ?? 0), 0)

  const grandTotalStaffing = stories
    .filter((s) => !s.disabled)
    .reduce((sum, s) => {
      const tmSum = teamMembers.reduce((ts, tm) => {
        const alloc = s.staffingAllocations.find((a) => a.teamMemberId === tm.id)
        return ts + (alloc?.hours ?? 0)
      }, 0)
      return sum + tmSum
    }, 0)

  const grandTmTotals = teamMembers.map((tm) => {
    const total = stories
      .filter((s) => !s.disabled)
      .reduce((sum, s) => {
        const alloc = s.staffingAllocations.find((a) => a.teamMemberId === tm.id)
        return sum + (alloc?.hours ?? 0)
      }, 0)
    return { id: tm.id, total }
  })

  // Fixed column count before team member columns
  const fixedColCount = 14 // #, disabled, epic, task, desc, assumptions, deliverables, testable, low, high, mean, balance, total staffing, actions
  const totalColCount = fixedColCount + teamMembers.length

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button
          onClick={handleExport}
          style={{
            padding: '7px 16px',
            fontFamily: 'var(--font-display)',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            background: 'none',
            border: '1px solid var(--cc-gray-light)',
            cursor: 'pointer',
            color: 'var(--cc-black)',
          }}
        >
          Export CSV
        </button>
      </div>

      {/* Horizontally scrollable table */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: 'max-content',
            minWidth: '100%',
            borderCollapse: 'collapse',
            border: '1px solid var(--cc-gray-light)',
            backgroundColor: '#ffffff',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '2px solid var(--cc-gray-light)' }}>
              <th style={{ ...headerCellStyle, width: '36px', textAlign: 'center' }}>#</th>
              <th style={{ ...headerCellStyle, width: '36px', textAlign: 'center' }} title="Disable row">
                ✓
              </th>
              <th style={{ ...headerCellStyle, minWidth: '120px' }}>Epic</th>
              <th style={{ ...headerCellStyle, minWidth: '160px' }}>Story / Task</th>
              <th style={{ ...headerCellStyle, minWidth: '140px' }}>Description</th>
              <th style={{ ...headerCellStyle, minWidth: '140px' }}>Assumptions</th>
              <th style={{ ...headerCellStyle, minWidth: '140px' }}>Deliverables</th>
              <th style={{ ...headerCellStyle, width: '52px', textAlign: 'center' }}>Test?</th>
              <th style={{ ...headerCellStyle, width: '64px', textAlign: 'right' }}>Low</th>
              <th style={{ ...headerCellStyle, width: '64px', textAlign: 'right' }}>High</th>
              <th style={{ ...headerCellStyle, width: '64px', textAlign: 'right' }}>Mean</th>
              <th style={{ ...headerCellStyle, width: '52px', textAlign: 'center' }}>Bal.</th>
              <th style={{ ...headerCellStyle, width: '72px', textAlign: 'right' }}>Staffed</th>
              {teamMembers.map((tm) => (
                <th
                  key={tm.id}
                  style={{ ...headerCellStyle, width: '64px', textAlign: 'right' }}
                  title={tm.title}
                >
                  {tm.abbreviation}
                </th>
              ))}
              <th
                style={{
                  ...headerCellStyle,
                  width: '72px',
                  borderRight: 'none',
                  textAlign: 'center',
                }}
              >
                {/* actions */}
              </th>
            </tr>
          </thead>
          <tbody>
            {epics.map((epic) => {
              const epicStories = storiesByEpic[epic.id] ?? []
              const epicHours = epicStories
                .filter((s) => !s.disabled)
                .reduce((sum, s) => sum + (s.estimateMean ?? 0), 0)

              return (
                <EpicGroupSection
                  key={epic.id}
                  epic={epic}
                  epicHours={epicHours}
                  epicStories={epicStories}
                  epics={epics}
                  teamMembers={teamMembers}
                  totalColCount={totalColCount}
                  estimateId={estimateId}
                  onPatchStory={handlePatchStory}
                  onPatchStaffing={handlePatchStaffing}
                  onAddStory={handleAddStory}
                  onDeleteStory={handleDeleteStory}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                />
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--cc-gray-light)' }}>
              <td
                colSpan={10}
                style={{
                  ...totalCellStyle,
                  textAlign: 'left',
                  fontFamily: 'var(--font-display)',
                  fontSize: '11px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--cc-gray-mid)',
                }}
              >
                Grand Total
              </td>
              <td style={{ ...totalCellStyle }}>{grandMean.toFixed(1)}</td>
              <td style={{ ...totalCellStyle, color: 'var(--cc-gray-mid)' }} />
              <td style={{ ...totalCellStyle }}>{grandTotalStaffing.toFixed(1)}</td>
              {grandTmTotals.map((t) => (
                <td key={t.id} style={{ ...totalCellStyle }}>
                  {t.total.toFixed(1)}
                </td>
              ))}
              <td
                style={{
                  ...totalCellStyle,
                  borderRight: 'none',
                }}
              />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

interface EpicGroupSectionProps {
  epic: EpicGroup
  epicHours: number
  epicStories: StoryRow[]
  epics: EpicGroup[]
  teamMembers: TeamMemberCol[]
  totalColCount: number
  estimateId: string
  onPatchStory: (storyId: string, changes: Partial<StoryRow>) => Promise<void>
  onPatchStaffing: (storyId: string, teamMemberId: string, hours: number) => Promise<void>
  onAddStory: (epicId: string) => Promise<void>
  onDeleteStory: (storyId: string, label: string) => Promise<void>
  onMoveUp: (storyId: string) => Promise<void>
  onMoveDown: (storyId: string) => Promise<void>
}

function EpicGroupSection({
  epic,
  epicHours,
  epicStories,
  epics,
  teamMembers,
  totalColCount,
  onPatchStory,
  onPatchStaffing,
  onAddStory,
  onDeleteStory,
  onMoveUp,
  onMoveDown,
}: EpicGroupSectionProps) {
  return (
    <>
      <EpicGroupHeader epic={epic} totalHours={epicHours} colSpan={totalColCount} />
      {epicStories.map((story, idx) => (
        <StoryRowItem
          key={story.id}
          story={story}
          rowNumber={idx + 1}
          epics={epics}
          teamMembers={teamMembers}
          onPatchStory={onPatchStory}
          onPatchStaffing={onPatchStaffing}
          onDelete={onDeleteStory}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          isFirst={idx === 0}
          isLast={idx === epicStories.length - 1}
        />
      ))}
      <tr>
        <td
          colSpan={totalColCount}
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid var(--cc-gray-light)',
            backgroundColor: '#fafafa',
          }}
        >
          <button
            onClick={() => onAddStory(epic.id)}
            style={{
              padding: '5px 12px',
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              backgroundColor: 'var(--cc-burnt-sienna)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            + Add Story
          </button>
        </td>
      </tr>
    </>
  )
}
