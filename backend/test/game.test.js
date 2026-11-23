import { test } from 'node:test'
import assert from 'node:assert'
import {
  normalizeLobbyCode,
  sanitizeName,
  generateLobbyCode,
  pickNextPlayerColor,
  assignRoles,
  resolveWinnerAfterMeeting,
  HttpError,
  assertCondition,
} from '../src/game.js'

test('normalizeLobbyCode trims and uppercases input', () => {
  assert.strictEqual(normalizeLobbyCode('  abc123  '), 'ABC123')
})

test('normalizeLobbyCode slices to LOBBY_ID_LENGTH', () => {
  assert.strictEqual(normalizeLobbyCode('ABCDEFGH'), 'ABCDEF')
})

test('sanitizeName throws on empty name', () => {
  assert.throws(() => sanitizeName(''), { name: 'HttpError', status: 400 })
})

test('sanitizeName throws on name too long', () => {
  assert.throws(() => sanitizeName('A'.repeat(13)), { name: 'HttpError', status: 400 })
})

test('sanitizeName collapses whitespace', () => {
  assert.strictEqual(sanitizeName('  John   Doe  '), 'John Doe')
})

test('generateLobbyCode returns a unique code', () => {
  const code = generateLobbyCode({})
  assert.strictEqual(code.length, 6)
})

test('generateLobbyCode returns a code not in existing lobbies', () => {
  const taken = { ABCDEF: true, GHIJKL: true }
  const code = generateLobbyCode(taken)
  assert.strictEqual(code.length, 6)
  assert.notStrictEqual(code, 'ABCDEF')
  assert.notStrictEqual(code, 'GHIJKL')
})

test('pickNextPlayerColor returns unused color', () => {
  const color = pickNextPlayerColor([{ color: '#D9534F' }])
  assert.notStrictEqual(color, '#D9534F')
})

test('assignRoles assigns exactly one imposter', () => {
  const players = [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
    { id: 'p3', name: 'Carol' },
  ]
  const roles = assignRoles(players)
  const imposters = Object.values(roles).filter((r) => r === 'imposter')
  assert.strictEqual(imposters.length, 1)
})

test('resolveWinnerAfterMeeting sets civilians winner when imposter ejected', () => {
  const lobby = {
    roles: { p1: 'imposter', p2: 'civilian' },
    players: [
      { id: 'p1', isActive: true },
      { id: 'p2', isActive: true },
    ],
  }
  resolveWinnerAfterMeeting(lobby, 'p1')
  assert.strictEqual(lobby.winner, 'civilians')
})

test('resolveWinnerAfterMeeting sets imposter winner when last civilian ejected', () => {
  const lobby = {
    roles: { p1: 'imposter', p2: 'civilian' },
    players: [
      { id: 'p1', isActive: true },
      { id: 'p2', isActive: false },
    ],
  }
  resolveWinnerAfterMeeting(lobby, 'p2')
  assert.strictEqual(lobby.winner, 'imposter')
})

test('HttpError stores status and message', () => {
  const err = new HttpError(404, 'Not found')
  assert.strictEqual(err.status, 404)
  assert.strictEqual(err.message, 'Not found')
})

test('assertCondition throws HttpError when condition is false', () => {
  assert.throws(() => assertCondition(false, 400, 'Bad request'), { name: 'HttpError', status: 400 })
})

test('assertCondition does nothing when condition is true', () => {
  assert.doesNotThrow(() => assertCondition(true, 400, 'Bad request'))
})