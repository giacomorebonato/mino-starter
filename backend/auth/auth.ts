import { prisma } from '@backend/db/client'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'

/**
 * Extra origins better-auth should trust in addition to `baseURL`.
 *
 * Under `portless run` the app is browsed at a `*.localhost` URL
 * (PORTLESS_URL), and the dev tailnet mirror publishes it at a
 * `https://<machine>.ts.net:<port>` URL (DEV_TAILSCALE_URL). Both differ from
 * BETTER_AUTH_URL, so cross-origin POSTs (sign-in, tRPC mutations) would
 * otherwise be rejected with INVALID_ORIGIN. Evaluated per request so the
 * env can be set after this module loads (the tailnet URL is only known
 * once the dev server has picked a serve port).
 */
const devTrustedOrigins = async (): Promise<string[]> =>
	[process.env.PORTLESS_URL, process.env.DEV_TAILSCALE_URL]
		.filter((v): v is string => Boolean(v))
		// Only absolute origins; matchesOriginPattern expects origin strings.
		.filter((v) => /^https?:\/\//.test(v))

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
	basePath: '/api/auth',
	secret: process.env.BETTER_AUTH_SECRET,
	database: prismaAdapter(prisma, { provider: 'sqlite' }),
	emailAndPassword: { enabled: true },
	trustedOrigins: async () => {
		const extra = await devTrustedOrigins()
		// Keep the static env override working too (comma-separated).
		const fromEnv = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
		return [...extra, ...fromEnv]
	},
})
