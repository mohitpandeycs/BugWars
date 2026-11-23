import express from 'express'
import { readState, updateState } from './store.js'
import {
  HttpError,
  assertCondition,
  normalizeLobbyCode,
  sanitizeName,
  generatePlayerId,
  generateLobbyCode,
  pickNextPlayerColor,
  assignRoles,
  toLobbyPayload,
  touchLobby,
  cleanupExpiredLobbies,
  resolveWinnerAfterMeeting,
  MIN_PLAYERS_TO_START,
  MAX_PLAYERS,
  TOTAL_ROUNDS,
  DEFAULT_CATEGORY,
} from './game.js'

const app = express()
app.use(express.json({ limit: '10kb' }))

app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  if (_req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  next()
})

function findLobbyOrThrow(state, lobbyCode) {
  const code = normalizeLobbyCode(lobbyCode)
  const lobby = state.lobbies[code]
  assertCondition(Boolean(lobby), 404, 'Lobby not found')
  return { code, lobby }
}

function findPlayerOrThrow(lobby, playerId) {
  const player = lobby.players.find((p) => p.id === playerId)
  assertCondition(Boolean(player), 404, 'Player not found')
  return player
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/lobbies', (req, res) => {
  const name = sanitizeName(req.body?.name)

  const payload = updateState((state) => {
    cleanupExpiredLobbies(state)

    const code = generateLobbyCode(state.lobbies)
    const hostId = generatePlayerId()
    const now = new Date().toISOString()

    const host = {
      id: hostId,
      name,
      color: pickNextPlayerColor([]),
      isReady: true,
      isActive: true,
    }

    const lobby = {
      code,
      hostId,
      players: [host],
      phase: 'lobby',
      round: 1,
      selectedCategory: DEFAULT_CATEGORY,
      roles: {},
      winner: null,
      createdAt: now,
      updatedAt: now,
    }

    state.lobbies[code] = lobby

    return {
      lobby: toLobbyPayload(lobby),
      playerId: hostId,
    }
  })

  res.status(201).json(payload)
})

app.post('/api/lobbies/:code/join', (req, res) => {
  const name = sanitizeName(req.body?.name)

  const payload = updateState((state) => {
    cleanupExpiredLobbies(state)
    const { lobby } = findLobbyOrThrow(state, req.params.code)

    assertCondition(lobby.phase === 'lobby', 409, 'Game has already started')
    assertCondition(lobby.players.length < MAX_PLAYERS, 409, 'Lobby is full')

    const duplicate = lobby.players.some(
      (player) => player.name.toLowerCase() === name.toLowerCase()
    )
    assertCondition(!duplicate, 409, 'This name is already used in the lobby')

    const playerId = generatePlayerId()
    const newPlayer = {
      id: playerId,
      name,
      color: pickNextPlayerColor(lobby.players),
      isReady: false,
      isActive: true,
    }

    lobby.players.push(newPlayer)
    touchLobby(lobby)

    return {
      lobby: toLobbyPayload(lobby),
      playerId,
    }
  })

  res.json(payload)
})

app.get('/api/lobbies/:code', (req, res) => {
  const state = readState()
  cleanupExpiredLobbies(state)

  const { lobby } = findLobbyOrThrow(state, req.params.code)
  res.json({ lobby: toLobbyPayload(lobby) })
})

app.post('/api/lobbies/:code/toggle-ready', (req, res) => {
  const playerId = String(req.body?.playerId || '')

  const payload = updateState((state) => {
    const { lobby } = findLobbyOrThrow(state, req.params.code)
    assertCondition(playerId.length > 0, 400, 'Player ID is required')
    assertCondition(lobby.phase === 'lobby', 409, 'Ready status can only change in lobby')

    const player = findPlayerOrThrow(lobby, playerId)
    assertCondition(player.isActive, 409, 'Inactive players cannot update ready status')

    if (player.id !== lobby.hostId) {
      player.isReady = !player.isReady
    }

    touchLobby(lobby)
    return { lobby: toLobbyPayload(lobby) }
  })

  res.json(payload)
})

