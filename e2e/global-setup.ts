import { execSync } from 'node:child_process'

export default async () => {
	execSync(
		'DATABASE_URL=file:./test.db bunx prisma migrate reset --force --skip-generate',
		{ stdio: 'inherit' },
	)
}
