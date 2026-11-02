import { useState, useEffect, useRef } from 'react'
import Panel from '../components/Panel'
import Button from '../components/Button'
import PlayerRow from '../components/PlayerRow'
import CloudBackground from '../components/CloudBackground'
import { LOBBY_CLOUDS } from '../constants/cloudPresets'
import { MIN_PLAYERS_TO_START, MAX_PLAYERS } from '../constants/gameConfig'

function Lobby({ lobbyCode, players = [], isHost = false, isReady = false, onToggleReady, onStartGame, starting = false }) {
    const [copyStatus, setCopyStatus] = useState('idle') // 'idle' | 'copied' | 'failed'
    const copyTimeoutRef = useRef(null)

    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
        }
    }, [])

    const allPlayersReady = players.length > 0 && players.every((p) => p.isReady)
    const canStart = isHost && players.length >= MIN_PLAYERS_TO_START && allPlayersReady && !starting
    const playersNeeded = Math.max(0, MIN_PLAYERS_TO_START - players.length)

    const handleCopyCode = async () => {
        if (!lobbyCode) return
        try {
            await navigator.clipboard?.writeText(lobbyCode)
            setCopyStatus('copied')
        } catch {
            setCopyStatus('failed')
        }
        copyTimeoutRef.current = setTimeout(() => setCopyStatus('idle'), 1500)
    }

    const copyMessage =
        copyStatus === 'copied' ? 'Copied!' : copyStatus === 'failed' ? 'Copy failed — select manually' : null

    return (
        <div className="min-h-screen bg-gradient-to-b from-pixel-sky-top to-pixel-sky-bottom relative overflow-hidden flex flex-col items-center justify-center gap-6 p-4">
            <CloudBackground clouds={LOBBY_CLOUDS} />

            <h1 className="font-pixel text-pixel-orange text-2xl">LOBBY</h1>

            <Panel className="w-full max-w-sm text-center">
                <p className="font-pixel text-xs text-pixel-ink mb-2">Lobby Code:</p>
                <button
                    onClick={handleCopyCode}
                    className="font-pixel text-lg text-pixel-orange tracking-widest underline decoration-dotted"
                    aria-label={copyStatus === 'copied' ? 'Lobby code copied' : 'Copy lobby code'}
                >
                    {lobbyCode || '------'}
                </button>
                {copyMessage && (
                    <p
                        className={`font-pixel text-[10px] mt-1 ${copyStatus === 'failed' ? 'text-pixel-red' : 'text-pixel-green'}`}
                        role="status"
                    >
                        {copyMessage}
                    </p>
                )}
            </Panel>

            <Panel className="w-full max-w-sm">
                <p className="font-pixel text-xs text-pixel-ink mb-3">
                    Players ({players.length}/{MAX_PLAYERS})
                </p>

                {players.length === 0 ? (
                    <p className="font-pixel text-[10px] text-pixel-brown/60 text-center">
                        Waiting for players...
                    </p>
                ) : (
                    players.map((p) => (
                        <PlayerRow
                            key={p.id}
                            name={p.name}
                            color={p.color}
                            isYou={p.isYou}
                            isHost={p.isHost}
                            isReady={p.isReady}
                        />
                    ))
                )}
            </Panel>

            {isHost ? (
                <Button variant="orange" onClick={onStartGame} disabled={!canStart}>
                    {starting
                        ? 'STARTING...'
                        : canStart
                            ? 'START GAME'
                            : players.length < MIN_PLAYERS_TO_START
                                ? `NEED ${playersNeeded} MORE`
                                : 'WAITING FOR PLAYERS TO READY UP'}
                </Button>
            ) : (
                <Button variant={isReady ? 'outline' : 'green'} onClick={onToggleReady}>
                    {isReady ? 'CANCEL READY' : 'READY!'}
                </Button>
            )}
        </div>
    )
}

export default Lobby