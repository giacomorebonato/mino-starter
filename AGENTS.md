<!-- intent-skills:start -->
## Skill Loading

Use the repository’s installed Intent. If it is unavailable, report the missing dependency instead of downloading a replacement.
Before editing files for a substantial task:
- Run `bunx --no-install --package @tanstack/intent intent list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `bunx --no-install --package @tanstack/intent intent load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

# AGENTS.md

Bun fullstack starter: React 19 SPA (TanStack Router/Query/Form, tRPC, daisyUI v5 + Tailwind v4) on a `Bun.serve` fullstack server with tRPC v11 + better-auth over Prisma/SQLite.

**latest version of Bun everywhere** — runtime, package manager, bundler, test runner, linter. Never npm/pnpm/yarn.

- `bun run bootstrap` — fresh-clone setup (idempotent)
- `bun run dev` — dev server with HMR
- `bun run build` — production bundle (React Compiler on)
- `bun lint` — linting
- `bun fmt` — formatting
- `bun check` — type checking
- `bun run test:check` — run before claiming work done; `bun run check:full` adds E2E for UI/auth/route changes
- `bun run premerge` — `check`, then fast-forward → main and push

Aliases `@backend/* @frontend/* @shared/*`; unit tests co-located in `__tests__/`; placement rules in `.agents/skills/project-structure/SKILL.md`. React client state: prefer Zustand per `.agents/skills/react-state-zustand/SKILL.md`.

Deep docs: [vertical-slice workflow](docs/agents/vertical-slices.md) · [scripts/env/hooks](docs/agents/commands.md) · [conventions](docs/agents/conventions.md) · [Prisma v7](docs/agents/prisma.md) · [bot SSR](docs/agents/bot-ssr.md) · [React Compiler](docs/agents/react-compiler.md) · [deployment](docs/agents/deployment.md)
