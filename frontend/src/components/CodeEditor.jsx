import { useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { formatCursorPosition } from '../services/remoteCursor'

function CodeEditor({
  code,
  onChange,
  onSelectionChange,
  remoteCursors = [],
  height = '350px',
}) {
  const visibleRemoteCursors = useMemo(
    () => remoteCursors.filter((cursor) => typeof cursor?.index === 'number'),
    [remoteCursors]
  )

  return (
    <div className="border-4 border-pixel-brown-dark overflow-hidden w-full bg-[#111]">
      <CodeMirror
        value={code}
        height={height}
        extensions={[python()]}
        onChange={(value) => onChange?.(value)}
        onUpdate={(update) => {
          if (update.selectionSet || update.focusChanged) {
            const cursorIndex = update.state.selection.main.head
            onSelectionChange?.(cursorIndex)
          }
        }}
        theme="dark"
      />

      {visibleRemoteCursors.length > 0 && (
        <div className="border-t-2 border-pixel-brown-dark bg-pixel-ink px-2 py-1 flex flex-wrap gap-2">
          {visibleRemoteCursors.map((cursor) => (
            <span
              key={cursor.playerId}
              className="font-pixel text-[9px] px-2 py-1 border border-pixel-brown-dark"
              style={{ color: cursor.color || '#ffffff', backgroundColor: '#1f1f1f' }}
            >
              {cursor.name}: {formatCursorPosition(code, cursor.index)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default CodeEditor
