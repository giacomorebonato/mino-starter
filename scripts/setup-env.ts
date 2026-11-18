// Create .env from .env.example on fresh checkouts (clone or worktree) with a
// random BETTER_AUTH_SECRET, then apply existing migrations non-interactively:
// a missing .env marks a checkout that was never bootstrapped. When
// DATABASE_URL is already set in the environment (CI, Docker, prod), nothing
// is written — the explicit environment wins and those contexts run
// migrations their own way.
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { $ } from 'bun'

export interface SetupEnvOptions {
	/** Path to the committed example file. */
	example: string
	/** Path to the env file to create. */
	env: string
	/** Whether DATABASE_URL is already set in the environment (CI/Docker/prod). */
	databaseUrlSet?: boolean
	/** Called with the env path only when a fresh .env was just created. */
	migrate?: (env: string) => void | Promise<void>
}

export type SetupEnvResult = 'created' | 'exists' | 'database-url-set'

const SECRET_LINE = /^BETTER_AUTH_SECRET=.*$/m

export async function setupEnv(
	options: SetupEnvOptions,
): Promise<SetupEnvResult> {
	const {
		example,
		env,
		databaseUrlSet = Boolean(process.env.DATABASE_URL),
		migrate,
	} = options

	if (existsSync(env)) return 'exists'
	if (databaseUrlSet) return 'database-url-set'

	const secret = randomBytes(32).toString('base64')
	const content = readFileSync(example, 'utf8').replace(
		SECRET_LINE,
		`BETTER_AUTH_SECRET=${secret}`,
	)
	writeFileSync(env, content)
	await migrate?.(env)
	return 'created'
}

if (import.meta.main) {
	const root = fileURLToPath(new URL('../', import.meta.url))
	process.chdir(root)
	const result = await setupEnv({
		example: '.env.example',
		env: '.env',
		migrate: async () => {
			console.log('fresh .env — applying migrations (prisma migrate deploy)')
			await $`bun run db:deploy`
		},
	})
	if (result === 'created') console.log('✓ .env created with a random secret')
	else console.log(`.env setup skipped (${result})`)
}
