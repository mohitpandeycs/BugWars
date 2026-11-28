export function clampCursorIndex(code, index) {
  if (typeof code !== 'string') return 0
  const length = code.length
  const parsed = Number(index)
  if (!Number.isFinite(parsed)) return 0
  if (parsed < 0) return 0
  if (parsed > length) return length
  return parsed
}

export function indexToLineColumn(code, index) {
  const safeCode = typeof code === 'string' ? code : ''
  const safeIndex = clampCursorIndex(safeCode, index)
  const beforeCursor = safeCode.slice(0, safeIndex)
  const lines = beforeCursor.split('\n')

  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  }
}

export function formatCursorPosition(code, index) {
  const { line, column } = indexToLineColumn(code, index)
  return `L${line}, C${column}`
}
