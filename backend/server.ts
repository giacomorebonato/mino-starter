import { auth } from '@backend/auth/auth'
import { createContext } from '@backend/trpc/context'
import { appRouter } from '@backend/trpc/root'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

const isDev = process.env.NODE_ENV !== 'production'
const port = Number(process.env.PORT ?? 3000)

let devIndex: unknown
if (isDev) {
	devIndex = (await import('../frontend/index.html')).default
}

const TRPC_ENDPOINT = '/api/trpc'

function normalizeTrpcRequest(req: Request, url: URL): Request {
	const afterEndpoint = url.pathname.slice(TRPC_ENDPOINT.length)
	if (!afterEndpoint.includes('/')) {
		return req
	}
	const normalizedPath = afterEndpoint
		.replace(/\//g, '.')
		.replace(/^\.+|\.+$/g, '')
	const newUrl = new URL(
		`${TRPC_ENDPOINT}${normalizedPath ? `/${normalizedPath}` : ''}${url.search}`,
		url.origin,
	)
	return new Request(newUrl, req)
}

const SPA_PATHS = ['/', '/login', '/notes']

async function serveDistFile(pathname: string): Promise<Response | null> {
	if (pathname.includes('..')) return null
	const file = Bun.file(`dist${pathname}`)
	if (await file.exists()) return new Response(file)
	return null
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
