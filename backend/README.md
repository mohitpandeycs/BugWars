# Backend

Express.js API for the BugWars lobby and game state management.

## Setup

Install dependencies:

```sh
pnpm install
```

## Run

Start the development server:

```sh
pnpm run dev
```

Or run in production:

```sh
pnpm start
```

The server listens on the port defined by the `PORT` environment variable, defaulting to `3000`.

Copy `.env.example` to `.env` to customize the port.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/lobbies` | Create a new lobby |
| POST | `/api/lobbies/:code/join` | Join a lobby |
| GET | `/api/lobbies/:code` | Get lobby state |
| POST | `/api/lobbies/:code/toggle-ready` | Toggle player ready status |
| POST | `/api/lobbies/:code/start` | Start the game (host only) |
| POST | `/api/lobbies/:code/category` | Set game category |
| POST | `/api/lobbies/:code/meeting-result` | Submit emergency meeting result |
| POST | `/api/lobbies/:code/round-complete` | Advance to next round |
| POST | `/api/lobbies/:code/play-again` | Reset lobby for a new game |