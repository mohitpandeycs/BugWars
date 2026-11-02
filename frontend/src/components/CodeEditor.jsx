import CodeMirror from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'

function CodeEditor({ code, onChange, height = "350px" }) {
    return (
        <div className="border-4 border-pixel-brown-dark overflow-hidden w-full">
            <CodeMirror
                value={code}
                height={height}
                extensions={[python()]}
                onChange={(value) => onChange?.(value)}
                theme="dark"
            />
        </div>
    )
}

export default CodeEditor