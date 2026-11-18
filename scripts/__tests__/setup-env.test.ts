import { afterAll, expect, test } from 'bun:test'
import {
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { setupEnv } from '../setup-env'

const EXAMPLE = [
	'DATABASE_URL=file:./dev.db',
	'BETTER_AUTH_SECRET=replace-with-openssl-rand-base64-32',
	'BETTER_AUTH_URL=http://localhost:3000',
	'',
].join('\n')

const dirs: string[] = []

afterAll(() => {
	for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

function tmp(): { example: string; env: string } {
	const dir = mkdtempSync(join(tmpdir(), 'setup-env-'))
	dirs.push(dir)
	return { example: join(dir, '.env.example'), env: join(dir, '.env') }
}

function extractSecret(content: string): string {
	return (
		content
			.split('\n')
			.find((line) => line.startsWith('BETTER_AUTH_SECRET='))
			?.slice('BETTER_AUTH_SECRET='.length) ?? ''
	)
}

test('creates .env from example with a random BETTER_AUTH_SECRET when missing', async () => {
	const { example, env } = tmp()
	writeFileSync(example, EXAMPLE)

	const result = await setupEnv({ example, env, databaseUrlSet: false })

	expect(result).toBe('created')
	expect(existsSync(env)).toBe(true)
	const created = readFileSync(env, 'utf8')
	expect(created).toContain('DATABASE_URL=file:./dev.db')
	expect(created).toContain('BETTER_AUTH_URL=http://localhost:3000')
	expect(created).not.toContain('replace-with-openssl-rand-base64-32')
	const secret = extractSecret(created)
	expect(secret).not.toBe('')
	expect(secret.length).toBeGreaterThan(20)
})

test('is a no-op when .env already exists', async () => {
	const { example, env } = tmp()
	writeFileSync(example, EXAMPLE)
	writeFileSync(env, 'DATABASE_URL=file:./custom.db\n')

	const migrate = () => {
		throw new Error('migrate must not run when .env exists')
	}

	const result = await setupEnv({
		example,
		env,
		databaseUrlSet: false,
		migrate,
	})

	expect(result).toBe('exists')
	expect(readFileSync(env, 'utf8')).toBe('DATABASE_URL=file:./custom.db\n')
})

test('writes no file and runs no migration when DATABASE_URL is already set', async () => {
	const { example, env } = tmp()
	writeFileSync(example, EXAMPLE)

	const migrate = () => {
		throw new Error('migrate must not run when DATABASE_URL is set')
	}

	const result = await setupEnv({ example, env, databaseUrlSet: true, migrate })

	expect(result).toBe('database-url-set')
	expect(existsSync(env)).toBe(false)
})

test('runs the migration exactly once per fresh create and never on re-run', async () => {
	const { example, env } = tmp()
	writeFileSync(example, EXAMPLE)
	const migrations: string[] = []
	const migrate = (envPath: string) => {
		migrations.push(envPath)
	}

	await setupEnv({ example, env, databaseUrlSet: false, migrate })
	const result = await setupEnv({
		example,
		env,
		databaseUrlSet: false,
		migrate,
	})

	expect(result).toBe('exists')
	expect(migrations).toEqual([env])
})

test('generates a different secret on each fresh create', async () => {
	const a = tmp()
	writeFileSync(a.example, EXAMPLE)
	const b = tmp()
	writeFileSync(b.example, EXAMPLE)

	await setupEnv({ example: a.example, env: a.env, databaseUrlSet: false })
	await setupEnv({ example: b.example, env: b.env, databaseUrlSet: false })

	const secret = (path: string) => extractSecret(readFileSync(path, 'utf8'))
	expect(secret(a.env)).not.toBe('')
	expect(secret(a.env)).not.toBe(secret(b.env))
})
