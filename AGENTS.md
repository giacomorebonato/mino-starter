# AGENTS.md

## Stack

- Runtime/package manager/bundler/test runner: Bun
- Frontend: React 19 SPA, TanStack Router, TanStack Query, TanStack Form, tRPC (`@trpc/tanstack-react-query`), daisyUI v5 + Tailwind v4
- Backend: Bun.serve fullstack server, tRPC v11 fetch adapter, better-auth (Prisma adapter, email/password only)
- DB: Prisma + SQLite. Prisma client is the Rust-free `prisma-client` generator (`runtime = "bun"`) backed by the `prisma-adapter-bun-sqlite` driver (Bun native `bun:sqlite`, no Rust query engine). Generated into `prisma/generated/` (gitignored). `backend/db/client.ts` normalizes relative `file:./` URLs to the `prisma/` dir so the adapter reads the same DB Prisma CLI migrates; absolute URLs (prod) pass through.
- Lint/format: Biome (no semicolons, trailing comma all, single quotes)
- E2E: Playwright
- Agent context: APM (`apm.yml`) — run `apm install`

## Scripts

See `package.json` scripts. Key:

- `bun run dev` — dev server with HMR (`bun --hot backend/server.ts`)
- `bun run build` — production bundle (`scripts/build.ts` via `Bun.build` with `publicPath: "/"` so hashed JS/CSS links are root-relative and work on all SPA routes, a prod devtools-stub plugin, and Tailwind CSS compile via `scripts/prod-css.ts`)
- `bun run start` — production server (`NODE_ENV=production bun backend/server.ts`)
- `bun test` — unit tests (`bun test backend`)
- `bun run test:e2e` — Playwright E2E
- `bun run lint` — Biome check
- `bun run format` — Biome format
- `bun run typecheck` — `tsc --noEmit`
- `bun run knip` — detect unused dependencies, files, and exports (enforced in CI)
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
- Lint/format: Biome check (`bun run lint`) and Knip (`bun run knip`) both run in CI. Knip fails on unused dependencies, files, or exports. Run `bun run knip` locally before pushing.
- Client state: React `useState`/`useReducer` for local UI state. Server state stays in TanStack Query — don't duplicate. If shared client state is needed later, add a single Zustand store under `frontend/stores/` with a `createStore()` factory wrapping `devtools` middleware.
- Forms: TanStack Form (`useForm`) with Zod schemas passed directly to `validators` (Standard Schema native support — no `@tanstack/zod-form-adapter`). Render fields via `form.Field` render-prop and submit state via `form.Subscribe`.
- Shared validation schemas live in `shared/schemas/` and are reused by both frontend forms and backend tRPC inputs (single source of truth — e.g. `noteSchema` in `backend/trpc/notes.ts`).
- Devtools: unified TanStack devtools shell at `frontend/components/devtools.tsx`, mounted once in `main.tsx`. Dev-only: gated on `process.env.NODE_ENV` (Bun folds it; `import.meta.env` is not shimmed in the browser bundle and will throw) + lazy `import()`. Bun's bundler does not tree-shake dead dynamic imports, so `scripts/build.ts` registers a `Bun.build` plugin that redirects the four `@tanstack/*-devtools` packages to a no-op stub (`frontend/components/devtools-stub.ts`) in the prod bundle — keeps the libs (~270KB) out of the prod JS. Panels: Query, Router, Form.
- Biome `noChildrenProp` is disabled for `frontend/components/note-form.tsx` and `frontend/components/auth-form.tsx` (TanStack Form's `form.Field`/`form.Subscribe` use a children render-prop).
- Auth base path: `/api/auth` (configured in `backend/auth/auth.ts`).
- tRPC endpoint: `/api/trpc` (configured in `backend/server.ts`).
- SPA client routes: `/`, `/login`, `/notes`.
- `Context` type flows from `backend/trpc/context.ts` → `backend/trpc/root.ts` → `shared/trpc.ts` → `frontend/lib/trpc.ts`.
- Dockerfile exists; prod image runs `./node_modules/.bin/prisma migrate deploy && bun run backend/server.ts` with `DATABASE_URL=file:/data/prod.db`.

## Bot SSR (SEO)

Port of `fastify-prerender-plugin` inlined into `backend/ssr/` (no external plugin dep), adapted to `Bun.serve`.

- **Prod-only**: prerender is constructed only when `NODE_ENV === 'production'` (`backend/server.ts`); dev keeps the HTMLBundle routes + HMR and serves the raw shell to everyone.
- **Flow** (`backend/ssr/prerender.ts` → `createPrerenderHandler`): `GET` + bot UA (`isbot`, plus `facebookexternalhit`/`whatsapp`/`twitterbot`) + path in `PUBLIC_SSR_PATHS` (`shared/ssr-paths.ts`, `(string | RegExp)[]`, strings match pathname, regex tests path+query) → render, else fall through. Runs first in the fetch handler (like the plugin's `onRequest` hook).
- **Render**: `backend/ssr/request-from-browser.ts` spawns a `worker_thread` that calls `@lightpanda/browser`'s `lightpanda.fetch(url, { dump: true })` (JS API, not the CLI). The binary is provided by `@lightpanda/browser`'s postinstall (`~/.cache/lightpanda-node/lightpanda`, overridable via `LIGHTPANDA_EXECUTABLE_PATH`). Verified to work under Bun's runtime.
- **Recursion break**: Lightpanda's own requests send `User-Agent: Lightpanda/...`; the handler returns `null` for that UA so the inner request falls through to the raw SPA shell (no re-render loop). No query-param/header hack.
- **Cache**: per-file on disk, filename = sanitized pathname (+ md5 of query if present) + `.html`, in `SSR_CACHE_DIR` (or a `mkdtemp` dir). 5-minute mtime TTL (matches the plugin). Stale entries are deleted lazily. Write failure is non-fatal.
- **No bespoke orchestration** (no single-flight / serial queue / fallback) — faithful to the plugin: per-request render. Fits the 512MB Fly VM because bots crawl the single allowlisted path slowly.
- **Bun note**: `req.url` in `Bun.serve` is the absolute URL (unlike Node/Fastify where `request.url` is path+query), so the handler parses `pathname`+`search` from `req.url` and rebuilds the render URL from `host`/`port` (default `localhost:<PORT>`).
- Dockerfile copies the lightpanda binary (`/root/.cache/lightpanda-node`) from the build stage where postinstall downloaded it.
- E2E: `bun run test:e2e:ssr` (separate `playwright.ssr.config.ts` running the prod server, clears its cache in `e2e/global-setup.ts`) is the verification contract. The default `playwright.config.ts` ignores `ssr.spec.ts`.

## Deployment (Fly.io)

Target: app `mino-starter` on Fly.io. Infra files live in repo: `Dockerfile` (multi-stage Bun build) + `fly.toml` (app, volume mount, http_service).

- **Image**: `Dockerfile` — build stage installs deps, runs `prisma generate`, bundles frontend to `dist/`, compiles CSS; runtime stage copies `node_modules`/`dist`/`backend`/`shared`/`prisma`, sets `DATABASE_URL=file:/data/prod.db` + `PORT=3000`, and runs `./node_modules/.bin/prisma migrate deploy && bun run backend/server.ts` on boot (migrations are idempotent, safe to run every start). Prisma CLI runs under Bun in the `oven/bun` image.
- **SQLite persistence**: Fly volume `mino_starter_data` mounted at `/data` (see `fly.toml` `[mount]`). `prod.db` lives there and survives deploys and scale-to-zero. Lost only if the volume is deleted. SQLite volume is local to one machine — do **not** scale `>1` machine (no shared FS).
- **VM**: `shared-cpu-1x` with 512MB RAM (see `fly.toml` `[[vm]]`). Fits because Prisma's Rust query engine is gone — the `prisma-adapter-bun-sqlite` driver uses Bun's native `bun:sqlite`.
- **Auto-stop**: `auto_stop_machines = true`, `min_machines_running = 0` → app sleeps when idle, wakes on request. Volume persists across stop/start.
- **Secrets** (set via `flyctl secrets set`): `BETTER_AUTH_SECRET` (random, `openssl rand -base64 32`), `BETTER_AUTH_URL=https://mino-starter.fly.dev`, `NODE_ENV=production`. `DATABASE_URL` is baked into the Dockerfile env, not a secret.
- **First deploy** (new app):
  ```sh
  flyctl auth login
  flyctl apps create mino-starter
  flyctl volumes create mino_starter_data --size 1   # pick region or omit for nearest
  flyctl secrets set BETTER_AUTH_SECRET=$(openssl rand -base64 32) \
    BETTER_AUTH_URL=https://mino-starter.fly.dev NODE_ENV=production
  flyctl deploy
  ```
- **Redeploy** (update code, keep data): `flyctl deploy`.
- **Replace an existing app** (fresh state, wipes data): `flyctl apps destroy mino-starter` then run the first-deploy steps. The volume must be recreated.
- **Open**: `flyctl apps open` → `https://mino-starter.fly.dev`.
- **Caveats**: single-machine only (SQLite volume). `better-auth` sessions rely on `BETTER_AUTH_SECRET` — rotating it logs out all users. Devtools are dev-only and excluded from the prod bundle via the `scripts/build.ts` stub plugin (the `@tanstack/*-devtools` packages are swapped for a no-op at build time).

## Skills/MCP

Run `apm install` to install the frontend-design skill, Playwright MCP, GitHub MCP, and Prisma MCP declared in `apm.yml`.
