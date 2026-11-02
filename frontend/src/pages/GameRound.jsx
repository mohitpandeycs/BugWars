import { useState, useCallback, useEffect, useRef } from 'react'
import CodeEditor from '../components/CodeEditor'
import TestCaseList from '../components/TestCaseList'
import PlayerRow from '../components/PlayerRow'
import ChatBox from '../components/ChatBox'
import EmergencyButton from '../components/EmergencyButton'
import Timer from '../components/Timer'
import { getFakeRoundData } from '../mocks/fakeRoundData'
import { evaluateTests } from '../mocks/fakeTestEvaluator'
import {
    ROUND_DURATION_SECONDS,
    TOTAL_ROUNDS,
    DEFAULT_CATEGORY,
} from '../constants/gameConfig'

// How long to hold on the "all tests passed" state before navigating away.
const ROUND_COMPLETE_DELAY_MS = 1600

// How long to show the "TIME'S UP" message before the clock resets and
// the player can keep solving.
const TIME_UP_MESSAGE_DURATION_MS = 2000

function RoundCompleteOverlay({ passedCount, total }) {
    return (
        <div
            className="fixed inset-0 bg-pixel-ink/70 flex items-center justify-center z-50"
            role="status"
            aria-label={`Round complete: ${passedCount} of ${total} tests passed`}
        >
            <div className="bg-pixel-cream border-4 border-pixel-green px-10 py-8 text-center">
                <div className="text-5xl mb-3" aria-hidden="true">✅</div>
                <p className="font-pixel text-pixel-green text-sm mb-2">ALL TESTS PASSED!</p>
                <p className="font-pixel text-pixel-ink text-[10px]">
                    {passedCount}/{total} tests green
                </p>
            </div>
        </div>
    )
}

