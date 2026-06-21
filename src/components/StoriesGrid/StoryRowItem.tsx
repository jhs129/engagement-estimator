'use client'

import { useState, useCallback } from 'react'
import type { StoryRow, EpicGroup, TeamMemberCol } from './types'
import { calculateBalanceCheck } from './balanceCheck'
import {
  GRID_INPUT_STYLE,
  GRID_NUM_INPUT_STYLE,
  GRID_ROW_STYLE,
  onGridRowMouseEnter,
  onGridRowMouseLeave,
  GridDeleteButton,
} from '@/components/ui/gridShared'

interface BalanceDotProps {
  status: 'none' | 'green' | 'yellow' | 'red'
}

function BalanceDot({ status }: BalanceDotProps) {
  if (status === 'none') return <span style={{ display: 'inline-block', width: '12px' }} />
  const colors: Record<string, string> = {
    green: '#22c55e',
    yellow: '#eab308',
    red: '#ef4444',
  }
  return (
    <span
      style={{
        display: 'inline-block',
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: colors[status],
        flexShrink: 0,
      }}
      title={status}
    />
  )
}

interface StoryRowItemProps {
  story: StoryRow
  rowNumber: number
  epics: EpicGroup[]
  teamMembers: TeamMemberCol[]
  onPatchStory: (storyId: string, changes: Partial<StoryRow>) => Promise<void>
  onPatchStaffing: (storyId: string, teamMemberId: string, hours: number) => Promise<void>
  onDelete: (storyId: string, label: string) => void
  onMoveUp: (storyId: string) => void
  onMoveDown: (storyId: string) => void
  onAddRow: (epicId: string) => void
  isFirst: boolean
  isLast: boolean
}

