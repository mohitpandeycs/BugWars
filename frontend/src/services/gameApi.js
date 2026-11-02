const API_PREFIX = '/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_PREFIX}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed')
  }

  return payload
}

export function createLobby(name) {
  return request('/lobbies', {
    method: 'POST',
    body: { name },
  })
}

export function joinLobby(lobbyCode, name) {
  return request(`/lobbies/${encodeURIComponent(lobbyCode)}/join`, {
    method: 'POST',
    body: { name },
  })
}

export function getLobby(lobbyCode) {
  return request(`/lobbies/${encodeURIComponent(lobbyCode)}`)
}

export function toggleReady(lobbyCode, playerId) {
  return request(`/lobbies/${encodeURIComponent(lobbyCode)}/toggle-ready`, {
    method: 'POST',
    body: { playerId },
  })
}

export function startGame(lobbyCode, playerId) {
  return request(`/lobbies/${encodeURIComponent(lobbyCode)}/start`, {
    method: 'POST',
    body: { playerId },
  })
}

export function setCategory(lobbyCode, category) {
  return request(`/lobbies/${encodeURIComponent(lobbyCode)}/category`, {
    method: 'POST',
    body: { category },
  })
}

export function submitMeetingResult(lobbyCode, ejectedId) {
  return request(`/lobbies/${encodeURIComponent(lobbyCode)}/meeting-result`, {
    method: 'POST',
    body: { ejectedId },
  })
}

export function completeRound(lobbyCode) {
  return request(`/lobbies/${encodeURIComponent(lobbyCode)}/round-complete`, {
    method: 'POST',
  })
}

export function playAgain(lobbyCode) {
  return request(`/lobbies/${encodeURIComponent(lobbyCode)}/play-again`, {
    method: 'POST',
  })
}