function GameRound({
    category = DEFAULT_CATEGORY,
    players = [],
    round = 1,
    onEmergencyCall,
    onAllTestsPassed,
}) {
    const [roundData] = useState(() => getFakeRoundData(category))
    const [code, setCode] = useState(roundData.code)
    const [tests, setTests] = useState(roundData.tests)
    const [messages, setMessages] = useState([])
    const [running, setRunning] = useState(false)
    const [roundComplete, setRoundComplete] = useState(false)

    // Whether we're currently showing the "TIME'S UP" message.
    const [isTimeUp, setIsTimeUp] = useState(false)

    // Bumping this remounts <Timer>, forcing its countdown to restart from
    // ROUND_DURATION_SECONDS after a "time's up" message is dismissed.
    const [timerKey, setTimerKey] = useState(0)

    // Guards against multiple triggers for the victory state.
    const hasRoundEndedRef = useRef(false)

    const passedCount = tests.filter((t) => t.passed).length
    const allPassed = tests.length > 0 && passedCount === tests.length
    const alivePlayers = players.filter((p) => p.isActive).length

    useEffect(() => {
        players.forEach((p) => {
            if (p.isActive === undefined) {
                console.warn(`GameRound: player "${p.id}" missing isActive field`)
            }
        })
    }, [players])

    const handleRunTests = useCallback(() => {
        setRunning((prevRunning) => {
            if (prevRunning) return prevRunning
            setTimeout(() => {
                setCode((currentCode) => {
                    setTests((currentTests) => evaluateTests(currentCode, currentTests))
                    return currentCode
                })
                setRunning(false)
            }, 600)
            return true
        })
    }, [])

    const handleSendMessage = useCallback((text) => {
        setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), sender: 'You', text, color: '#D9534F' },
        ])
    }, [])

    // Time ran out. Show the "TIME'S UP" message but do NOT navigate — the
    // round only ends when all tests pass.
    const handleTimeUp = useCallback(() => {
        if (hasRoundEndedRef.current) return
        setIsTimeUp(true)
    }, [])

    // After the "TIME'S UP" message has been visible for a bit, hide it and
    // restart the countdown so the player can keep solving.
    useEffect(() => {
        if (!isTimeUp || hasRoundEndedRef.current) return

        const timeoutId = setTimeout(() => {
            setIsTimeUp(false)
            setTimerKey((prev) => prev + 1)
        }, TIME_UP_MESSAGE_DURATION_MS)

        return () => clearTimeout(timeoutId)
    }, [isTimeUp])

    // Only move to the next round once every test passes.
    useEffect(() => {
        if (allPassed && !hasRoundEndedRef.current) {
            hasRoundEndedRef.current = true
            setIsTimeUp(false)
            setRoundComplete(true)
            const timeoutId = setTimeout(() => {
                onAllTestsPassed?.({ passedCount, total: tests.length })
            }, ROUND_COMPLETE_DELAY_MS)
            return () => clearTimeout(timeoutId)
        }
    }, [allPassed, onAllTestsPassed, passedCount, tests.length])

    return (
        <div className="min-h-screen bg-pixel-cream-dark flex flex-col p-2 sm:p-4 gap-3 relative">
            <header className="flex flex-wrap items-center justify-between gap-2 bg-pixel-cream border-4 border-pixel-brown-dark px-4 py-2">
                <p className="font-pixel text-xs text-pixel-ink">
                    Round {round}/{TOTAL_ROUNDS}
                </p>
                <span className="font-pixel text-xs text-pixel-ink">{roundData.category}</span>

                {!isTimeUp ? (
                    <Timer
                        key={timerKey}
                        startSeconds={ROUND_DURATION_SECONDS}
                        onComplete={handleTimeUp}
                    />
                ) : (
                    <span className="font-pixel text-xs text-pixel-red animate-pulse font-bold">
                        ⏰ TIME IS UP! KEEP CODING...
                    </span>
                )}

                <span
                    className="font-pixel text-xs text-pixel-ink"
                    aria-label={`${alivePlayers} players alive`}
                >
                    {alivePlayers} alive
                </span>
            </header>

            {isTimeUp && !roundComplete && (
                <div className="bg-pixel-cream border-4 border-pixel-red p-2 text-center">
                    <p className="font-pixel text-pixel-red text-xs font-bold animate-pulse">
                        ⚠️ TIME OVER! Solve all test cases to unlock the next round.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 flex-1">
                <aside className="lg:col-span-1 flex flex-col gap-3" aria-label="Players and test results">
                    <div className="bg-pixel-cream border-4 border-pixel-brown-dark p-3">
                        <h1 className="font-pixel text-xs text-pixel-ink mb-2">Players</h1>
                        {players.length === 0 ? (
                            <p className="font-pixel text-[10px] text-pixel-brown/60">No players</p>
                        ) : (
                            players.map((p) => (
                                <PlayerRow
                                    key={p.id}
                                    name={p.name}
                                    color={p.color}
                                    isYou={p.isYou}
                                    isHost={p.isHost}
                                    isActive={p.isActive}
                                />
                            ))
                        )}
                    </div>
                    <TestCaseList tests={tests} checking={running} />
                </aside>

                <main className="lg:col-span-2 flex flex-col gap-3" aria-label="Code editor">
                    <CodeEditor code={code} onChange={setCode} height="380px" />
                    <button
                        onClick={handleRunTests}
                        disabled={running || allPassed}
                        className="w-full font-pixel text-xs bg-pixel-green border-4 border-pixel-brown-dark text-white py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {running ? 'RUNNING...' : allPassed ? 'ALL TESTS PASSED' : 'RUN TESTS'}
                    </button>
                    <EmergencyButton onConfirm={onEmergencyCall} cooldownSeconds={0} />
                </main>

                <section className="lg:col-span-1" aria-label="Team chat">
                    <ChatBox messages={messages} onSendMessage={handleSendMessage} />
                </section>
            </div>

            {roundComplete && (
                <RoundCompleteOverlay passedCount={passedCount} total={tests.length} />
            )}
        </div>
    )
}

export default GameRound