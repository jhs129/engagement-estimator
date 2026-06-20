/**
 * CSV import utilities — client-side only (FileReader-based, no server upload)
 */

export interface ImportResult<T> {
  rows: T[]
  errors: string[]
}

/**
 * Parse a CSV string into an array of row objects keyed by header name.
 * Handles:
 *  - Quoted fields (commas and newlines inside quotes)
 *  - Double-quote escaping inside quoted fields
 *  - Trims whitespace from keys and values
 */
export function parseCsv(csvText: string): Array<Record<string, string>> {
  if (!csvText || csvText.trim().length === 0) return []

  const rows = tokenize(csvText)
  if (rows.length === 0) return []

  const headers = rows[0].map((h) => h.trim())
  const result: Array<Record<string, string>> = []

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i]
    // Skip completely empty rows
    if (cells.length === 1 && cells[0].trim() === '') continue

    const obj: Record<string, string> = {}
    headers.forEach((header, j) => {
      obj[header] = (cells[j] ?? '').trim()
    })
    result.push(obj)
  }

  return result
}

/**
 * Tokenize CSV text into a 2D array of raw strings.
 * Handles quoted fields with embedded commas and newlines.
 */
function tokenize(text: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let cell = ''
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        // Escaped double-quote
        cell += '"'
        i += 2
      } else if (ch === '"') {
        inQuotes = false
        i += 1
      } else {
        cell += ch
        i += 1
      }
    } else {
      if (ch === '"') {
        inQuotes = true
        i += 1
      } else if (ch === ',') {
        currentRow.push(cell)
        cell = ''
        i += 1
      } else if (ch === '\r' && next === '\n') {
        currentRow.push(cell)
        cell = ''
        rows.push(currentRow)
        currentRow = []
        i += 2
      } else if (ch === '\n' || ch === '\r') {
        currentRow.push(cell)
        cell = ''
        rows.push(currentRow)
        currentRow = []
        i += 1
      } else {
        cell += ch
        i += 1
      }
    }
  }

  // Push last cell/row
  currentRow.push(cell)
  if (currentRow.length > 0) {
    rows.push(currentRow)
  }

  return rows
}

/** Case-insensitive column lookup */
function findColumn(
  row: Record<string, string>,
  names: string[]
): string | undefined {
  for (const name of names) {
    const lower = name.toLowerCase()
    for (const key of Object.keys(row)) {
      if (key.toLowerCase() === lower) {
        return row[key]
      }
    }
  }
  return undefined
}

// ---- Per-tab import functions ----

export function parseQuestionsImport(
  rows: Array<Record<string, string>>
): ImportResult<{
  type: string
  description: string
  notes: string
}> {
  const result: ImportResult<{ type: string; description: string; notes: string }> = {
    rows: [],
    errors: [],
  }

  rows.forEach((row, idx) => {
    const rowNum = idx + 2 // 1-based + header row
    const description = findColumn(row, ['Description']) ?? ''
    const type = findColumn(row, ['Type']) ?? 'Question'
    const notes = findColumn(row, ['Notes/Answers', 'Notes']) ?? ''

    if (!description.trim()) {
      result.errors.push(`Row ${rowNum}: Description is required`)
      return
    }

    result.rows.push({
      type: type.trim() || 'Question',
      description: description.trim(),
      notes: notes.trim(),
    })
  })

  return result
}

export function parseTeamImport(
  rows: Array<Record<string, string>>
): ImportResult<{
  titleOverride: string
  abbreviationOverride: string
  targetedResource: string
}> {
  const result: ImportResult<{
    titleOverride: string
    abbreviationOverride: string
    targetedResource: string
  }> = { rows: [], errors: [] }

  rows.forEach((row, idx) => {
    const rowNum = idx + 2
    const title = findColumn(row, ['Title']) ?? ''
    const abbreviationOverride = findColumn(row, ['AbbreviationOverride', 'Abbreviation Override']) ?? ''
    const targetedResource = findColumn(row, ['TargetedResource', 'Targeted Resource']) ?? ''

    if (!title.trim()) {
      result.errors.push(`Row ${rowNum}: Title is required`)
      return
    }

    result.rows.push({
      titleOverride: title.trim(),
      abbreviationOverride: abbreviationOverride.trim(),
      targetedResource: targetedResource.trim(),
    })
  })

  return result
}

