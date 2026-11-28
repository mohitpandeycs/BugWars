import crypto from 'node:crypto'
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
  resolveWinnerAfterPlayerLeave,
  MIN_PLAYERS_TO_START,
  MAX_PLAYERS,
  TOTAL_ROUNDS,
  DEFAULT_CATEGORY,
} from './game.js'

const SKIP_VOTE = 'skip'

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

function getActivePlayers(lobby) {
  return lobby.players.filter((player) => player.isActive)
}

function resolveMeetingVotes(lobby) {
  const meeting = lobby.meeting
  assertCondition(Boolean(meeting), 409, 'No active meeting')

  const activePlayers = getActivePlayers(lobby)
  const activeSet = new Set(activePlayers.map((player) => player.id))
  const counts = {}

  Object.entries(meeting.votes || {}).forEach(([voterId, targetId]) => {
    if (!activeSet.has(voterId)) return
    if (targetId !== SKIP_VOTE && !activeSet.has(targetId)) return
    counts[targetId] = (counts[targetId] || 0) + 1
  })

  let ejectedId = null
  let maxVotes = 0
  let tie = false

  Object.entries(counts).forEach(([candidateId, voteCount]) => {
    if (candidateId === SKIP_VOTE) return

    if (voteCount > maxVotes) {
      maxVotes = voteCount
      ejectedId = candidateId
      tie = false
    } else if (voteCount === maxVotes && voteCount > 0) {
      tie = true
    }
  })

  const skipCount = counts[SKIP_VOTE] || 0
  if (tie || skipCount >= maxVotes) {
    ejectedId = null
  }

  meeting.status = 'resolved'
  meeting.result = {
    ejectedId,
    resolvedAt: new Date().toISOString(),
  }

  return meeting.result
}

function maybeResolveMeetingIfComplete(lobby) {
  if (lobby.phase !== 'meeting' || !lobby.meeting || lobby.meeting.status !== 'voting') {
    return
  }

  const activePlayers = getActivePlayers(lobby)
  if (activePlayers.length === 0) {
    resolveMeetingVotes(lobby)
    return
  }

  const allVoted = activePlayers.every((player) => lobby.meeting.votes?.[player.id] !== undefined)
  if (allVoted) {
    resolveMeetingVotes(lobby)
  }
}

function finalizeMeeting(lobby) {
  const meeting = lobby.meeting
  assertCondition(Boolean(meeting), 409, 'No active meeting')

  if (meeting.status === 'voting') {
    resolveMeetingVotes(lobby)
  }

  if (meeting.status === 'finalized') {
    return
  }

  const ejectedId = meeting.result?.ejectedId || null

  if (ejectedId) {
    const ejectedPlayer = lobby.players.find((player) => player.id === ejectedId)
    if (ejectedPlayer) {
      ejectedPlayer.isActive = false
    }
  }

  resolveWinnerAfterMeeting(lobby, ejectedId)
  lobby.phase = 'inGame'
  meeting.status = 'finalized'
  meeting.finalizedAt = new Date().toISOString()
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
      meeting: null,
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

app.post('/api/lobbies/:code/leave', (req, res) => {
  const playerId = String(req.body?.playerId || '')

  const payload = updateState((state) => {
    const { code, lobby } = findLobbyOrThrow(state, req.params.code)

    assertCondition(playerId.length > 0, 400, 'Player ID is required')

    const playerIndex = lobby.players.findIndex((player) => player.id === playerId)
    if (playerIndex < 0) {
      return { lobby: toLobbyPayload(lobby), removed: false }
    }

    lobby.players.splice(playerIndex, 1)
    delete lobby.roles[playerId]

    if (lobby.meeting?.votes) {
      delete lobby.meeting.votes[playerId]
      Object.keys(lobby.meeting.votes).forEach((voterId) => {
        if (lobby.meeting.votes[voterId] === playerId) {
          delete lobby.meeting.votes[voterId]
        }
      })
    }

    if (lobby.players.length === 0) {
      delete state.lobbies[code]
      return { lobby: null, removed: true }
    }

    if (lobby.hostId === playerId) {
      lobby.hostId = lobby.players[0].id
      if (lobby.phase === 'lobby') {
        const nextHost = lobby.players.find((player) => player.id === lobby.hostId)
        if (nextHost) {
          nextHost.isReady = true
        }
      }
    }

    if (lobby.phase === 'meeting' && lobby.meeting?.status === 'voting') {
      maybeResolveMeetingIfComplete(lobby)
    }

    resolveWinnerAfterPlayerLeave(lobby)
    touchLobby(lobby)

    return {
      lobby: toLobbyPayload(lobby),
      removed: true,
    }
  })

  res.json(payload)
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
    lobby.meeting = null
    touchLobby(lobby)

    return {
      lobby: toLobbyPayload(lobby),
      myRole: lobby.roles[playerId] || 'civilian',
    }
  })

  res.json(payload)
})

