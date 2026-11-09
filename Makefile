.PHONY: install dev-backend dev-frontend

install:
	cd backend && pnpm install
	cd frontend && pnpm install

dev-backend:
	cd backend && pnpm run dev

dev-frontend:
	cd frontend && pnpm run dev