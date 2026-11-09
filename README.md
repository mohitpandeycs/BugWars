# BugWars

A multiplayer social deduction game built with a Node.js/Express backend and a React frontend. Players join lobbies, take on civilian or imposter roles, vote in emergency meetings, and compete across multiple rounds.

## Project structure

```
backend/   - Express.js API for lobby and game state management
frontend/  - React + Vite client for the game UI
docs/      - Project documentation
```

## Getting started

### Backend

```sh
cd backend
pnpm install
cp ../.env.example .env   # optional: customize PORT
pnpm run dev
```

The backend exposes a REST API under `/api` and listens on `PORT` (default `3000`).

### Frontend

```sh
cd frontend
pnpm install
pnpm run dev
```

## Scripts

Run from the repository root:

```sh
make dev-backend   # start the backend in watch mode
make install       # install dependencies for both services
```

See `backend/README.md` for the full API reference.