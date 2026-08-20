# AGENTS.md

## TL;DR — first commands

- **Fresh clone:** `bun run bootstrap` → installs deps, APM skills/MCP, generates Prisma client, migrates dev DB, wires `.githooks/`.
- **Dev:** `bun run dev`.
- **Before claiming work done:** `bun run check`. For UI/auth/route changes also `bun run check:full` (adds Playwright E2E).
- **Merge:** `bun run premerge` runs `check`, then fast-forwards current branch → main and pushes.

## TL;DR — add a feature (vertical slice)

1. `shared/schemas/<name>.ts` — Zod schema (single source of truth).
2. `backend/trpc/<name>.ts` — router using the schema as `input`; mount in `backend/trpc/root.ts` `appRouter`.
3. `frontend/routes/<name>.tsx` — route; register in `frontend/router.tsx` `routeTree`. Add components under `frontend/components/`.
4. `__tests__/<source>.test.ts` co-located next to each source (backend + frontend).
5. `e2e/<name>.spec.ts` — Playwright spec.
6. `bun run check` (and `check:full` if UI). 

See `.agents/skills/project-structure/SKILL.md` for placement rules + the move verification gate.

## Stack

- Runtime/package manager/bundler/test runner: Bun
- Frontend: React 19 SPA, TanStack Router, TanStack Query, TanStack Form, tRPC (`@trpc/tanstack-react-query`), daisyUI v5 + Tailwind v4
- Backend: Bun.serve fullstack server, tRPC v11 fetch adapter, better-auth (Prisma adapter, email/password only)
- DB: Prisma + SQLite (Prisma ORM v7). Prisma client is the Rust-free `prisma-client` generator (`runtime = "bun"`) backed by the `prisma-adapter-bun-sqlite` driver (Bun native `bun:sqlite`, no Rust query engine). Generated into `prisma/generated/` (gitignored). **v7 moved the connection URL out of `schema.prisma` into `prisma.config.ts`** (the `datasource` block keeps only `provider`). `prisma.config.ts` mirrors `backend/db/client.ts`: both normalize relative `file:./` URLs to absolute paths anchored on the `prisma/` dir so the CLI and the runtime adapter read the same DB; absolute URLs (prod `file:/data/prod.db`) pass through. `prisma.config.ts` uses `import 'dotenv/config'` because Prisma CLI's config loader does not auto-load `.env`.
- Lint/format: Biome (no semicolons, trailing comma all, single quotes)
- E2E: Playwright
- Agent context: APM (`apm.yml`) — run `bun run bootstrap` (or `apm install`) to install skills + MCP
- Bun version pinned via `.bun-version` (`1.4.0`) and `package.json` `engines` (>=1.4.0 floor). CI uses `oven-sh/setup-bun@v2` with `bun-version: 1.4.0` for reproducible builds.

## Scripts

See `package.json` scripts. Key:

- `bun run dev` — dev server with HMR (`bun --hot backend/server.ts`)
- `bun run build` — production bundle (`scripts/build.ts` via `Bun.build` with `publicPath: "/"` so hashed JS/CSS links are root-relative and work on all SPA routes, a prod devtools-stub plugin, and Tailwind CSS compile via `scripts/prod-css.ts`)
- `bun run start` — production server (`NODE_ENV=production bun backend/server.ts`)
- `bun test` — unit tests (`bun test backend shared frontend`; co-located `__tests__/` next to each source, including frontend pure helpers)
- `bun run test:e2e` — Playwright E2E
- `bun run check:full` — `check` + `test:e2e`; run before claiming UI/auth/route work is done (E2E is intentionally excluded from `check` for speed)
- `bun run format` — Biome check + format (`biome check --write .`, lint + format in one, writes fixes)
- `bun run check` — pre-merge gate (Biome check + typecheck + knip + test); shared by `bun run premerge` and CI
- `bun run bootstrap` — one-command fresh-clone setup (deps + APM + Prisma generate + migrate + git hooks); idempotent
- `bun run premerge` — run `check`, then fast-forward merge current branch → main and push
- `bun run typecheck` — `tsc --noEmit`
- `bun run knip` — detect unused dependencies, files, and exports (enforced in CI)
- `bun run db:migrate` — `prisma migrate dev && prisma generate` (v7: `migrate dev` no longer auto-generates the client)
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
- Lint/format: Biome check (`bun run format` writes fixes; `bun run check` verifies without writing) and Knip (`bun run knip`) both run in CI. Knip fails on unused dependencies, files, or exports. Run `bun run check` (or `bun run premerge`) locally before pushing.
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

