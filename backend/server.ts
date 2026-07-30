import { auth } from '@backend/auth/auth'
import {
	normalizeTrpcRequest,
	TRPC_ENDPOINT,
} from '@backend/normalize-trpc-request'
import { createPrerenderHandler } from '@backend/ssr/prerender'
import { createContext } from '@backend/trpc/context'
import { appRouter } from '@backend/trpc/root'
import { PUBLIC_SSR_PATHS } from '@shared/ssr-paths'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

const isDev = process.env.NODE_ENV !== 'production'
const port = Number(process.env.PORT ?? 3000)

let devIndex: unknown
if (isDev) {
	devIndex = (await import('../frontend/index.html')).default
}

const SPA_PATHS = ['/', '/login', '/notes']

async function serveDistFile(pathname: string): Promise<Response | null> {
	if (pathname.includes('..')) return null
	const file = Bun.file(`dist${pathname}`)
	if (await file.exists()) return new Response(file)
	return null
}

// Prod-only bot prerender (port of fastify-prerender-plugin, adapted to Bun.serve).
// Dev keeps the HTMLBundle routes + HMR; no prerendering.
let prerender: ReturnType<typeof createPrerenderHandler> | null = null
if (!isDev) {
	prerender = createPrerenderHandler({
		urls: PUBLIC_SSR_PATHS,
		port,
		cacheDir: process.env.SSR_CACHE_DIR || undefined,
	})
}

const server = Bun.serve({
	port,
	...(isDev
		? {
				routes: {
					'/': devIndex as unknown as import('bun').HTMLBundle,
					'/login': devIndex as unknown as import('bun').HTMLBundle,
					'/notes': devIndex as unknown as import('bun').HTMLBundle,
				},
				development: { hmr: true, console: true },
			}
		: {
				development: false,
			}),
	async fetch(req) {
		// Bot prerender runs first (like the plugin's onRequest hook). Lightpanda's
		// own inner requests self-identify via UA and fall through to the SPA shell.
		if (prerender) {
			const ssrRes = await prerender.handle(req)
			if (ssrRes) return ssrRes
		}

		const url = new URL(req.url)
		if (!isDev) {
			const staticFile = await serveDistFile(url.pathname)
			if (staticFile) return staticFile
		}
		if (url.pathname.startsWith(TRPC_ENDPOINT)) {
			const trpcReq = normalizeTrpcRequest(req, url)
			return fetchRequestHandler({
				endpoint: TRPC_ENDPOINT,
				req: trpcReq,
				router: appRouter,
				createContext,
			})
		}
		if (url.pathname.startsWith('/api/auth')) {
			return auth.handler(req)
		}
		if (!isDev && SPA_PATHS.includes(url.pathname)) {
			return new Response(Bun.file('dist/index.html'))
		}
		return new Response(JSON.stringify({ error: 'Not found' }), {
			status: 404,
			headers: { 'content-type': 'application/json' },
		})
	},
})

console.log(`mino-starter on http://localhost:${server.port}`)
