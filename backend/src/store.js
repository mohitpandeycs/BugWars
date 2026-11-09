import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataFile = path.join(__dirname, '../data/store.json')

const defaultState = {
  lobbies: {},
}

function ensureDataFile() {
  const dir = path.dirname(dataFile)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(defaultState, null, 2), 'utf-8')
  }
}

export function readState() {
  ensureDataFile()

  try {
    const raw = fs.readFileSync(dataFile, 'utf-8')
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || typeof parsed.lobbies !== 'object') {
      throw new Error('Invalid state shape')
    }
    return parsed
  } catch {
    fs.writeFileSync(dataFile, JSON.stringify(defaultState, null, 2), 'utf-8')
    return JSON.parse(JSON.stringify(defaultState))
  }
}

export function writeState(state) {
  ensureDataFile()
  fs.writeFileSync(dataFile, JSON.stringify(state, null, 2), 'utf-8')
}

export function updateState(mutator) {
  const state = readState()
  const result = mutator(state)
  writeState(state)
  return result
}