- **Image**: `Dockerfile` — build stage installs deps, runs `prisma generate`, bundles frontend to `dist/`, compiles CSS; runtime stage copies `node_modules`/`dist`/`backend`/`shared`/`prisma`/`prisma.config.ts`, sets `DATABASE_URL=file:/data/prod.db` + `PORT=3000`, and runs `./node_modules/.bin/prisma migrate deploy && bun run backend/server.ts` on boot (migrations are idempotent, safe to run every start). Prisma CLI runs under Bun in the `oven/bun` image.
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

Run `apm install` (or `bun run bootstrap`) to install the frontend-design, TanStack, and daisyUI skills plus the Playwright, GitHub, Prisma, and Context7 MCP servers declared in `apm.yml`.

**Source of truth:** `apm.yml` is the canonical list of skills + MCP servers. `.mcp.json` is a minimal hand-maintained fallback (Context7 only) for agents that read `.mcp.json` directly and do not understand APM; it is intentionally not kept in lockstep with `apm.yml` because some APM-managed servers need tokens/secrets not appropriate to ship in a starter. Do not hand-add token-gated servers to `.mcp.json`.

## Git hooks

`.githooks/pre-commit` runs Biome check + typecheck. `.githooks/pre-push` runs the full `scripts/check.sh` gate. `bun run bootstrap` sets `core.hooksPath = .githooks`. Bypass with `--no-verify` only when intentionally breaking the gate.

## React Compiler (experimental)

Both integrations are opt-in-friendly and toggleable. Goal is exploration + filing upstream bugs, not shipping stable behavior.

**Build compilation** — `scripts/build.ts` passes `reactCompiler: true` (Bun 1.4+ native, no Babel/plugin). Produces `_c(N)` memo cache calls + `react/compiler-runtime` imports in `dist/`. Off via `REACT_COMPILER=0`. Runs **only in the prod bundler** — `bun --hot` dev server uses the runtime transpiler and is unaffected (DevTools "Memo ✨" badge visible on a prod build, not in dev). Cannot fail the build: Bun falls back to original source on any compiler bailout/parse error. Known limit: sourcemaps map to the compiled intermediate, not original lines.

**Known Bun bug (file upstream)** — `bun run build` (package-script alias) does **not** propagate `reactCompiler` to the bundler; the prod bundle is emitted uncompiled (1 `react.memo_cache_sentinel` from React itself, no delta vs `REACT_COMPILER=0`). `bun scripts/build.ts` (direct file invocation) and `bun --bun run build` both compile correctly (2 sentinels, ~6 KB delta). Root cause is in `bun run <package-alias>` script execution, not the build script — the option is read and passed to `Bun.build`, but the bundler ignores it under the alias path. The `Dockerfile` uses `bun --bun run build` so production images compile correctly; local builds should use `bun scripts/build.ts` or `bun --bun run build`.

**Lint diagnostics** — `biome.json` enables `nursery.useReactCompiler: "warn"`. Biome 2.5.8 embeds the React Compiler Rust port — no `babel-plugin-react-compiler` dep. Rule runs only when nearest `package.json` declares React ≥19 (satisfied). `warn` severity surfaces violations in `bun run check` without failing the gate (Biome exits non-zero only on errors). `compilationMode` default `infer` (only components/hooks). Tracked upstream: biomejs/biome#10974. As of enabling: **0 violations** on the codebase (already compiler-clean).

**Type gap** — `@types/bun`/`bun-types` 1.3.14 do not yet declare `reactCompiler`/`reactCompilerOutputMode` on `BuildConfig`. `scripts/build.ts` is outside `tsconfig.json` `include`, so `bun run typecheck` does not see it; editor may flag the lines until types ship.

**Verify it ran** — `rm -rf dist && bun scripts/build.ts && F=$(ls dist/chunk-*.js) && grep -c memo_cache_sentinel "$F"` → expect `2` (compiler on). With `REACT_COMPILER=0` expect `1`. Note: under minify the `react/compiler-runtime` import string is renamed, so `memo_cache_sentinel` count is the robust signal (the delta vs the 1-sentinel React baseline). `bun run build` currently reports `1` in both modes due to the bug above.

**File bugs at** — https://github.com/oven-sh/bun/issues (compiler output correctness, fallback behavior) and https://github.com/biomejs/biome/issues/10974 (diagnostic parity/false positives).
