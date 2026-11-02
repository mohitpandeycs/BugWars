import { useState, useEffect, useMemo, useCallback } from 'react'
import Home from './pages/Home'
import EnterName from './pages/EnterName'
import Lobby from './pages/Lobby'
import RoleReveal from './pages/RoleReveal'
import VoteCategory from './pages/VoteCategory'
import GameRound from './pages/GameRound'
import EmergencyMeeting from './pages/EmergencyMeeting'
import Results from './pages/Results'
import { PAGES } from './constants/pages'
import { DEFAULT_CATEGORY, TOTAL_ROUNDS } from './constants/gameConfig'
import {
  createLobby,
  joinLobby,
  getLobby,
  toggleReady,
  startGame,
  setCategory,
  submitMeetingResult,
  completeRound,
  playAgain,
} from './services/gameApi'

const FIRST_ROUND = 1
const WINNER_CIVILIANS = 'civilians'

const SYNC_PAGES = new Set([
  PAGES.LOBBY,
  PAGES.ROLE_REVEAL,
  PAGES.VOTE_CATEGORY,
  PAGES.GAME_ROUND,
  PAGES.EMERGENCY_MEETING,
  PAGES.RESULTS,
])

function App() {
  const [page, setPage] = useState(PAGES.HOME)

  const [pendingLobbyId, setPendingLobbyId] = useState('')
  const [joinError, setJoinError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [lobbyCode, setLobbyCode] = useState('')
  const [players, setPlayers] = useState([])
  const [hostId, setHostId] = useState('')
  const [myPlayerId, setMyPlayerId] = useState('')
  const [starting, setStarting] = useState(false)
  const [myRole, setMyRole] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [allRoles, setAllRoles] = useState({})
  const [winner, setWinner] = useState(null)
  const [round, setRound] = useState(FIRST_ROUND)
  const [remountKey, setRemountKey] = useState(0)

  const applyLobbyToState = useCallback(
    (lobby, playerIdHint) => {
      if (!lobby) return

      const resolvedPlayerId = playerIdHint || myPlayerId
      setLobbyCode(lobby.code || '')
      setHostId(lobby.hostId || '')
      setPlayers(lobby.players || [])
      setAllRoles(lobby.roles || {})
      setWinner(lobby.winner || null)

      if (typeof lobby.round === 'number') {
        setRound(lobby.round)
      }

      if (lobby.selectedCategory) {
        setSelectedCategory(lobby.selectedCategory)
      }

      if (resolvedPlayerId) {
        setMyRole((lobby.roles || {})[resolvedPlayerId] || null)
      }
    },
    [myPlayerId]
  )

  const resetGameState = useCallback(() => {
    setWinner(null)
    setPlayers([])
    setMyRole(null)
    setAllRoles({})
    setRound(FIRST_ROUND)
    setRemountKey(0)
    setLobbyCode('')
    setHostId('')
    setMyPlayerId('')
    setSelectedCategory('')
    setPendingLobbyId('')
    setJoinError('')
    setSubmitError('')
  }, [])

  const refreshLobby = useCallback(async () => {
    if (!lobbyCode) return

    try {
      const data = await getLobby(lobbyCode)
      applyLobbyToState(data.lobby)
    } catch {
      // keep UI stable if a transient request fails
    }
  }, [lobbyCode, applyLobbyToState])

  useEffect(() => {
    if (!lobbyCode || !SYNC_PAGES.has(page)) return

    refreshLobby()
    const timer = setInterval(refreshLobby, 2000)
    return () => clearInterval(timer)
  }, [lobbyCode, page, refreshLobby])

  const handleCreateGame = () => {
    setPendingLobbyId('')
    setJoinError('')
    setSubmitError('')
    setPage(PAGES.ENTER_NAME_CREATE)
  }

  const handleJoinGame = (nextLobbyId) => {
    setPendingLobbyId(nextLobbyId)
    setJoinError('')
    setSubmitError('')
    setPage(PAGES.ENTER_NAME_JOIN)
  }

  const handleClearJoinError = () => setJoinError('')

  const handleBackToHome = () => {
    setPage(PAGES.HOME)
    setSubmitError('')
  }

  const handleSubmitName = async (name) => {
    const trimmedName = name?.trim()

    if (!trimmedName) {
      setSubmitError('Name cannot be empty')
      return
    }

    setSubmitting(true)
    setSubmitError('')

    try {
      const isCreate = page === PAGES.ENTER_NAME_CREATE

      if (isCreate) {
        const data = await createLobby(trimmedName)
        setMyPlayerId(data.playerId)
        applyLobbyToState(data.lobby, data.playerId)
        setPage(PAGES.LOBBY)
      } else {
        if (!pendingLobbyId) {
          setSubmitError('No lobby ID provided')
          return
        }

        const data = await joinLobby(pendingLobbyId, trimmedName)
        setMyPlayerId(data.playerId)
        applyLobbyToState(data.lobby, data.playerId)
        setPage(PAGES.LOBBY)
      }
    } catch (error) {
      setSubmitError(error.message || 'Could not submit name')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleReady = async () => {
    if (!lobbyCode || !myPlayerId) return

    try {
      const data = await toggleReady(lobbyCode, myPlayerId)
      applyLobbyToState(data.lobby)
    } catch (error) {
      setSubmitError(error.message || 'Could not update ready state')
    }
  }

  const handleStartGame = async () => {
    if (starting || !lobbyCode || !myPlayerId) return

    setStarting(true)
    setSubmitError('')

    try {
      const data = await startGame(lobbyCode, myPlayerId)
      applyLobbyToState(data.lobby, myPlayerId)
      setMyRole(data.myRole || null)
      setRound(FIRST_ROUND)
      setRemountKey(0)
      setPage(PAGES.ROLE_REVEAL)
    } catch (error) {
      setSubmitError(error.message || 'Could not start game')
      setPage(PAGES.LOBBY)
    } finally {
      setStarting(false)
    }
  }

  const handleRoleRevealComplete = () => {
    setPage(PAGES.VOTE_CATEGORY)
  }

  const handleVoteComplete = async (category) => {
    const finalCategory = category || DEFAULT_CATEGORY
    setSelectedCategory(finalCategory)

    try {
      if (lobbyCode) {
        await setCategory(lobbyCode, finalCategory)
      }
    } catch {
      // continue with local flow even if category sync fails once
    }

    setPage(PAGES.GAME_ROUND)
  }

  const handleEmergencyMeeting = () => {
    setPage(PAGES.EMERGENCY_MEETING)
  }

  const handleMeetingComplete = async (ejectedId) => {
    const normalizedEjectedId = ejectedId || null

    try {
      if (lobbyCode) {
        const data = await submitMeetingResult(lobbyCode, normalizedEjectedId)
        applyLobbyToState(data.lobby)

        if (data.lobby?.winner) {
          setPage(PAGES.RESULTS)
          return
        }
      }
    } catch (error) {
      setSubmitError(error.message || 'Could not save meeting result')
    }

    setRemountKey((prev) => prev + 1)
    setPage(PAGES.GAME_ROUND)
  }

  const handleAllTestsPassed = async () => {
    try {
      if (lobbyCode) {
        const data = await completeRound(lobbyCode)
        applyLobbyToState(data.lobby)

        if (data.lobby?.winner) {
          setPage(PAGES.RESULTS)
          return
        }

        return
      }
    } catch {
      // fallback below
    }

    const nextRound = round + 1
    if (nextRound > TOTAL_ROUNDS) {
      setWinner(WINNER_CIVILIANS)
      setPage(PAGES.RESULTS)
      return
    }

    setRound(nextRound)
  }

  const handlePlayAgain = async () => {
    if (lobbyCode) {
      try {
        await playAgain(lobbyCode)
      } catch {
        // fallback reset still allowed
      }
    }

    resetGameState()
    setPage(PAGES.HOME)
  }

  const isHost = myPlayerId !== '' && myPlayerId === hostId
  const myPlayer = players.find((player) => player.id === myPlayerId)
  const isReady = myPlayer?.isReady ?? false

  const displayPlayers = useMemo(
    () =>
      players.map((player) => ({
        ...player,
        isHost: player.id === hostId,
        isYou: player.id === myPlayerId,
      })),
    [players, hostId, myPlayerId]
  )

  return (
    <>
      {page === PAGES.HOME && (
        <Home
          onCreateGame={handleCreateGame}
          onJoinGame={handleJoinGame}
          joinError={joinError}
          onClearJoinError={handleClearJoinError}
        />
      )}

      {page === PAGES.ENTER_NAME_CREATE && (
        <EnterName
          mode="create"
          onBack={handleBackToHome}
          onSubmitName={handleSubmitName}
          submitting={submitting}
          submitError={submitError}
        />
      )}

      {page === PAGES.ENTER_NAME_JOIN && (
        <EnterName
          mode="join"
          onBack={handleBackToHome}
          onSubmitName={handleSubmitName}
          submitting={submitting}
          submitError={submitError}
        />
      )}

      {page === PAGES.LOBBY && (
        <Lobby
          lobbyCode={lobbyCode}
          players={displayPlayers}
          isHost={isHost}
          isReady={isReady}
          onToggleReady={handleToggleReady}
          onStartGame={handleStartGame}
          starting={starting}
        />
      )}

      {page === PAGES.ROLE_REVEAL && (
        <RoleReveal role={myRole} onRevealComplete={handleRoleRevealComplete} />
      )}

      {page === PAGES.VOTE_CATEGORY && (
        <VoteCategory
          myPlayerId={myPlayerId}
          fakePlayerIds={players.filter((player) => player.id !== myPlayerId).map((player) => player.id)}
          onVoteComplete={handleVoteComplete}
        />
      )}

      {page === PAGES.GAME_ROUND && (
        <GameRound
          key={`${round}-${remountKey}`}
          category={selectedCategory}
          players={displayPlayers}
          round={round}
          onEmergencyCall={handleEmergencyMeeting}
          onAllTestsPassed={handleAllTestsPassed}
        />
      )}

      {page === PAGES.EMERGENCY_MEETING && (
        <EmergencyMeeting
          players={displayPlayers}
          callerName={myPlayer?.name || 'Unknown caller'}
          myPlayerId={myPlayerId}
          allRoles={allRoles}
          onMeetingComplete={handleMeetingComplete}
        />
      )}

      {page === PAGES.RESULTS && (
        <Results
          winner={winner}
          players={displayPlayers}
          allRoles={allRoles}
          onPlayAgain={handlePlayAgain}
        />
      )}

      {!Object.values(PAGES).includes(page) && (
        <p className="font-pixel text-pixel-red text-center mt-10">
          Unknown page: "{page}"
        </p>
      )}
    </>
  )
}

export default App
