#!/usr/bin/env bash
# Install lefthook git hooks from the repo-local node_modules, migrating
# off any previously configured hooks path (the old .githooks setup used
# core.hooksPath). Skips silently outside a git repository (e.g. the Docker
# build stage, which dockerignores .git).
set -euo pipefail

if ! git rev-parse --git-dir >/dev/null 2>&1; then
	echo 'not a git repo — skipping lefthook install'
	exit 0
fi

exec "$(dirname "$0")/../node_modules/.bin/lefthook" install --reset-hooks-path
