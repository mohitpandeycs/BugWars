const SESSION_KEY = 'code_mafia_player_session'

function hasWindow() {
  return typeof window !== 'undefined'
}

export function savePlayerSession(session) {
  if (!hasWindow()) return

  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // ignore storage errors
  }
}

export function loadPlayerSession() {
  if (!hasWindow()) return null

  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearPlayerSession() {
  if (!hasWindow()) return
  try {
    window.sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore storage errors
  }
}
