const STORAGE_PREFIX = 'code_mafia_round_state'

function hasWindow() {
  return typeof window !== 'undefined'
}

function getStorageKey(roomCode, round) {
  return `${STORAGE_PREFIX}:${roomCode}:round:${round}`
}

function getChannelName(roomCode, round) {
  return `code_mafia_channel:${roomCode}:round:${round}`
}

export function loadRoundSnapshot({ roomCode, round, fallback = null }) {
  if (!hasWindow() || !roomCode) return fallback

  try {
    const raw = window.localStorage.getItem(getStorageKey(roomCode, round))
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function saveRoundSnapshot({ roomCode, round, snapshot }) {
  if (!hasWindow() || !roomCode) return

  try {
    window.localStorage.setItem(getStorageKey(roomCode, round), JSON.stringify(snapshot))
  } catch {
    // ignore quota/transient failures
  }
}

export function createRoundSync({ roomCode, round, playerId }) {
  if (!hasWindow() || !roomCode || !playerId || typeof BroadcastChannel === 'undefined') {
    return {
      publish: () => {},
      subscribe: () => () => {},
      close: () => {},
    }
  }

  const channel = new BroadcastChannel(getChannelName(roomCode, round))
  const listeners = new Set()

  channel.onmessage = (event) => {
    const message = event?.data
    if (!message || message.senderId === playerId) return

    listeners.forEach((listener) => {
      listener(message)
    })
  }

  return {
    publish(type, payload = {}) {
      channel.postMessage({
        type,
        payload,
        senderId: playerId,
        createdAt: Date.now(),
      })
    },

    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    close() {
      listeners.clear()
      channel.close()
    },
  }
}
