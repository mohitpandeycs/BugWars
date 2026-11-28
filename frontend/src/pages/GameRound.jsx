import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import CodeEditor from '../components/CodeEditor'
import TestCaseList from '../components/TestCaseList'
import PlayerRow from '../components/PlayerRow'
import ChatBox from '../components/ChatBox'
import EmergencyButton from '../components/EmergencyButton'
import Timer from '../components/Timer'
import {
  ROUND_DURATION_SECONDS,
  TOTAL_ROUNDS,
  DEFAULT_CATEGORY,
} from '../constants/gameConfig'
import { getRoundTask, applySabotage } from '../services/taskDatabase'
import { createPendingTests, evaluateTaskTests } from '../services/testEvaluator'
import { createRoundSync, loadRoundSnapshot, saveRoundSnapshot } from '../services/multiplayerSync'
import { clampCursorIndex } from '../services/remoteCursor'

const ROUND_COMPLETE_DELAY_MS = 1600
const TIME_UP_MESSAGE_DURATION_MS = 2000
const SABOTAGE_COOLDOWN_SECONDS = 12

function RoundCompleteOverlay({ passedCount, total }) {
  return (
    <div
      className="fixed inset-0 bg-pixel-ink/70 flex items-center justify-center z-50"
      role="status"
      aria-label={`Round complete: ${passedCount} of ${total} tests passed`}
    >
      <div className="bg-pixel-cream border-4 border-pixel-green px-10 py-8 text-center">
        <div className="text-5xl mb-3" aria-hidden="true">PASS</div>
        <p className="font-pixel text-pixel-green text-sm mb-2">ALL TESTS PASSED!</p>
        <p className="font-pixel text-pixel-ink text-[10px]">
          {passedCount}/{total} tests green
        </p>
      </div>
    </div>
  )
}

function buildSystemMessage(text) {
  return {
    id: crypto.randomUUID(),
    sender: 'System',
    text,
    color: '#F0A030',
  }
}

function normalizeIncomingMessages(input) {
  if (!Array.isArray(input)) return []
  return input
    .filter((message) => message && typeof message.text === 'string')
    .map((message) => ({
      id: message.id || crypto.randomUUID(),
      sender: message.sender || 'Player',
      text: message.text,
      color: message.color || '#5C4324',
    }))
}

function dedupeById(messages) {
  const seen = new Set()
  const output = []

  messages.forEach((message) => {
    if (!message?.id || seen.has(message.id)) return
    seen.add(message.id)
    output.push(message)
  })

  return output
}