app.post('/api/lobbies/:code/emergency', (req, res) => {
  const playerId = String(req.body?.playerId || '')

  const payload = updateState((state) => {
    const { lobby } = findLobbyOrThrow(state, req.params.code)

    assertCondition(playerId.length > 0, 400, 'Player ID is required')

    if (lobby.phase === 'meeting' && lobby.meeting) {
      return { lobby: toLobbyPayload(lobby) }
    }

    assertCondition(lobby.phase === 'inGame', 409, 'Game is not in progress')
    assertCondition(!lobby.winner, 409, 'Game has already finished')

    const caller = findPlayerOrThrow(lobby, playerId)
    assertCondition(caller.isActive, 409, 'Only active players can call a meeting')

    lobby.phase = 'meeting'
    lobby.meeting = {
      id: `meeting-${crypto.randomUUID()}`,
      callerId: caller.id,
      callerName: caller.name,
      votes: {},
      status: 'voting',
      result: null,
      startedAt: new Date().toISOString(),
      finalizedAt: null,
    }

    touchLobby(lobby)
    return { lobby: toLobbyPayload(lobby) }
  })

  res.json(payload)
})

app.post('/api/lobbies/:code/meeting-vote', (req, res) => {
  const playerId = String(req.body?.playerId || '')
  const targetId = String(req.body?.targetId || '').trim()

  const payload = updateState((state) => {
    const { lobby } = findLobbyOrThrow(state, req.params.code)

    assertCondition(playerId.length > 0, 400, 'Player ID is required')
    assertCondition(targetId.length > 0, 400, 'Vote target is required')
    assertCondition(lobby.phase === 'meeting', 409, 'Meeting is not active')
    assertCondition(Boolean(lobby.meeting), 409, 'Meeting is not active')
    assertCondition(lobby.meeting.status === 'voting', 409, 'Voting has already finished')

    const voter = findPlayerOrThrow(lobby, playerId)
    assertCondition(voter.isActive, 409, 'Inactive players cannot vote')
    assertCondition(lobby.meeting.votes[playerId] === undefined, 409, 'Vote already submitted')

    if (targetId !== SKIP_VOTE) {
      const targetPlayer = findPlayerOrThrow(lobby, targetId)
      assertCondition(targetPlayer.isActive, 409, 'Target player is not active')
      assertCondition(targetPlayer.id !== voter.id, 409, 'You cannot vote for yourself')
    }

    lobby.meeting.votes[playerId] = targetId
    maybeResolveMeetingIfComplete(lobby)

    touchLobby(lobby)
    return { lobby: toLobbyPayload(lobby) }
  })

  res.json(payload)
})

app.post('/api/lobbies/:code/meeting-resolve', (req, res) => {
  const payload = updateState((state) => {
    const { lobby } = findLobbyOrThrow(state, req.params.code)

    assertCondition(lobby.phase === 'meeting', 409, 'Meeting is not active')
    assertCondition(Boolean(lobby.meeting), 409, 'Meeting is not active')

    if (lobby.meeting.status === 'voting') {
      resolveMeetingVotes(lobby)
    }

    touchLobby(lobby)
    return { lobby: toLobbyPayload(lobby) }
  })

  res.json(payload)
})

app.post('/api/lobbies/:code/meeting-complete', (req, res) => {
  const payload = updateState((state) => {
    const { lobby } = findLobbyOrThrow(state, req.params.code)

    assertCondition(lobby.phase === 'meeting', 409, 'Meeting is not active')
    assertCondition(Boolean(lobby.meeting), 409, 'Meeting is not active')

    finalizeMeeting(lobby)
    touchLobby(lobby)

    return { lobby: toLobbyPayload(lobby) }
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
    lobby.meeting = null
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
