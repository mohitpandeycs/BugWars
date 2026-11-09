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