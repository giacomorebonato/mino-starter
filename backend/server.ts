import { auth } from '@backend/auth/auth'
import { createContext } from '@backend/trpc/context'
import { appRouter } from '@backend/trpc/root'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import index from '../frontend/index.html'

const isDev = process.env.NODE_ENV !== 'production'
const port = Number(process.env.PORT ?? 3000)

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

const server = Bun.serve({
	port,
	routes: {
		'/': index,
		'/login': index,
		'/notes': index,
	},
	development: isDev ? { hmr: true, console: true } : false,
	async fetch(req) {
		const url = new URL(req.url)
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
		return new Response(JSON.stringify({ error: 'Not found' }), {
			status: 404,
			headers: { 'content-type': 'application/json' },
		})
	},
})

console.log(`mino-starter on http://localhost:${server.port}`)
