#!/usr/bin/env bash
# git fires post-checkout on checkout, switch, clone, and worktree add.
# A brand-new worktree or clone passes the null ref as $1 (40 zeros);
# regular checkouts never do, so bootstrap runs only for fresh checkouts.
#
# In a fresh worktree there is usually no node_modules yet, so the lefthook
# shim itself may silently skip this hook entirely (it exits 0 when it
# cannot find the lefthook binary). The other layers cover that case: the
# postinstall net and the T3 worktree setup script both run
# scripts/setup-env.ts, which creates .env and applies migrations.
set -euo pipefail

[ "${1:-}" = "0000000000000000000000000000000000000000" ] || exit 0
[ -f package.json ] || exit 0

exec bun run bootstrap