export function parseEpicsImport(
  rows: Array<Record<string, string>>
): ImportResult<{
  name: string
  description: string
}> {
  const result: ImportResult<{ name: string; description: string }> = {
    rows: [],
    errors: [],
  }

  rows.forEach((row, idx) => {
    const rowNum = idx + 2
    const name = findColumn(row, ['EpicName', 'Epic Name']) ?? ''
    const description = findColumn(row, ['Description']) ?? ''

    if (!name.trim()) {
      result.errors.push(`Row ${rowNum}: EpicName is required`)
      return
    }

    result.rows.push({
      name: name.trim(),
      description: description.trim(),
    })
  })

  return result
}

export function parseStoriesImport(
  rows: Array<Record<string, string>>,
  teamMemberAbbreviations: string[]
): ImportResult<{
  epicName: string
  storyTask: string
  description: string
  assumptions: string
  deliverables: string
  disabled: boolean
  testable: boolean
  estimateLow: number | null
  estimateHigh: number | null
  estimateMean: number | null
  teamMemberHours: Record<string, number>
}> {
  const result: ImportResult<{
    epicName: string
    storyTask: string
    description: string
    assumptions: string
    deliverables: string
    disabled: boolean
    testable: boolean
    estimateLow: number | null
    estimateHigh: number | null
    estimateMean: number | null
    teamMemberHours: Record<string, number>
  }> = { rows: [], errors: [] }

  rows.forEach((row, idx) => {
    const rowNum = idx + 2
    const epicName = findColumn(row, ['EpicName', 'Epic Name']) ?? ''
    const storyTask = findColumn(row, ['StoryTask', 'Story Task', 'Story/Task']) ?? ''
    const description = findColumn(row, ['Description']) ?? ''
    const assumptions = findColumn(row, ['Assumptions']) ?? ''
    const deliverables = findColumn(row, ['Deliverables']) ?? ''
    const disabledRaw = findColumn(row, ['Disabled']) ?? ''
    const testableRaw = findColumn(row, ['Testable']) ?? ''
    const lowRaw = findColumn(row, ['Low']) ?? ''
    const highRaw = findColumn(row, ['High']) ?? ''
    const meanRaw = findColumn(row, ['Mean']) ?? ''

    if (!epicName.trim()) {
      result.errors.push(`Row ${rowNum}: EpicName is required`)
      return
    }
    if (!storyTask.trim()) {
      result.errors.push(`Row ${rowNum}: StoryTask is required`)
      return
    }

    // Parse numeric estimates
    const parseMaybeFloat = (s: string): number | null => {
      if (!s.trim()) return null
      const n = parseFloat(s.trim())
      return isNaN(n) ? null : n
    }

    // Parse boolean-ish
    const parseBool = (s: string): boolean => {
      const lower = s.trim().toLowerCase()
      return lower === 'true' || lower === 'yes' || lower === '1'
    }

    // Parse team member hours from columns that match abbreviations
    const teamMemberHours: Record<string, number> = {}
    for (const abbr of teamMemberAbbreviations) {
      const val = findColumn(row, [abbr]) ?? ''
      if (val.trim()) {
        const n = parseFloat(val.trim())
        if (!isNaN(n)) {
          teamMemberHours[abbr] = n
        }
      }
    }

    result.rows.push({
      epicName: epicName.trim(),
      storyTask: storyTask.trim(),
      description: description.trim(),
      assumptions: assumptions.trim(),
      deliverables: deliverables.trim(),
      disabled: parseBool(disabledRaw),
      testable: parseBool(testableRaw),
      estimateLow: parseMaybeFloat(lowRaw),
      estimateHigh: parseMaybeFloat(highRaw),
      estimateMean: parseMaybeFloat(meanRaw),
      teamMemberHours,
    })
  })

  return result
}
