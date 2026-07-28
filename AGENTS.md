# AGENTS.md

## Stack

- Runtime/package manager/bundler/test runner: Bun
- Frontend: React 19 SPA, TanStack Router, TanStack Query, TanStack Form, tRPC (`@trpc/tanstack-react-query`), daisyUI v5 + Tailwind v4
- Backend: Bun.serve fullstack server, tRPC v11 fetch adapter, better-auth (Prisma adapter, email/password only)
- DB: Prisma + SQLite
- Lint/format: Biome (no semicolons, trailing comma all, single quotes)
- E2E: Playwright
- Agent context: APM (`apm.yml`) — run `apm install`

## Scripts

See `package.json` scripts. Key:

- `bun run dev` — dev server with HMR (`bun --hot backend/server.ts`)
- `bun run build` — production bundle (`bun build frontend/index.html --outdir dist --production && bun run scripts/prod-css.ts`)
- `bun run start` — production server (`NODE_ENV=production bun backend/server.ts`)
- `bun test` — unit tests (`bun test backend`)
- `bun run test:e2e` — Playwright E2E
- `bun run lint` — Biome check
- `bun run format` — Biome format
- `bun run typecheck` — `tsc --noEmit`
- `bun run db:migrate` — `prisma migrate dev`
- `bun run db:reset` — `prisma migrate reset`

## Env vars

See `.env.example`. Required:

- `DATABASE_URL` — e.g. `file:./dev.db` (dev), `file:./test.db` (E2E test DB)
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` — e.g. `http://localhost:3000`
- `PORT` — e.g. `3000`

## Conventions

- Root dirs: `frontend/`, `backend/`, `shared/`, `prisma/`. No `src/`.
- TypeScript filenames: kebab-case (e.g. `note-list.tsx`, not `NoteList.tsx`). React component identifiers stay PascalCase; only file names are kebab-case.
- Path aliases: `@backend/*`, `@frontend/*`, `@shared/*` (see `tsconfig.json`).
- Nested `__tests__/` for unit tests.
- No vendor-specific filenames (e.g. `CLAUDE.md`). Use `AGENTS.md`.
- Client state: React `useState`/`useReducer` for local UI state. Server state stays in TanStack Query — don't duplicate. If shared client state is needed later, add a single Zustand store under `frontend/stores/` with a `createStore()` factory wrapping `devtools` middleware.
- Forms: TanStack Form (`useForm`) with Zod schemas passed directly to `validators` (Standard Schema native support — no `@tanstack/zod-form-adapter`). Render fields via `form.Field` render-prop and submit state via `form.Subscribe`.
- Shared validation schemas live in `shared/schemas/` and are reused by both frontend forms and backend tRPC inputs (single source of truth — e.g. `noteSchema` in `backend/trpc/notes.ts`).
- Devtools: unified TanStack devtools shell at `frontend/components/devtools.tsx`, mounted once in `main.tsx`. Dev-only: gated on `import.meta.env.DEV` + lazy `import()` so the prod bundle excludes devtools. Panels: Query, Router, Form.
- Biome `noChildrenProp` is disabled for `frontend/components/note-form.tsx` and `frontend/components/auth-form.tsx` (TanStack Form's `form.Field`/`form.Subscribe` use a children render-prop).
- Auth base path: `/api/auth` (configured in `backend/auth/auth.ts`).
- tRPC endpoint: `/api/trpc` (configured in `backend/server.ts`).
- SPA client routes: `/`, `/login`, `/notes`.
- `Context` type flows from `backend/trpc/context.ts` → `backend/trpc/root.ts` → `shared/trpc.ts` → `frontend/lib/trpc.ts`.
- Dockerfile exists; prod image runs `bunx prisma migrate deploy && bun run backend/server.ts` with `DATABASE_URL=file:/data/prod.db`.

## Skills/MCP

Run `apm install` to install the frontend-design skill, Playwright MCP, GitHub MCP, and Prisma MCP declared in `apm.yml`.
