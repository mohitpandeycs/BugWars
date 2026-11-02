import { useState } from 'react'
import Panel from '../components/Panel'
import Button from '../components/Button'
import Input from '../components/Input'
import CloudBackground from '../components/CloudBackground'
import GameHeader from '../components/GameHeader'
import { HOME_CLOUDS } from '../constants/cloudPresets'
import { LOBBY_ID_LENGTH } from '../constants/gameConfig'

function Home({ onCreateGame, onJoinGame, joining = false, joinError = "", onClearJoinError }) {
    const [lobbyId, setLobbyId] = useState('')

    const trimmedId = lobbyId.trim()
    const canJoin = trimmedId.length > 0 && !joining

    const handleLobbyIdChange = (e) => {
        setLobbyId(e.target.value.toUpperCase().slice(0, LOBBY_ID_LENGTH))
        if (joinError) onClearJoinError?.()
    }

    const handleJoinKeyDown = (e) => {
        if (e.key === 'Enter') handleJoin()
    }

    const handleJoin = () => {
        if (!canJoin) return
        onJoinGame?.(trimmedId)
    }

    const handleCreate = () => {
        onCreateGame?.()
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-pixel-sky-top to-pixel-sky-bottom relative overflow-hidden flex flex-col items-center justify-center gap-6 p-4">
            <CloudBackground clouds={HOME_CLOUDS} />
            <GameHeader />

            <Button variant="orange" onClick={handleCreate}>
                CREATE GAME
            </Button>

            <Panel className="w-full max-w-sm">
                <p className="font-pixel text-xs text-pixel-ink mb-3">Or join a game...</p>
                <div className="flex gap-2">
                    <Input
                        value={lobbyId}
                        onChange={handleLobbyIdChange}
                        onKeyDown={handleJoinKeyDown}
                        placeholder="LOBBY ID"
                        aria-label="Lobby ID"
                        maxLength={LOBBY_ID_LENGTH}
                    />
                    <Button variant="green" onClick={handleJoin} disabled={!canJoin}>
                        {joining ? "..." : "JOIN"}
                    </Button>
                </div>
                {joinError && (
                    <p className="font-pixel text-[10px] text-pixel-red mt-2 flex items-center gap-1" role="alert">
                        ⚠ {joinError}
                    </p>
                )}
            </Panel>

            <p className="font-pixel text-[10px] text-pixel-ink text-center">
                3-5 Players • Find the Impostor
            </p>
        </div>
    )
}

export default Home