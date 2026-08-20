import { execSync } from 'node:child_process'
import { rmSync } from 'node:fs'

export default async function globalSetup(): Promise<void> {
	rmSync('/tmp/mino-ssr-cache-e2e', { recursive: true, force: true })
	execSync('DATABASE_URL=file:./test.db bunx prisma migrate reset --force', {
		stdio: 'inherit',
	})
}
