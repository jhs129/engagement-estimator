'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import type { StoryRow, StoriesGridProps } from './types'
import { StoryRowItem } from './StoryRowItem'
import { exportStoriesToCsv } from './csvExport'
import { CsvImportModal } from '@/components/CsvImportModal'
import { parseStoriesImport } from '@/lib/csv/import'
import {
  GRID_TOOLBAR_BTN_STYLE,
  GRID_HEADER_CELL_STYLE,
  GridAddRowButton,
} from '@/components/ui/gridShared'

let localIdCounter = 0

function createBlankStory(epicId: string, order: number): StoryRow {
  localIdCounter += 1
  return {
    id: `local-${localIdCounter}`,
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
    order,
    staffingAllocations: [],
  }
}

const headerCellStyle: React.CSSProperties = {
  ...GRID_HEADER_CELL_STYLE,
  padding: '10px 10px',
  fontSize: '10px',
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

const chipBase: React.CSSProperties = {
  padding: '3px 10px',
  fontFamily: 'var(--font-display)',
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  border: '1px solid var(--cc-gray-light)',
  cursor: 'pointer',
  background: 'none',
  whiteSpace: 'nowrap',
}

type SortCol = 'epic' | 'task' | 'low' | 'high' | 'mean' | 'staffed'
type SortDir = 'asc' | 'desc'
type SortState = { col: SortCol; dir: SortDir } | null

export function StoriesGrid({
  estimateId,
  initialStories,
  epics,
  teamMembers,
}: StoriesGridProps) {
  const [stories, setStories] = useState<StoryRow[]>(() => {
    if (initialStories.length > 0) return initialStories
    const firstEpic = epics[0]
    return firstEpic ? [createBlankStory(firstEpic.id, 0)] : []
  })
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [filterEpicIds, setFilterEpicIds] = useState<string[]>([])
  const [sortState, setSortState] = useState<SortState>(null)

  const storiesRef = useRef(stories)
  storiesRef.current = stories
  const creatingLocalStories = useRef(new Set<string>())

  const epicOrder = useMemo(() => {
    const order: Record<string, number> = {}
    epics.forEach((e, i) => { order[e.id] = i })
    return order
  }, [epics])

  const epicNameById = useMemo(() => {
    const map: Record<string, string> = {}
    epics.forEach((e) => { map[e.id] = e.name })
    return map
  }, [epics])

  const facetEpics = useMemo(() => {
    const usedIds = new Set(stories.map((s) => s.epicId))
    return epics.filter((e) => usedIds.has(e.id))
  }, [epics, stories])

  // Base sort: epic position, then story.order within epic
  const sortedStories = useMemo(() => {
    return [...stories].sort((a, b) => {
      const epicDiff = (epicOrder[a.epicId] ?? 999) - (epicOrder[b.epicId] ?? 999)
      if (epicDiff !== 0) return epicDiff
      return a.order - b.order
    })
  }, [stories, epicOrder])

  // Filter + optional column sort for display
  const displayStories = useMemo(() => {
    let list = sortedStories
    if (filterEpicIds.length > 0) {
      list = list.filter((s) => filterEpicIds.includes(s.epicId))
    }
    if (sortState) {
      const { col, dir } = sortState
      const sign = dir === 'asc' ? 1 : -1
      list = [...list].sort((a, b) => {
        switch (col) {
          case 'epic': {
            const na = epicNameById[a.epicId] ?? ''
            const nb = epicNameById[b.epicId] ?? ''
            return sign * na.localeCompare(nb)
          }
          case 'task':
            return sign * (a.storyTask ?? '').localeCompare(b.storyTask ?? '')
          case 'low':
            return sign * ((a.estimateLow ?? -1) - (b.estimateLow ?? -1))
          case 'high':
            return sign * ((a.estimateHigh ?? -1) - (b.estimateHigh ?? -1))
          case 'mean':
            return sign * ((a.estimateMean ?? -1) - (b.estimateMean ?? -1))
          case 'staffed': {
            const totalA = a.staffingAllocations.reduce((s, a2) => s + a2.hours, 0)
            const totalB = b.staffingAllocations.reduce((s, a2) => s + a2.hours, 0)
            return sign * (totalA - totalB)
          }
        }
      })
    }
    return list
  }, [sortedStories, filterEpicIds, sortState, epicNameById])

  const toggleEpicFilter = useCallback((epicId: string) => {
    setFilterEpicIds((prev) =>
      prev.includes(epicId) ? prev.filter((id) => id !== epicId) : [...prev, epicId]
    )
  }, [])

  const handleSort = useCallback((col: SortCol) => {
    setSortState((prev) => {
      if (!prev || prev.col !== col) return { col, dir: 'asc' }
      if (prev.dir === 'asc') return { col, dir: 'desc' }
      return null
    })
  }, [])

  const sortIcon = (col: SortCol) => {
    if (!sortState || sortState.col !== col) return null
    return <span style={{ marginLeft: '3px', opacity: 0.7 }}>{sortState.dir === 'asc' ? '↑' : '↓'}</span>
  }

  const handlePatchStory = useCallback(
    async (storyId: string, changes: Partial<StoryRow>) => {
      setStories((prev) => prev.map((s) => (s.id === storyId ? { ...s, ...changes } : s)))

      if (storyId.startsWith('local-')) {
        if (creatingLocalStories.current.has(storyId)) return
        const localStory = storiesRef.current.find((s) => s.id === storyId)
        if (!localStory) return
        creatingLocalStories.current.add(storyId)
        const merged = { ...localStory, ...changes }
        try {
          const res = await fetch(`/api/estimates/${estimateId}/stories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              epicId: merged.epicId,
              storyTask: merged.storyTask || '',
              description: merged.description,
              assumptions: merged.assumptions,
              deliverables: merged.deliverables,
              disabled: merged.disabled,
              testable: merged.testable,
              estimateLow: merged.estimateLow,
              estimateHigh: merged.estimateHigh,
              estimateMean: merged.estimateMean,
              order: merged.order,
            }),
          })
          if (res.ok) {
            const created: StoryRow = await res.json()
            setStories((prev) =>
              prev.map((s) =>
                s.id === storyId
                  ? { ...merged, id: created.id, staffingAllocations: created.staffingAllocations ?? [] }
                  : s
              )
            )
          }
        } catch (err) {
          console.error('Error creating story', err)
        } finally {
          creatingLocalStories.current.delete(storyId)
        }
        return
      }

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

  const handleAddRow = useCallback((epicId: string) => {
    const epicStories = storiesRef.current.filter((s) => s.epicId === epicId)
    const nextOrder = epicStories.length > 0
      ? Math.max(...epicStories.map((s) => s.order)) + 1
      : 0
    setStories((prev) => [...prev, createBlankStory(epicId, nextOrder)])
  }, [])

  const handleDeleteStory = useCallback(
    async (storyId: string, label: string) => {
      if (label.trim()) {
        if (!window.confirm('Delete this story?')) return
      }
      setStories((prev) => prev.filter((s) => s.id !== storyId))
      if (storyId.startsWith('local-')) return
      try {
        await fetch(`/api/estimates/${estimateId}/stories/${storyId}`, { method: 'DELETE' })
      } catch (err) {
        console.error('Error deleting story', err)
      }
    },
    [estimateId]
  )

  const handleMoveUp = useCallback(
    async (storyId: string) => {
      const current = storiesRef.current
      const epicOrd = epicOrder
      const flat = [...current].sort((a, b) => {
        const d = (epicOrd[a.epicId] ?? 999) - (epicOrd[b.epicId] ?? 999)
        return d !== 0 ? d : a.order - b.order
      })
      const idx = flat.findIndex((s) => s.id === storyId)
      if (idx <= 0) return
      const story = flat[idx]
      const prev = flat[idx - 1]
      if (story.epicId !== prev.epicId) return

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
    [estimateId, epicOrder]
  )

  const handleMoveDown = useCallback(
    async (storyId: string) => {
      const current = storiesRef.current
      const epicOrd = epicOrder
      const flat = [...current].sort((a, b) => {
        const d = (epicOrd[a.epicId] ?? 999) - (epicOrd[b.epicId] ?? 999)
        return d !== 0 ? d : a.order - b.order
      })
      const idx = flat.findIndex((s) => s.id === storyId)
      if (idx < 0 || idx >= flat.length - 1) return
      const story = flat[idx]
      const next = flat[idx + 1]
      if (story.epicId !== next.epicId) return

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
    [estimateId, epicOrder]
  )

  const handleExport = useCallback(() => {
    exportStoriesToCsv(stories, epics, teamMembers, estimateId)
  }, [stories, epics, teamMembers, estimateId])

  const teamMemberAbbreviations = useMemo(
    () => teamMembers.map((tm) => tm.abbreviation),
    [teamMembers]
  )

  const handleImport = useCallback(
    async (parsedRows: Array<Record<string, string>>, mode: 'merge' | 'replace') => {
      const parsed = parseStoriesImport(parsedRows, teamMemberAbbreviations)
      if (parsed.errors.length > 0) return

      if (mode === 'replace') {
        const existingIds = stories.filter((s) => !s.id.startsWith('local-')).map((s) => s.id)
        await Promise.all(
          existingIds.map((id) =>
            fetch(`/api/estimates/${estimateId}/stories/${id}`, { method: 'DELETE' })
          )
        )
        setStories([])
      }

      const created: StoryRow[] = []
      for (let i = 0; i < parsed.rows.length; i++) {
        const row = parsed.rows[i]
        const epic = epics.find(
          (e) => e.name.toLowerCase() === row.epicName.toLowerCase()
        )
        if (!epic) continue

        const epicStories = (mode === 'replace' ? created : [...stories, ...created]).filter(
          (s) => s.epicId === epic.id
        )

        const res = await fetch(`/api/estimates/${estimateId}/stories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            epicId: epic.id,
            storyTask: row.storyTask,
            description: row.description || null,
            assumptions: row.assumptions || null,
            deliverables: row.deliverables || null,
            disabled: row.disabled,
            testable: row.testable,
            estimateLow: row.estimateLow,
            estimateHigh: row.estimateHigh,
            estimateMean: row.estimateMean,
            order: epicStories.length,
          }),
        })
        if (!res.ok) continue

        const newStory: StoryRow = await res.json()
        newStory.staffingAllocations = newStory.staffingAllocations ?? []

        const allocations = Object.entries(row.teamMemberHours)
          .map(([abbr, hours]) => {
            const tm = teamMembers.find((t) => t.abbreviation === abbr)
            return tm ? { teamMemberId: tm.id, hours } : null
          })
          .filter((a): a is { teamMemberId: string; hours: number } => a !== null)

        if (allocations.length > 0) {
          const staffRes = await fetch(
            `/api/estimates/${estimateId}/stories/${newStory.id}/staffing`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ allocations }),
            }
          )
          if (staffRes.ok) {
            newStory.staffingAllocations = allocations
          }
        }

        created.push(newStory)
      }

      if (mode === 'replace') {
        setStories(created)
      } else {
        setStories((prev) => [...prev, ...created])
      }
    },
    [estimateId, stories, epics, teamMembers, teamMemberAbbreviations]
  )

  const getValidationErrors = useCallback(
    (parsedRows: Array<Record<string, string>>) => {
      return parseStoriesImport(parsedRows, teamMemberAbbreviations).errors
    },
    [teamMemberAbbreviations]
  )

  // Grand totals always use all stories (not filtered)
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

  const defaultEpicId = epics[0]?.id ?? ''

  const sortableThStyle = (col: SortCol): React.CSSProperties => ({
    cursor: 'pointer',
    userSelect: 'none',
    backgroundColor: sortState?.col === col ? 'var(--cc-gray-light)' : undefined,
  })

  return (
    <div style={{ padding: '24px 32px' }}>
      <CsvImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImport}
        tabLabel="Stories"
        expectedColumns={['EpicName', 'StoryTask', 'Description', 'Assumptions', 'Deliverables', 'Disabled', 'Testable', 'Low', 'High', 'Mean', '…team abbreviations']}
        teamMemberAbbreviations={teamMemberAbbreviations}
        getValidationErrors={getValidationErrors}
      />

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '12px' }}>
        <button onClick={() => setImportModalOpen(true)} style={GRID_TOOLBAR_BTN_STYLE}>Import CSV</button>
        <button onClick={handleExport} style={GRID_TOOLBAR_BTN_STYLE}>Export CSV</button>
      </div>

      {/* Epic filter chips — faceted: only epics present in current stories */}
      {facetEpics.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--cc-gray-mid)',
            marginRight: '2px',
          }}>
            Filter:
          </span>
          <button
            onClick={() => setFilterEpicIds([])}
            style={{
              ...chipBase,
              backgroundColor: filterEpicIds.length === 0 ? 'var(--cc-black)' : 'transparent',
              color: filterEpicIds.length === 0 ? '#ffffff' : 'var(--cc-gray-mid)',
              borderColor: filterEpicIds.length === 0 ? 'var(--cc-black)' : 'var(--cc-gray-light)',
            }}
          >
            All
          </button>
          {facetEpics.map((epic) => {
            const active = filterEpicIds.includes(epic.id)
            return (
              <button
                key={epic.id}
                onClick={() => toggleEpicFilter(epic.id)}
                style={{
                  ...chipBase,
                  backgroundColor: active ? 'var(--cc-burnt-sienna)' : 'transparent',
                  color: active ? '#ffffff' : 'var(--cc-gray-mid)',
                  borderColor: active ? 'var(--cc-burnt-sienna)' : 'var(--cc-gray-light)',
                }}
              >
                {epic.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Table */}
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
              <th style={{ ...headerCellStyle, width: '36px', textAlign: 'center' }} title="Disable row">✓</th>
              <th
                style={{ ...headerCellStyle, minWidth: '120px', ...sortableThStyle('epic') }}
                onClick={() => handleSort('epic')}
              >
                Epic{sortIcon('epic')}
              </th>
              <th
                style={{ ...headerCellStyle, minWidth: '160px', ...sortableThStyle('task') }}
                onClick={() => handleSort('task')}
              >
                Story / Task{sortIcon('task')}
              </th>
              <th style={{ ...headerCellStyle, minWidth: '140px' }}>Description</th>
              <th style={{ ...headerCellStyle, minWidth: '140px' }}>Assumptions</th>
              <th style={{ ...headerCellStyle, minWidth: '140px' }}>Deliverables</th>
              <th style={{ ...headerCellStyle, width: '52px', textAlign: 'center' }}>Test?</th>
              <th
                style={{ ...headerCellStyle, width: '64px', textAlign: 'right', ...sortableThStyle('low') }}
                onClick={() => handleSort('low')}
              >
                Low{sortIcon('low')}
              </th>
              <th
                style={{ ...headerCellStyle, width: '64px', textAlign: 'right', ...sortableThStyle('high') }}
                onClick={() => handleSort('high')}
              >
                High{sortIcon('high')}
              </th>
              <th
                style={{ ...headerCellStyle, width: '64px', textAlign: 'right', ...sortableThStyle('mean') }}
                onClick={() => handleSort('mean')}
              >
                Mean{sortIcon('mean')}
              </th>
              <th style={{ ...headerCellStyle, width: '52px', textAlign: 'center' }}>Bal.</th>
              <th
                style={{ ...headerCellStyle, width: '72px', textAlign: 'right', ...sortableThStyle('staffed') }}
                onClick={() => handleSort('staffed')}
              >
                Staffed{sortIcon('staffed')}
              </th>
              {teamMembers.map((tm) => (
                <th
                  key={tm.id}
                  style={{ ...headerCellStyle, width: '64px', textAlign: 'right' }}
                  title={tm.title}
                >
                  {tm.abbreviation}
                </th>
              ))}
              <th style={{ ...headerCellStyle, width: '72px', borderRight: 'none', textAlign: 'center' }} />
            </tr>
          </thead>
          <tbody>
            {displayStories.map((story, idx) => {
              const isFirst = idx === 0 || displayStories[idx - 1].epicId !== story.epicId
              const isLast = idx === displayStories.length - 1 || displayStories[idx + 1].epicId !== story.epicId
              return (
                <StoryRowItem
                  key={story.id}
                  story={story}
                  rowNumber={idx + 1}
                  epics={epics}
                  teamMembers={teamMembers}
                  onPatchStory={handlePatchStory}
                  onPatchStaffing={handlePatchStaffing}
                  onDelete={handleDeleteStory}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  onAddRow={handleAddRow}
                  isFirst={isFirst}
                  isLast={isLast}
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
                <td key={t.id} style={{ ...totalCellStyle }}>{t.total.toFixed(1)}</td>
              ))}
              <td style={{ ...totalCellStyle, borderRight: 'none' }} />
            </tr>
          </tfoot>
        </table>
      </div>

      <GridAddRowButton
        onClick={() => handleAddRow(defaultEpicId)}
        label="+ Add Story"
        disabled={!defaultEpicId}
        disabledLabel="Add epics first"
      />
    </div>
  )
}
