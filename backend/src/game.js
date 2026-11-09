import crypto from 'node:crypto'

export const LOBBY_ID_LENGTH = 6
export const MAX_NAME_LENGTH = 12
export const MIN_PLAYERS_TO_START = 3
export const MAX_PLAYERS = 5
export const TOTAL_ROUNDS = 4
export const DEFAULT_CATEGORY = 'Data Structures & Algorithms'

const PLAYER_COLORS = ['#D9534F', '#3B82C4', '#4CAF50', '#F0A030', '#EC4C8C']

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function assertCondition(condition, status, message) {
  if (!condition) {
    throw new HttpError(status, message)
  }
}

export function normalizeLobbyCode(input) {
  return String(input || '')
    .trim()
    .toUpperCase()
    .slice(0, LOBBY_ID_LENGTH)
}

export function sanitizeName(input) {
  const name = String(input || '')
    .trim()
    .replace(/\s+/g, ' ')

  assertCondition(name.length > 0, 400, 'Name cannot be empty')
  assertCondition(name.length <= MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`)

  return name
}

export function generatePlayerId() {
  return `p-${crypto.randomUUID().slice(0, 8)}`
}

function randomLobbyCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < LOBBY_ID_LENGTH; i += 1) {
    const index = Math.floor(Math.random() * alphabet.length)
    code += alphabet[index]
  }
  return code
}

export function generateLobbyCode(lobbies) {
  for (let i = 0; i < 1000; i += 1) {
    const code = randomLobbyCode()
    if (!lobbies[code]) return code
  }
  throw new HttpError(500, 'Could not generate lobby code')
}

export function pickNextPlayerColor(players) {
  const usedColors = new Set(players.map((p) => p.color))
  const freeColor = PLAYER_COLORS.find((color) => !usedColors.has(color))
  if (freeColor) return freeColor

  return PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)]
}

export function assignRoles(players, imposterCount = 1) {
  const safeImposterCount = Math.max(1, Math.min(imposterCount, players.length - 1))

  const shuffled = [...players]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const imposterIds = shuffled.slice(0, safeImposterCount).map((p) => p.id)
  const imposterIdSet = new Set(imposterIds)

  const roles = {}
  players.forEach((p) => {
    roles[p.id] = imposterIdSet.has(p.id) ? 'imposter' : 'civilian'
  })

  return roles
}