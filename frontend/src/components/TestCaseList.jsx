import { useMemo } from 'react'

function TestCaseList({ tests = [], checking = false }) {
    const passedCount = useMemo(
        () => tests.filter((t) => t.passed).length,
        [tests]
    )

    return (
        <div>
            <h3 className="font-pixel text-sm text-pixel-ink mb-2">
                Test Cases ({passedCount}/{tests.length})
            </h3>

            {tests.length === 0 ? (
                <p className="font-pixel text-[10px] text-pixel-brown/60">
                    No tests loaded yet...
                </p>
            ) : (
                tests.map((test) => (
                    <div
                        key={test.id}
                        className={`
              flex items-center gap-2 border-2 border-pixel-brown-dark px-3 py-2 mb-2
              ${test.passed ? "bg-pixel-green/20" : "bg-pixel-cream"}
            `}
                    >
                        <span className={test.passed ? "text-pixel-green" : "text-pixel-brown/50"}>
                            {test.passed ? "✔" : checking ? "…" : "○"}
                        </span>
                        <span className="font-pixel text-xs text-pixel-ink">{test.name}</span>
                        {test.passed && (
                            <span className="font-pixel text-[8px] text-pixel-green ml-auto">
                                LOCKED
                            </span>
                        )}
                    </div>
                ))
            )}

            <p className="font-pixel text-[8px] text-pixel-brown/60 mt-2">
                {checking ? "Checking tests..." : "tests lock once passed!"}
            </p>
        </div>
    )
}

export default TestCaseList