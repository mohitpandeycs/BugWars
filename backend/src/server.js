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
app.use(express.json())

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
    const player = findPlayerOrThrow(lobby, playerId)

    assertCondition(lobby.phase === 'lobby', 409, 'Game has already started')

    player.isReady = !player.isReady
    touchLobby(lobby)

    return {
      lobby: toLobbyPayload(lobby),
    }
  })

  res.json(payload)
})