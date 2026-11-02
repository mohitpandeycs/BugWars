import { useState, useEffect, useRef, useCallback } from 'react'
import PlayerRow from '../components/PlayerRow'
import ChatBox from '../components/ChatBox'
import Timer from '../components/Timer'
import Button from '../components/Button'
import { MEETING_DURATION_SECONDS, SKIP_VOTE, EJECTION_REVEAL_DURATION_MS } from '../constants/gameConfig'
import { scheduleFakeVotes } from '../mocks/fakeMeeting'

function EmergencyMeeting({
    players = [],
    callerName = 'A player',
    myPlayerId = '',
    allRoles = {},
    onMeetingComplete,
}) {
    const [votes, setVotes] = useState({})
    const [messages, setMessages] = useState([])
    const [result, setResult] = useState(null) // null while voting, filled in once resolved
    const hasCompletedRef = useRef(false)

    const activePlayers = players.filter((p) => p.isActive)
    const myVote = votes[myPlayerId] ?? null
    const hasVoted = myVote !== null
    const votesCastCount = Object.keys(votes).length

    const tally = useCallback((currentVotes) => {
        const counts = {}
        Object.values(currentVotes).forEach((targetId) => {
            counts[targetId] = (counts[targetId] || 0) + 1
        })
        return counts
    }, [])

    const voteCounts = tally(votes)

    const finishMeeting = useCallback(
        (currentVotes) => {
            if (hasCompletedRef.current) return
            hasCompletedRef.current = true

            const counts = tally(currentVotes)
            let ejectedId = null
            let maxVotes = 0
            let tie = false

            Object.entries(counts).forEach(([id, count]) => {
                if (id === SKIP_VOTE) return
                if (count > maxVotes) {
                    maxVotes = count
                    ejectedId = id
                    tie = false
                } else if (count === maxVotes && count > 0) {
                    tie = true
                }
            })

            const skipCount = counts[SKIP_VOTE] || 0
            if (tie || skipCount >= maxVotes) {
                ejectedId = null
            }

            const ejectedPlayer = ejectedId ? players.find((p) => p.id === ejectedId) : null
            const ejectedRole = ejectedId ? allRoles[ejectedId] ?? 'civilian' : null

            // Sets result — this triggers the component to switch to the
            // result view below. onMeetingComplete is NOT called here.
            setResult({ ejectedId, ejectedPlayer, ejectedRole })
        },
        [tally, players, allRoles]
    )

    const handleVote = (targetId) => {
        if (hasVoted || !myPlayerId) return
        if (targetId !== SKIP_VOTE && targetId === myPlayerId) return
        setVotes((prev) => ({ ...prev, [myPlayerId]: targetId }))
    }

    useEffect(() => {
        const activeIds = players.filter((p) => p.isActive).map((p) => p.id)
        const allVoted = activeIds.length > 0 && activeIds.every((id) => votes[id] !== undefined)
        if (allVoted) {
            finishMeeting(votes)
        }
    }, [votes, players, finishMeeting])

    // TEMPORARY: simulate fake players voting. Remove once real multiplayer
    // voting exists.
    useEffect(() => {
        const fakePlayers = activePlayers.filter((p) => p.id !== myPlayerId)
        const activeIds = activePlayers.map((p) => p.id)

        const cancel = scheduleFakeVotes(fakePlayers, activeIds, (voterId, targetId) => {
            setVotes((prev) => (prev[voterId] !== undefined ? prev : { ...prev, [voterId]: targetId }))
        })

        return cancel
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleTimeUp = useCallback(() => {
        finishMeeting(votes)
    }, [finishMeeting, votes])

    // Once `result` is set, wait EJECTION_REVEAL_DURATION_MS so the player
    // can actually read the outcome, THEN call onMeetingComplete to return
    // to gameplay.
    useEffect(() => {
        if (!result) return
        const timer = setTimeout(() => {
            onMeetingComplete?.(result.ejectedId)
        }, EJECTION_REVEAL_DURATION_MS)
        return () => clearTimeout(timer)
    }, [result, onMeetingComplete])

    const handleSendMessage = (text) => {
        setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), sender: 'You', text, color: '#D9534F' },
        ])
    }

    // --- RESULT VIEW: shown after voting finishes, before returning to Game Round ---
    if (result) {
        const wasNoOne = !result.ejectedPlayer

        return (
            <div className="min-h-screen bg-pixel-cream-dark flex flex-col items-center justify-center gap-4 p-4 text-center">
                <h1 className="font-pixel text-pixel-orange text-lg sm:text-xl">
                    {wasNoOne ? 'NO ONE WAS EJECTED' : `${result.ejectedPlayer.name} WAS EJECTED`}
                </h1>

                {!wasNoOne && (
                    <p
                        className={`font-pixel text-base ${result.ejectedRole === 'imposter' ? 'text-pixel-red' : 'text-pixel-green'
                            }`}
                    >
                        {result.ejectedRole === 'imposter' ? 'They were the IMPOSTER!' : 'They were a CIVILIAN.'}
                    </p>
                )}

                {wasNoOne && (
                    <p className="font-pixel text-xs text-pixel-ink max-w-xs">
                        The vote was tied, or the majority chose to skip.
                    </p>
                )}

                <p className="font-pixel text-[10px] text-pixel-green" role="status">
                    Continuing...
                </p>
            </div>
        )
    }

    // --- VOTING VIEW ---
    return (
        <div className="min-h-screen bg-pixel-cream-dark flex flex-col p-2 sm:p-4 gap-3">
            <header className="flex flex-col items-center gap-1 bg-pixel-red border-4 border-pixel-brown-dark px-4 py-3">
                <h1 className="font-pixel text-sm sm:text-base text-white">EMERGENCY MEETING</h1>
                <p className="font-pixel text-[10px] text-white/90">Meeting called by {callerName}</p>
                <Timer startSeconds={MEETING_DURATION_SECONDS} onComplete={handleTimeUp} />
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1">
                <section aria-label="Vote for the imposter" className="flex flex-col gap-2">
                    <p className="font-pixel text-xs text-pixel-ink">Who is the Imposter?</p>

                    {activePlayers.length === 0 ? (
                        <p className="font-pixel text-[10px] text-pixel-brown/60">No active players</p>
                    ) : (
                        activePlayers.map((p) => (
                            <PlayerRow
                                key={p.id}
                                name={p.name}
                                color={p.color}
                                isYou={p.isYou}
                                isHost={p.isHost}
                                voteCount={voteCounts[p.id] || null}
                                votedFor={myVote === p.id}
                                onClick={p.id === myPlayerId ? undefined : () => handleVote(p.id)}
                                disabled={hasVoted}
                            />
                        ))
                    )}

                    <Button
                        variant="outline"
                        onClick={() => handleVote(SKIP_VOTE)}
                        disabled={hasVoted}
                        aria-pressed={myVote === SKIP_VOTE}
                    >
                        {myVote === SKIP_VOTE ? 'SKIPPED ✔' : 'SKIP VOTE'}
                    </Button>

                    {hasVoted && (
                        <p className="font-pixel text-[10px] text-pixel-green" role="status">
                            Vote recorded — {votesCastCount}/{activePlayers.length} voted, waiting for others...
                        </p>
                    )}
                </section>

                <section aria-label="Meeting chat">
                    <ChatBox messages={messages} onSendMessage={handleSendMessage} />
                </section>
            </div>
        </div>
    )
}

export default EmergencyMeeting