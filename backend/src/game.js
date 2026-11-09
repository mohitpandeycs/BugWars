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