# منصة نوى العقارية — Nawa Real Estate Platform

A full-stack luxury real estate platform for nawainv.sa — cinematic client website (AR/EN), employee portal with AI & chat, and admin CMS dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (port 8080)
- `pnpm --filter @workspace/nawa run dev` — frontend (port assigned by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `KIMI_API_KEY` — Kimi AI key, `SESSION_SECRET` — JWT secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Tailwind + shadcn/ui + Framer Motion + Zustand

## Where things live

- `artifacts/nawa/` — React+Vite frontend (client site + admin CMS + employee portal)
- `artifacts/api-server/` — Express 5 API server
- `lib/db/` — Drizzle ORM schema + migrations
- `lib/api-client-react/` — Orval-generated React Query hooks
- `lib/api-spec/` — OpenAPI spec source of truth
- `scripts/src/seed.ts` — database seeding script

### Key files
- `lib/db/src/schema/index.ts` — source of truth for DB schema
- `lib/api-spec/` — OpenAPI spec → all generated hooks/schemas derive from this
- `artifacts/nawa/src/App.tsx` — routing, splash screen, QueryClientProvider
- `artifacts/nawa/src/hooks/use-language.ts` — Zustand AR/EN language store
- `artifacts/nawa/src/lib/constants.ts` — all UI translation strings
- `artifacts/api-server/src/routes/index.ts` — all routes wired up
- `artifacts/api-server/src/lib/auth.ts` — bcrypt + JWT helpers

## Architecture decisions

- **Contract-first API**: OpenAPI spec → Orval codegen → typed React Query hooks. Never write API hooks manually.
- **Language toggle**: Zustand store `useLanguage()` provides `language` (`ar`|`en`), `isRtl`, and `toggleLanguage`. `dir` attribute set on `<html>`.
- **Auth**: JWT stored in `localStorage` as `nawa_token`. Token injected into API calls via `setAuthTokenGetter`. Role-based routing: `super_admin`/`admin` → `/admin/*`, others → `/employee/*`.
- **Stats endpoints** are public (no auth) so homepage can display counts without login.
- **Splash screen**: Shows once per session (sessionStorage flag `nawa_splash_shown`). Animates for 2.5s then fades out.

## Product

Three portals in one app:
1. **Client website** — cinematic Arabic/English luxury real estate site with projects, services, board of directors, brokers, careers, media center, contact form.
2. **Employee portal** (`/employee`) — internal dashboard, group chat, inbox, AI assistant (Kimi).
3. **Admin CMS** (`/admin`) — full CRUD for projects, services, news, jobs, brokers, board, employees, pages, messages; AI assistant and internal chat.

## User preferences

- Colors: Navy `#0D1B3E` (primary), Gold `#C9A96E` (secondary/accent), white background.
- Fonts: Playfair Display (headings), Inter (body EN), Tajawal (body AR) — via Google Fonts in `index.css`.
- Footer credit: "Built by Qirox Studio" linking to https://qiroxstudio.online
- RTL for Arabic, LTR for English — toggled via globe icon in navbar.
- Logo: `attached_assets/Screenshot_2026-05-12_at_1.51.13_PM_1778583134608.png` imported via `@assets` alias.

## Seed data / credentials

- Admin login: `admin@nawainv.sa` / `admin123` (role: `super_admin`)
- 4 seeded projects, 6 services, 3 news articles, 3 jobs, 3 brokers, 4 board members

## Gotchas

- **Do not run `pnpm dev` at workspace root** — use `restart_workflow` instead.
- `useListJobs`, `useListMessages`, `useListNews`, `useListProjects` accept NO options wrapper when no params needed (Orval-generated signatures vary).
- Pages admin uses `slug` (not `id`) for `updatePage`/`deletePage` mutations.
- `pnpm --filter @workspace/db run push` requires `DATABASE_URL` in env — it's available in the workflow environment automatically.
- Stats routes are intentionally public (no `requireAuth`) so the homepage can show live counts.
- bcryptjs (not bcrypt) is used — native bcrypt fails in this NixOS environment.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- API proxy: all `/api/*` requests route to the Express server on port 8080 via the shared reverse proxy
