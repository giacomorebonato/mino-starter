# mino-starter

Reusable full-stack starter: Bun + React + tRPC + better-auth + Prisma + daisyUI.

## Deploy

Set the auth secret before first deploy:

```sh
fly secrets set BETTER_AUTH_SECRET=$(openssl rand -base64 32)
```

## Scripts

- `bun run dev` — dev server with HMR
- `bun run build` — production bundle
- `bun run start` — production server
- `bun test` — unit tests
- `bun run test:e2e` — Playwright E2E
- `bun run format` — Biome check + format (lint + format, writes fixes)
- `bun run check` — pre-merge gate (Biome check + typecheck + knip + test), shared by `premerge` and CI
- `bun run premerge` — run `check`, then fast-forward merge current branch → main and push
- `bun run typecheck` — tsc --noEmit
- `bun run db:migrate` — prisma migrate dev
- `bun run db:reset` — prisma migrate reset

Run `apm install` to install the skills/MCP declared in `apm.yml`.

See `AGENTS.md` for agent context.