function GameRound({
  lobbyCode = '',
  myPlayerId = '',
  myPlayerName = 'You',
  myRole = 'civilian',
  category = DEFAULT_CATEGORY,
  players = [],
  round = 1,
  onEmergencyCall,
  onAllTestsPassed,
}) {
  const roundTask = useMemo(() => getRoundTask(category, round), [category, round])

  const storedSnapshot = useMemo(
    () => loadRoundSnapshot({ roomCode: lobbyCode, round, fallback: null }),
    [lobbyCode, round]
  )

  const initialCode =
    storedSnapshot?.taskId === roundTask.id && typeof storedSnapshot.code === 'string'
      ? storedSnapshot.code
      : roundTask.starterCode

  const initialMessages =
    storedSnapshot?.taskId === roundTask.id
      ? normalizeIncomingMessages(storedSnapshot.messages)
      : []

  const initialCursors =
    storedSnapshot?.taskId === roundTask.id && storedSnapshot.cursors && typeof storedSnapshot.cursors === 'object'
      ? storedSnapshot.cursors
      : {}

  const initialTests =
    storedSnapshot?.taskId === roundTask.id && Array.isArray(storedSnapshot.tests)
      ? storedSnapshot.tests
      : createPendingTests(roundTask.tests)

  const [code, setCode] = useState(initialCode)
  const [tests, setTests] = useState(initialTests)
  const [messages, setMessages] = useState(initialMessages)
  const [remoteCursors, setRemoteCursors] = useState(initialCursors)
  const [running, setRunning] = useState(false)
  const [roundComplete, setRoundComplete] = useState(false)
  const [isTimeUp, setIsTimeUp] = useState(false)
  const [timerKey, setTimerKey] = useState(0)
  const [sabotageError, setSabotageError] = useState('')
  const [sabotageCooldownUntil, setSabotageCooldownUntil] = useState(0)

  const syncRef = useRef(null)
  const hasRoundEndedRef = useRef(false)
  const hasReceivedSyncRef = useRef(false)

  const codeRef = useRef(code)
  const testsRef = useRef(tests)
  const messagesRef = useRef(messages)
  const cursorsRef = useRef(remoteCursors)

  const me = useMemo(() => players.find((player) => player.id === myPlayerId), [players, myPlayerId])
  const myColor = me?.color || '#D9534F'
  const isImposter = myRole === 'imposter'

  const passedCount = tests.filter((test) => test.passed).length
  const allPassed = tests.length > 0 && passedCount === tests.length
  const alivePlayers = players.filter((player) => player.isActive).length

  const cooldownRemaining = Math.max(
    0,
    Math.ceil((sabotageCooldownUntil - Date.now()) / 1000)
  )

  const visibleRemoteCursors = useMemo(
    () =>
      Object.values(remoteCursors || {}).filter(
        (cursor) => cursor?.playerId && cursor.playerId !== myPlayerId
      ),
    [remoteCursors, myPlayerId]
  )

  useEffect(() => {
    codeRef.current = code
  }, [code])

  useEffect(() => {
    testsRef.current = tests
  }, [tests])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    cursorsRef.current = remoteCursors
  }, [remoteCursors])

  useEffect(() => {
    if (!lobbyCode) return

    saveRoundSnapshot({
      roomCode: lobbyCode,
      round,
      snapshot: {
        taskId: roundTask.id,
        code,
        tests,
        messages: messages.slice(-120),
        cursors: remoteCursors,
      },
    })
  }, [lobbyCode, round, roundTask.id, code, tests, messages, remoteCursors])

  const publish = useCallback((type, payload) => {
    syncRef.current?.publish(type, payload)
  }, [])

  useEffect(() => {
    if (!lobbyCode || !myPlayerId) return

    hasReceivedSyncRef.current = false

    const sync = createRoundSync({
      roomCode: lobbyCode,
      round,
      playerId: myPlayerId,
    })

    syncRef.current = sync

    const unsubscribe = sync.subscribe((event) => {
      const payload = event?.payload || {}

      if (event.type === 'sync-request') {
        if (payload.taskId && payload.taskId !== roundTask.id) return

        sync.publish('sync-state', {
          taskId: roundTask.id,
          code: codeRef.current,
          tests: testsRef.current,
          messages: messagesRef.current.slice(-80),
          cursors: cursorsRef.current,
        })
        return
      }

      if (payload.taskId && payload.taskId !== roundTask.id) return

      if (event.type === 'sync-state') {
        if (hasReceivedSyncRef.current) return
        hasReceivedSyncRef.current = true

        if (typeof payload.code === 'string') {
          setCode(payload.code)
          setTests(Array.isArray(payload.tests) ? payload.tests : createPendingTests(roundTask.tests))
        }

        if (Array.isArray(payload.messages)) {
          setMessages(dedupeById(normalizeIncomingMessages(payload.messages)))
        }

        if (payload.cursors && typeof payload.cursors === 'object') {
          setRemoteCursors(payload.cursors)
        }
        return
      }

      if (event.type === 'code-update' && typeof payload.code === 'string') {
        setCode(payload.code)
        setTests(createPendingTests(roundTask.tests))
        return
      }

      if (event.type === 'tests-update' && Array.isArray(payload.tests)) {
        setTests(payload.tests)
        return
      }

      if (event.type === 'chat-message' && payload.message) {
        setMessages((prev) => dedupeById([...prev, payload.message]).slice(-120))
        return
      }

      if (event.type === 'cursor-update' && payload.playerId) {
        setRemoteCursors((prev) => ({
          ...prev,
          [payload.playerId]: {
            playerId: payload.playerId,
            name: payload.name || 'Player',
            color: payload.color || '#ffffff',
            index: clampCursorIndex(codeRef.current, payload.index ?? 0),
            updatedAt: Date.now(),
          },
        }))
        return
      }

      if (event.type === 'sabotage-update' && typeof payload.code === 'string') {
        setCode(payload.code)
        setTests(createPendingTests(roundTask.tests))

        if (payload.message) {
          setMessages((prev) => dedupeById([...prev, payload.message]).slice(-120))
        }
      }
    })

    sync.publish('sync-request', { taskId: roundTask.id })

    return () => {
      unsubscribe()
      sync.close()
      if (syncRef.current === sync) {
        syncRef.current = null
      }
    }
  }, [lobbyCode, round, myPlayerId, roundTask.id, roundTask.tests])

  const handleCodeChange = useCallback(
    (nextCode) => {
      setCode(nextCode)
      setTests(createPendingTests(roundTask.tests))

      publish('code-update', {
        taskId: roundTask.id,
        code: nextCode,
      })
    },
    [publish, roundTask.id, roundTask.tests]
  )

  const handleSelectionChange = useCallback(
    (index) => {
      if (!myPlayerId) return

      publish('cursor-update', {
        taskId: roundTask.id,
        playerId: myPlayerId,
        name: myPlayerName,
        color: myColor,
        index: clampCursorIndex(codeRef.current, index),
      })
    },
    [myPlayerId, myPlayerName, myColor, publish, roundTask.id]
  )

  const handleRunTests = useCallback(() => {
    setRunning((prevRunning) => {
      if (prevRunning) return prevRunning

      setTimeout(() => {
        const nextTests = evaluateTaskTests(codeRef.current, roundTask.tests)
        setTests(nextTests)
        publish('tests-update', {
          taskId: roundTask.id,
          tests: nextTests,
        })
        setRunning(false)
      }, 600)

      return true
    })
  }, [publish, roundTask.id, roundTask.tests])

  const handleSendMessage = useCallback(
    async (text) => {
      const message = {
        id: crypto.randomUUID(),
        sender: myPlayerName || 'You',
        text,
        color: myColor,
      }

      setMessages((prev) => [...prev, message].slice(-120))
      publish('chat-message', {
        taskId: roundTask.id,
        message,
      })
    },
    [myColor, myPlayerName, publish, roundTask.id]
  )

  const handleSabotage = useCallback(
    (actionId) => {
      if (!isImposter) return
      if (cooldownRemaining > 0) return

      const nextCode = applySabotage(roundTask, actionId, codeRef.current)

      if (nextCode === codeRef.current) {
        setSabotageError('Sabotage could not be applied to current code.')
        return
      }

      const action = (roundTask.sabotageActions || []).find((item) => item.id === actionId)
      const sabotageMessage = buildSystemMessage(
        `${myPlayerName} triggered sabotage: ${action?.label || 'Code disruption'}`
      )

      setSabotageError('')
      setSabotageCooldownUntil(Date.now() + SABOTAGE_COOLDOWN_SECONDS * 1000)
      setCode(nextCode)
      setTests(createPendingTests(roundTask.tests))
      setMessages((prev) => [...prev, sabotageMessage].slice(-120))

      publish('sabotage-update', {
        taskId: roundTask.id,
        code: nextCode,
        message: sabotageMessage,
      })
    },
    [isImposter, cooldownRemaining, roundTask, myPlayerName, publish]
  )

  const handleTimeUp = useCallback(() => {
    if (hasRoundEndedRef.current) return
    setIsTimeUp(true)
  }, [])

  useEffect(() => {
    if (!isTimeUp || hasRoundEndedRef.current) return

    const timeoutId = setTimeout(() => {
      setIsTimeUp(false)
      setTimerKey((prev) => prev + 1)
    }, TIME_UP_MESSAGE_DURATION_MS)

    return () => clearTimeout(timeoutId)
  }, [isTimeUp])

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
        <span className="font-pixel text-xs text-pixel-ink">{roundTask.category}</span>

        {!isTimeUp ? (
          <Timer
            key={timerKey}
            startSeconds={ROUND_DURATION_SECONDS}
            onComplete={handleTimeUp}
          />
        ) : (
          <span className="font-pixel text-xs text-pixel-red animate-pulse font-bold">
            TIME IS UP. KEEP CODING.
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
            TIME OVER. Solve all test cases to unlock next round.
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
              players.map((player) => (
                <PlayerRow
                  key={player.id}
                  name={player.name}
                  color={player.color}
                  isYou={player.isYou}
                  isHost={player.isHost}
                  isActive={player.isActive}
                />
              ))
            )}
          </div>
          <TestCaseList tests={tests} checking={running} />
        </aside>

        <main className="lg:col-span-2 flex flex-col gap-3" aria-label="Code editor">
          <div className="bg-pixel-cream border-4 border-pixel-brown-dark px-3 py-2">
            <p className="font-pixel text-[10px] text-pixel-ink">Task: {roundTask.title}</p>
            <p className="font-pixel text-[9px] text-pixel-brown-dark mt-1">{roundTask.description}</p>
          </div>

          <CodeEditor
            code={code}
            onChange={handleCodeChange}
            onSelectionChange={handleSelectionChange}
            remoteCursors={visibleRemoteCursors}
            height="380px"
          />

          <button
            onClick={handleRunTests}
            disabled={running || allPassed}
            className="w-full font-pixel text-xs bg-pixel-green border-4 border-pixel-brown-dark text-white py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? 'RUNNING...' : allPassed ? 'ALL TESTS PASSED' : 'RUN TESTS'}
          </button>

          {isImposter && (
            <div className="bg-pixel-ink border-4 border-pixel-red p-3">
              <p className="font-pixel text-[10px] text-pixel-red mb-2">Sabotage Panel</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(roundTask.sabotageActions || []).map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => handleSabotage(action.id)}
                    disabled={cooldownRemaining > 0}
                    className="font-pixel text-[9px] bg-pixel-red text-white border-2 border-pixel-brown-dark px-2 py-2 disabled:opacity-50"
                    title={action.description}
                  >
                    {action.label}
                  </button>
                ))}
              </div>

              {cooldownRemaining > 0 && (
                <p className="font-pixel text-[9px] text-pixel-cream mt-2">
                  Sabotage cooldown: {cooldownRemaining}s
                </p>
              )}

              {sabotageError && (
                <p className="font-pixel text-[9px] text-pixel-orange mt-2">{sabotageError}</p>
              )}
            </div>
          )}

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
