# Prisma v7 + SQLite

- Prisma ORM v7, Rust-free `prisma-client` generator (`runtime = "bun"`) backed by the `prisma-adapter-bun-sqlite` driver (Bun native `bun:sqlite`, no Rust query engine). Client is generated into `prisma/generated/` (gitignored).
- **v7 moved the connection URL out of `schema.prisma` into `prisma.config.ts`** — the `datasource` block keeps only `provider`.
- `prisma.config.ts` mirrors `backend/db/client.ts`: both normalize relative `file:./` URLs to absolute paths anchored on the `prisma/` dir so the CLI and the runtime adapter read the same DB; absolute URLs (prod `file:/data/prod.db`) pass through.
- The database scripts use `bun --env-file=.env run --bun prisma` to run Prisma under Bun and explicitly load `.env` (optional when deployment supplies environment variables). The explicit file is needed because Bun disables automatic env loading for Node-shebang CLIs forced to use Bun. Use `bun run db:generate`, `bun run db:migrate`, and `bun run db:deploy` so the CLI inherits those variables without `dotenv`.
- `bun run db:migrate` runs `prisma migrate dev && prisma generate` — v7's `migrate dev` no longer auto-generates the client (`postinstall` also runs `prisma generate`).
- Databases: `prisma/dev.db` (dev), `prisma/test.db` (E2E), `/data/prod.db` (prod — see [deployment.md](deployment.md)).