app.post('/api/lobbies/:code/start', (req, res) => {
  const playerId = String(req.body?.playerId || '')

  const payload = updateState((state) => {
    const { lobby } = findLobbyOrThrow(state, req.params.code)

    assertCondition(playerId.length > 0, 400, 'Player ID is required')
    assertCondition(lobby.phase === 'lobby', 409, 'Game is already in progress')
    assertCondition(lobby.hostId === playerId, 403, 'Only host can start the game')
    assertCondition(lobby.players.length >= MIN_PLAYERS_TO_START, 409, 'Not enough players to start')

    const everyoneReady = lobby.players.every((player) => player.isReady)
    assertCondition(everyoneReady, 409, 'All players must be ready')

    lobby.phase = 'inGame'
    lobby.round = 1
    lobby.winner = null
    lobby.selectedCategory = DEFAULT_CATEGORY
    lobby.roles = assignRoles(lobby.players)
    lobby.players = lobby.players.map((player) => ({ ...player, isActive: true }))
    touchLobby(lobby)

    return {
      lobby: toLobbyPayload(lobby),
      myRole: lobby.roles[playerId] || 'civilian',
    }
  })

  res.json(payload)
})

app.post('/api/lobbies/:code/category', (req, res) => {
  const category = String(req.body?.category || '').trim()

  const payload = updateState((state) => {
    const { lobby } = findLobbyOrThrow(state, req.params.code)
    assertCondition(lobby.phase === 'inGame', 409, 'Game is not in progress')
    assertCondition(category.length > 0, 400, 'Category is required')

    lobby.selectedCategory = category
    touchLobby(lobby)

    return { lobby: toLobbyPayload(lobby) }
  })

  res.json(payload)
})

app.post('/api/lobbies/:code/meeting-result', (req, res) => {
  const ejectedId = req.body?.ejectedId ? String(req.body.ejectedId) : null

  const payload = updateState((state) => {
    const { lobby } = findLobbyOrThrow(state, req.params.code)
    assertCondition(lobby.phase === 'inGame', 409, 'Game is not in progress')

    if (ejectedId) {
      const ejected = findPlayerOrThrow(lobby, ejectedId)
      ejected.isActive = false
    }

    resolveWinnerAfterMeeting(lobby, ejectedId)
    touchLobby(lobby)

    return { lobby: toLobbyPayload(lobby) }
  })

  res.json(payload)
})

app.post('/api/lobbies/:code/round-complete', (req, res) => {
  const payload = updateState((state) => {
    const { lobby } = findLobbyOrThrow(state, req.params.code)
    assertCondition(lobby.phase === 'inGame', 409, 'Game is not in progress')

    if (!lobby.winner) {
      const nextRound = lobby.round + 1
      if (nextRound > TOTAL_ROUNDS) {
        lobby.winner = 'civilians'
      } else {
        lobby.round = nextRound
      }
      touchLobby(lobby)
    }

    return { lobby: toLobbyPayload(lobby) }
  })

  res.json(payload)
})

app.post('/api/lobbies/:code/play-again', (req, res) => {
  const payload = updateState((state) => {
    const { lobby } = findLobbyOrThrow(state, req.params.code)

    lobby.phase = 'lobby'
    lobby.round = 1
    lobby.selectedCategory = DEFAULT_CATEGORY
    lobby.roles = {}
    lobby.winner = null
    lobby.players = lobby.players.map((player) => ({
      ...player,
      isReady: player.id === lobby.hostId,
      isActive: true,
    }))

    touchLobby(lobby)
    return { lobby: toLobbyPayload(lobby) }
  })

  res.json(payload)
})

app.use((error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message })
    return
  }

  console.error(error)
  res.status(500).json({ message: 'Something went wrong' })
})

const PORT = Number(process.env.PORT || 3000)
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})
