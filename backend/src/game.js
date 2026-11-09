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