# Contributing to BugWars

Thank you for considering a contribution to BugWars! Please read these
guidelines before submitting pull requests or opening issues.

## Getting Started

1. Fork the repository and clone it locally.
2. Create a new branch for your change.
3. Install dependencies for both backend and frontend:

   ```sh
   make install
   ```

4. Run the development servers:

   ```sh
   make dev-backend   # terminal 1
   make dev-frontend  # terminal 2
   ```

## Backend Development

The backend is a Node.js/Express API. Lint and test with:

```sh
cd backend
pnpm run lint
pnpm run test
```

## Frontend Development

The frontend is a React + Vite application. Lint and build with:

```sh
cd frontend
pnpm run lint
pnpm run build
```

## Submitting Changes

1. Ensure all tests pass and linting is clean.
2. Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/)
   (e.g., `feat:`, `fix:`, `docs:`, `chore:`).
3. Push to your fork and open a pull request against `main`.

## Code Style

- Follow the existing ESLint configuration.
- Keep commits small and logically separated.
- Write tests for new backend functions.
- Document new API endpoints in `backend/README.md`.

## Reporting Issues

Use the GitHub issue tracker to report bugs or request features.
Include steps to reproduce, expected behavior, and actual behavior.