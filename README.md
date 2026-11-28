# Code Mafia — Production-Ready Multiplayer Coding Deduction Game

Code Mafia is a retro pixel-art social deduction web app where 3–5 players solve live Python coding challenges while a hidden Imposter sabotages the session.

This project includes:
- **Frontend**: React + Vite game client
- **Backend**: Express API for lobby, game state, emergency meeting votes, and player presence
- **Persistence**: file-based state store for lobby continuity (`backend/data/store.json`)

---

## 1) Features

### Core Multiplayer Flow
- Create room with 6-character code
- Join room with unique player name
- Ready-up flow and host-controlled game start
- Secret role assignment (Civilian / Imposter)
- Category voting and round progression
- Emergency meeting and full-room voting resolution
- Endgame + play again loop

### Real-Time Gameplay
- Shared coding round collaboration (room + round sync)
- Team chat updates during coding rounds
- Remote cursor sharing
- Imposter sabotage actions with cooldown

### Reliability Improvements Included
- No mock voting logic in active gameplay flow
- Emergency meetings support votes from **all active players**
- Player is auto-removed from room on tab close (`pagehide` + beacon/keepalive)
- Meeting finalization properly ejects voted player and resumes gameplay

---

## 2) Project Structure

```text
/frontend
  /src
    /components
    /pages
    /services
/backend
  /src
  /data/store.json
/docs/project.json
README.md
```

---

## 3) Prerequisites

- Node.js 18+
- pnpm 8+

Check versions:

```bash
node -v
pnpm -v
```

---

## 4) Install

```bash
pnpm --dir backend install
pnpm --dir frontend install
```

---

## 5) Run Locally

### Terminal A — Backend

```bash
pnpm --dir backend dev
```

Backend URL: `http://localhost:3000`

Health check:

```bash
curl http://localhost:3000/api/health
```

### Terminal B — Frontend

```bash
pnpm --dir frontend dev
```

Frontend URL: `http://localhost:5173`

---

## 6) Build & Quality Checks

```bash
pnpm --dir frontend lint
pnpm --dir frontend build
node --check backend/src/server.js
node --check backend/src/game.js
node --check backend/src/store.js
```

---

## 7) Gameplay API (Backend)

### Lobby & Presence
- `POST /api/lobbies` — create lobby
- `POST /api/lobbies/:code/join` — join lobby
- `GET /api/lobbies/:code` — fetch live lobby state
- `POST /api/lobbies/:code/leave` — leave room (also used on tab close)
- `POST /api/lobbies/:code/toggle-ready` — toggle ready
- `POST /api/lobbies/:code/start` — host starts game

### Meeting Flow
- `POST /api/lobbies/:code/emergency` — open emergency meeting
- `POST /api/lobbies/:code/meeting-vote` — cast vote
- `POST /api/lobbies/:code/meeting-resolve` — force resolve when timer ends
- `POST /api/lobbies/:code/meeting-complete` — finalize ejection + return to game

### Round Flow
- `POST /api/lobbies/:code/category` — set selected category
- `POST /api/lobbies/:code/round-complete` — progress round or declare civilians win
- `POST /api/lobbies/:code/play-again` — reset game to lobby

---

## 8) Manual End-to-End Verification Checklist

Use this sequence after startup:

1. Create room as Host
2. Join with 2+ players
3. Ready all non-host players
4. Start game as host
5. Trigger emergency meeting
6. Cast votes from all active players
7. Verify vote result and ejection reveal
8. Verify return to gameplay screen
9. Close one player tab, verify player is removed from room
10. Complete rounds and verify final result flow

---

## 9) Troubleshooting

### App does not move after Start
- Ensure all non-host players are ready
- Verify backend is running on port `3000`
- Confirm frontend can reach `/api` routes

### Emergency votes not progressing
- Confirm players are active in room
- Verify each active player votes once
- On timeout, backend resolves via meeting-resolve and finalize flow

### Player ghost remains after tab close
- `pagehide` leave signal is sent via `sendBeacon` or keepalive fallback
- If browser blocks background send, polling sync will still refresh lobby members

---

## 10) Notes

- Current build may show a non-blocking bundle-size warning during `vite build`.
- This does **not** block runtime correctness; app logic and game flow checks pass.
- If needed later, chunk splitting can be added for performance optimization.

---

## 11) License

Private/internal project handoff.
