# Scripts, Env Vars, Git Hooks, Tooling

## Scripts

`package.json` is the source of truth. The non-obvious ones:

- `bun run dev` — dev server with HMR (`bun --hot backend/server.ts`)
- `bun run build` — production bundle via `scripts/build.ts` (`Bun.build` with `check: true`), React Compiler enabled — see [react-compiler.md](react-compiler.md) and [conventions.md](conventions.md#build-internals)
- `bun run start` — production server (`NODE_ENV=production bun backend/server.ts`)
- `bun run test` — unit tests (`bun test backend shared frontend`; co-located `__tests__/` next to each source)
- `bun check` — Bun’s built-in type checker
- `bun run test:e2e` — Playwright E2E
- `bun run test:e2e:ssr` — SSR E2E against the prod server (separate `playwright.ssr.config.ts`; clears its cache in `e2e/global-setup.ts`). The default `playwright.config.ts` ignores `ssr.spec.ts`
- `bun lint` — Bun built-in linter (verify-only); `bun run format:check` checks formatting
- `bun run test:check` — pre-merge gate: lint + formatting + typecheck + knip + unit tests. Shared with CI and git hooks. Run **before claiming any work done**
- `bun run check:full` — `test:check` + Playwright E2E. Run before claiming UI/auth/route work done (E2E is intentionally excluded from `test:check` for speed)
- `bun lint --fix && bun fmt` — apply lint fixes and formatting
- `bun run bootstrap` — fresh-clone setup (deps + APM skills/MCP + Prisma client + migrate dev DB + git hooks); idempotent
- `bun run premerge` — `test:check`, then fast-forward current branch → main and push
- `bun run db:migrate` — `prisma migrate dev && prisma generate` (v7: `migrate dev` no longer auto-generates the client) — see [prisma.md](prisma.md)
- `bun run db:reset` — `prisma migrate reset`

`postinstall` runs `bun run db:generate`. `bun run db:generate` and `bun run db:deploy` also run Prisma under Bun.

`bunfig.toml` disables automatic peer installation to prevent the Tailwind plugin from installing another Bun runtime. Declare required peer dependencies explicitly. If an existing install still has an older `node_modules/.bin/bun`, run `bun prune --omit peer` to remove stale peer packages; `bun install` alone can leave them in place. TypeScript stays installed for tRPC’s peer requirement and editor support; `@types/bun` supplies Node types.

## Env vars

`.env.example` is the source of truth. Highlights:

- `DATABASE_URL` — `file:./dev.db` (dev), `file:./test.db` (E2E test DB), `file:/data/prod.db` (prod)
- `BETTER_AUTH_SECRET` — random, e.g. `openssl rand -base64 32`
- `BETTER_AUTH_URL` — e.g. `http://localhost:3000` (dev) / `https://mino-starter.fly.dev` (prod)
- SSR prerender (optional, prod-only): `SSR_CACHE_DIR`, `LIGHTPANDA_EXECUTABLE_PATH` — see [bot-ssr.md](bot-ssr.md)

## Git hooks

`.githooks/pre-commit` runs lint + format check + typecheck. `.githooks/pre-push` runs `bun run test:check`. `bun run bootstrap` sets `core.hooksPath = .githooks`. Bypass with `--no-verify` only when intentionally breaking the gate.

## Knip

Knip runs in CI and inside `bun run test:check`; it **fails** on unused dependencies, files, or exports. Run it after any file add/move.

## Skills / MCP

`apm.yml` is the canonical list of skills + MCP servers (frontend-design, TanStack, daisyUI skills; Playwright, GitHub, Prisma, Context7 MCP). `bun run bootstrap` (or `apm install`) installs them.

`.mcp.json` is a minimal hand-maintained fallback (Context7 only) for agents that read `.mcp.json` directly and do not understand APM; it is intentionally **not** kept in lockstep with `apm.yml` because some APM-managed servers need tokens/secrets not appropriate to ship in a starter. Do not hand-add token-gated servers to `.mcp.json`.
