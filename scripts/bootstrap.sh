#!/usr/bin/env bash
# One-command setup for a fresh clone or worktree of mino-starter.
# Idempotent — safe to re-run.
#
# Installs Bun deps, creates .env (random secret) and applies migrations,
# installs APM skills + MCP, and wires the lefthook git hooks.
set -euo pipefail

cd "$(dirname "$0")/.."

step() { printf '\n\033[1m→ %s\033[0m\n' "$*"; }

step 'bun install'
bun install

step '.env + migrations (skips when .env exists or DATABASE_URL is set)'
bun run setup-env

step 'apm install (skills from apm.yml; MCP deps stay declaration-only)'
if command -v apm >/dev/null 2>&1; then
	apm install --only apm
else
	printf '\033[33mapm not found — skipping skills.\033[0m\n' \
		'Install: https://microsoft.github.io/apm/ then run `apm install --only apm`.\n' >&2
fi

step 'prisma generate (postinstall also does this; run again to be safe)'
bun run db:generate

step 'db migrate (dev)'
bun run db:migrate

step 'git hooks (lefthook, installed into .git/hooks)'
bash scripts/install-hooks.sh

printf '\n\033[32m✓ bootstrap complete. Run `bun run dev`.\033[0m\n'