export function StoryRowItem({
  story,
  rowNumber,
  epics,
  teamMembers,
  onPatchStory,
  onPatchStaffing,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddRow,
  isFirst,
  isLast,
}: StoryRowItemProps) {
  const [localTask, setLocalTask] = useState(story.storyTask)
  const [localDescription, setLocalDescription] = useState(story.description ?? '')
  const [localAssumptions, setLocalAssumptions] = useState(story.assumptions ?? '')
  const [localDeliverables, setLocalDeliverables] = useState(story.deliverables ?? '')
  const [localLow, setLocalLow] = useState(story.estimateLow !== null ? String(story.estimateLow) : '')
  const [localHigh, setLocalHigh] = useState(story.estimateHigh !== null ? String(story.estimateHigh) : '')
  const [localMean, setLocalMean] = useState(story.estimateMean !== null ? String(story.estimateMean) : '')
  const [meanManual, setMeanManual] = useState(false)

  // Team member hour local state
  const [localHours, setLocalHours] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    teamMembers.forEach((tm) => {
      const alloc = story.staffingAllocations.find((a) => a.teamMemberId === tm.id)
      init[tm.id] = alloc ? String(alloc.hours) : '0'
    })
    return init
  })

  const totalStaffing = teamMembers.reduce((sum, tm) => {
    const val = parseFloat(localHours[tm.id] ?? '0')
    return sum + (isNaN(val) ? 0 : val)
  }, 0)

  const meanVal = parseFloat(localMean)
  const balanceStatus = calculateBalanceCheck(isNaN(meanVal) ? null : meanVal, totalStaffing)

  const handleTextBlur = useCallback(
    async (field: 'storyTask' | 'description' | 'assumptions' | 'deliverables', value: string) => {
      const normalized = value.trim() || null
      const current = story[field]
      const currentNorm = typeof current === 'string' ? current || null : current
      if (normalized !== currentNorm) {
        await onPatchStory(story.id, { [field]: normalized })
      }
    },
    [story, onPatchStory]
  )

  const handleLowBlur = useCallback(async () => {
    const val = localLow === '' ? null : parseFloat(localLow)
    const numVal = val !== null && isNaN(val) ? null : val
    if (numVal !== story.estimateLow) {
      const changes: Partial<StoryRow> = { estimateLow: numVal }
      if (!meanManual) {
        const highVal = localHigh === '' ? null : parseFloat(localHigh)
        const highNum = highVal !== null && isNaN(highVal) ? null : highVal
        if (numVal !== null && highNum !== null) {
          const auto = (numVal + highNum) / 2
          setLocalMean(String(auto))
          changes.estimateMean = auto
        }
      }
      await onPatchStory(story.id, changes)
    }
  }, [localLow, localHigh, story.estimateLow, meanManual, onPatchStory, story.id])

  const handleHighBlur = useCallback(async () => {
    const val = localHigh === '' ? null : parseFloat(localHigh)
    const numVal = val !== null && isNaN(val) ? null : val
    if (numVal !== story.estimateHigh) {
      const changes: Partial<StoryRow> = { estimateHigh: numVal }
      if (!meanManual) {
        const lowVal = localLow === '' ? null : parseFloat(localLow)
        const lowNum = lowVal !== null && isNaN(lowVal) ? null : lowVal
        if (lowNum !== null && numVal !== null) {
          const auto = (lowNum + numVal) / 2
          setLocalMean(String(auto))
          changes.estimateMean = auto
        }
      }
      await onPatchStory(story.id, changes)
    }
  }, [localHigh, localLow, story.estimateHigh, meanManual, onPatchStory, story.id])

  const handleMeanBlur = useCallback(async () => {
    const val = localMean === '' ? null : parseFloat(localMean)
    const numVal = val !== null && isNaN(val) ? null : val
    if (numVal !== story.estimateMean) {
      await onPatchStory(story.id, { estimateMean: numVal })
    }
  }, [localMean, story.estimateMean, onPatchStory, story.id])

  const handleMeanChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalMean(e.target.value)
    setMeanManual(true)
  }, [])

  const handleLowChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalLow(e.target.value)
    setMeanManual(false)
  }, [])

  const handleHighChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalHigh(e.target.value)
    setMeanManual(false)
  }, [])

  const handleDisabledChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      await onPatchStory(story.id, { disabled: e.target.checked })
    },
    [story.id, onPatchStory]
  )

  const handleTestableChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      await onPatchStory(story.id, { testable: e.target.checked })
    },
    [story.id, onPatchStory]
  )

  const handleEpicChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      await onPatchStory(story.id, { epicId: e.target.value })
    },
    [story.id, onPatchStory]
  )

  const handleHoursBlur = useCallback(
    async (tmId: string) => {
      const raw = localHours[tmId] ?? '0'
      const val = parseFloat(raw)
      const hours = isNaN(val) ? 0 : Math.max(0, val)
      await onPatchStaffing(story.id, tmId, hours)
    },
    [story.id, localHours, onPatchStaffing]
  )

  const rowOpacity = story.disabled ? 0.5 : 1

  const tdBorder: React.CSSProperties = {
    borderRight: '1px solid var(--cc-gray-light)',
    padding: '8px 10px',
  }

  return (
    <tr
      style={{ ...GRID_ROW_STYLE, opacity: rowOpacity }}
      onMouseEnter={onGridRowMouseEnter}
      onMouseLeave={onGridRowMouseLeave}
    >
      {/* # */}
      <td
        style={{
          ...tdBorder,
          width: '36px',
          textAlign: 'center',
          fontFamily: 'var(--font-body)',
          fontSize: '12px',
          color: 'var(--cc-gray-mid)',
        }}
      >
        {rowNumber}
      </td>

      {/* Disabled checkbox */}
      <td style={{ ...tdBorder, width: '36px', textAlign: 'center' }}>
        <input
          type="checkbox"
          checked={story.disabled}
          onChange={handleDisabledChange}
          title="Disable row"
          style={{ cursor: 'pointer' }}
        />
      </td>

      {/* Epic dropdown */}
      <td style={{ ...tdBorder, minWidth: '120px' }}>
        <select
          value={story.epicId}
          onChange={handleEpicChange}
          style={{
            ...GRID_INPUT_STYLE,
            cursor: 'pointer',
          }}
        >
          {epics.map((ep) => (
            <option key={ep.id} value={ep.id}>
              {ep.name}
            </option>
          ))}
        </select>
      </td>

      {/* Story/Task */}
      <td style={{ ...tdBorder, minWidth: '160px' }}>
        <input
          type="text"
          value={localTask}
          onChange={(e) => setLocalTask(e.target.value)}
          onBlur={() => handleTextBlur('storyTask', localTask)}
          placeholder="Story / task…"
          style={GRID_INPUT_STYLE}
        />
      </td>

      {/* Description */}
      <td style={{ ...tdBorder, minWidth: '140px' }}>
        <input
          type="text"
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          onBlur={() => handleTextBlur('description', localDescription)}
          placeholder="Description…"
          style={GRID_INPUT_STYLE}
        />
      </td>

      {/* Assumptions */}
      <td style={{ ...tdBorder, minWidth: '140px' }}>
        <input
          type="text"
          value={localAssumptions}
          onChange={(e) => setLocalAssumptions(e.target.value)}
          onBlur={() => handleTextBlur('assumptions', localAssumptions)}
          placeholder="Assumptions…"
          style={GRID_INPUT_STYLE}
        />
      </td>

      {/* Deliverables */}
      <td style={{ ...tdBorder, minWidth: '140px' }}>
        <input
          type="text"
          value={localDeliverables}
          onChange={(e) => setLocalDeliverables(e.target.value)}
          onBlur={() => handleTextBlur('deliverables', localDeliverables)}
          placeholder="Deliverables…"
          style={GRID_INPUT_STYLE}
        />
      </td>

      {/* Testable */}
      <td style={{ ...tdBorder, width: '52px', textAlign: 'center' }}>
        <input
          type="checkbox"
          checked={story.testable}
          onChange={handleTestableChange}
          title="Testable"
          style={{ cursor: 'pointer' }}
        />
      </td>

      {/* Low */}
      <td style={{ ...tdBorder, width: '64px' }}>
        <input
          type="number"
          min="0"
          value={localLow}
          onChange={handleLowChange}
          onBlur={handleLowBlur}
          placeholder="0"
          style={GRID_NUM_INPUT_STYLE}
        />
      </td>

      {/* High */}
      <td style={{ ...tdBorder, width: '64px' }}>
        <input
          type="number"
          min="0"
          value={localHigh}
          onChange={handleHighChange}
          onBlur={handleHighBlur}
          placeholder="0"
          style={GRID_NUM_INPUT_STYLE}
        />
      </td>

      {/* Mean */}
      <td style={{ ...tdBorder, width: '64px' }}>
        <input
          type="number"
          min="0"
          value={localMean}
          onChange={handleMeanChange}
          onBlur={handleMeanBlur}
          onKeyDown={(e) => { if (e.key === 'Enter' && teamMembers.length === 0) { e.preventDefault(); handleMeanBlur(); onAddRow(story.epicId) } }}
          placeholder="0"
          style={GRID_NUM_INPUT_STYLE}
        />
      </td>

      {/* Balance */}
      <td style={{ ...tdBorder, width: '52px', textAlign: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BalanceDot status={balanceStatus} />
        </span>
      </td>

      {/* Total Staffing */}
      <td
        style={{
          ...tdBorder,
          width: '72px',
          textAlign: 'right',
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--cc-black)',
        }}
      >
        {totalStaffing.toFixed(1)}
      </td>

      {/* Team member hour columns */}
      {teamMembers.map((tm, tmIdx) => (
        <td key={tm.id} style={{ ...tdBorder, width: '64px' }}>
          <input
            type="number"
            min="0"
            value={localHours[tm.id] ?? '0'}
            onChange={(e) =>
              setLocalHours((prev) => ({ ...prev, [tm.id]: e.target.value }))
            }
            onBlur={() => handleHoursBlur(tm.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && tmIdx === teamMembers.length - 1) {
                e.preventDefault()
                handleHoursBlur(tm.id)
                onAddRow(story.epicId)
              }
            }}
            aria-label={tm.title}
            style={GRID_NUM_INPUT_STYLE}
          />
        </td>
      ))}

      {/* Move + Delete */}
      <td
        style={{
          padding: '8px 6px',
          width: '72px',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'center' }}>
          <button
            onClick={() => onMoveUp(story.id)}
            disabled={isFirst}
            title="Move up"
            style={{
              background: 'none',
              border: 'none',
              cursor: isFirst ? 'default' : 'pointer',
              padding: '2px 4px',
              color: isFirst ? 'var(--cc-gray-light)' : 'var(--cc-gray-mid)',
              lineHeight: 1,
              fontSize: '12px',
            }}
            aria-label="Move story up"
          >
            ▲
          </button>
          <button
            onClick={() => onMoveDown(story.id)}
            disabled={isLast}
            title="Move down"
            style={{
              background: 'none',
              border: 'none',
              cursor: isLast ? 'default' : 'pointer',
              padding: '2px 4px',
              color: isLast ? 'var(--cc-gray-light)' : 'var(--cc-gray-mid)',
              lineHeight: 1,
              fontSize: '12px',
            }}
            aria-label="Move story down"
          >
            ▼
          </button>
          <GridDeleteButton
            onClick={() => onDelete(story.id, localTask)}
            label="Delete story"
            title="Delete story"
          />
        </span>
      </td>
    </tr>
  )
}
