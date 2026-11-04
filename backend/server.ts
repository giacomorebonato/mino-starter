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

// Dispatch /api/* requests (tRPC + better-auth). Used both from the dev
// `routes` map (so the `/*` HTMLBundle wildcard doesn't shadow API POSTs with
// 405) and from the prod `fetch` handler.
async function handleApi(req: Request): Promise<Response> {
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
}

type DevRoutes = import('bun').Serve.Routes<
	undefined,
	'/*' | '/api/auth/*' | '/api/trpc/*'
>

const devRoutes = {
	// Dev: register /api/* as explicit function routes so they take
	// precedence over the `/*` HTMLBundle wildcard. Bun matches `routes`
	// before `fetch`, and a wildcard HTMLBundle route only accepts
	// GET/HEAD (POST -> 405), which previously broke auth signup and
	// tRPC mutations. The `/*` route serves the SPA shell + HMR for any
	// other path so new client routes need no server change.
	'/api/auth/*': handleApi,
	'/api/trpc/*': handleApi,
	'/*': devIndex as import('bun').HTMLBundle,
} satisfies DevRoutes

/**
 * Tailnet mirror (dev only).
 *
 * `portless run` exposes the app on a `*.localhost` URL that only works on
 * this machine — the proxy binds loopback and `*.localhost` resolves to
 * 127.0.0.1 on whatever machine does the lookup, so other tailnet devices
 * can't use it. This mirrors the same server on the machine's Tailscale
 * name via `tailscale serve`, which gives a real HTTPS URL
 * (`https://<machine>.ts.net:<port>`) reachable from the whole tailnet.
 *
 * Two Bun limitations shape the design:
 * - The dev HTMLBundle host check 403s any `Host` that isn't localhost,
 *   `*.localhost`, an IP literal, or the configured `hostname`
 *   (Bun 1.4.4 accepts but ignores `development.allowedHosts` — PR #40733
 *   is not merged). Binding the mirror to `hostname: <machine>.ts.net`
 *   makes Bun accept the tailnet `Host`.
 * - The HMR WebSocket origin check only allows localhost origins, so the
 *   mirror runs with `hmr: false` (remote browsing works; hot reload stays
 *   local).
 */
/** Tailnet DNS name of this machine, or null when Tailscale is absent/down. */
async function tailnetDnsName(): Promise<string | null> {
	const status = Bun.spawnSync(['tailscale', 'status', '--json'], {
		stdout: 'pipe',
		stderr: 'ignore',
	})
	if (status.exitCode !== 0) return null
	try {
		const self = JSON.parse(status.stdout.toString()).Self
		const dnsName: string | undefined = self?.DNSName?.replace(/\.$/, '')
		return dnsName ?? null
	} catch {
		return null
	}
}

/** The tailnet IP for the given name, or null when it doesn't resolve. */
async function tailnetAddress(dnsName: string): Promise<string | null> {
	const { lookup } = await import('node:dns/promises')
	return lookup(dnsName)
		.then((r) => r.address)
		.catch(() => null)
}

/** First preferred serve port (portless's order) not already in use. */
function pickServePort(): number {
	const preferred = [443, 8443, 8444, 8445, 8446, 8447, 8448, 8449, 8450]
	const used = new Set<number>()
	const status = Bun.spawnSync(['tailscale', 'serve', 'status', '--json'], {
		stdout: 'pipe',
		stderr: 'ignore',
	})
	if (status.exitCode === 0) {
		try {
			const cfg = JSON.parse(status.stdout.toString())
			for (const p of Object.keys(cfg?.TCP ?? {})) used.add(Number(p))
		} catch {
			// treat as "no ports known"; registration will catch conflicts
		}
	}
	return preferred.find((p) => !used.has(p)) ?? 8451
}

/** Bind a second Bun.serve on the tailnet IP, same port as primary. */
function bindTailnetMirror(
	primary: import('bun').Server<undefined>,
	dnsName: string,
): import('bun').Server<undefined> | null {
	try {
		// Same port as primary, different interface: primary is loopback
		// (portless targets 127.0.0.1), this binds the tailnet IP.
		return Bun.serve({
			port: primary.port,
			hostname: dnsName,
			idleTimeout: 30,
			routes: devRoutes,
			development: { hmr: false, console: true },
		})
	} catch {
		// Bind failure (name stopped resolving, port in use on that interface).
		return null
	}
}

/**
 * Loopback proxy fronting the mirror for `tailscale serve`.
 *
 * tailscaled can't dial this machine's own tailnet IP (its serve hangs), so
 * serve must target loopback. A plain `fetch` handler has no host check, and
 * `fetch(url, req)` regenerates the Host header from the target URL — the
 * mirror is hostname-bound to the ts name, so it accepts that Host.
 */
function bindTailnetProxy(
	mirror: import('bun').Server<undefined>,
	dnsName: string,
): import('bun').Server<undefined> | null {
	try {
		return Bun.serve({
			port: 0,
			hostname: '127.0.0.1',
			idleTimeout: 30,
			async fetch(req) {
				const url = new URL(req.url)
				url.hostname = dnsName
				url.port = String(mirror.port)
				return fetch(url, req)
			},
		})
	} catch {
		return null
	}
}

/** Register the mirror with `tailscale serve`; null when registration fails. */
function publishTailnetMirror(
	proxyPort: number,
	dnsName: string,
): { url: string; httpsPort: number } | null {
	// Publish via `tailscale serve` so remote devices get HTTPS with a
	// valid cert. Target is the loopback proxy: tailscaled cannot dial this
	// machine's own tailnet IP, so loopback is the only address that works.
	const httpsPort = pickServePort()
	const register = Bun.spawnSync(
		[
			'tailscale',
			'serve',
			'--bg',
			'--yes',
			`--https=${httpsPort}`,
			`http://127.0.0.1:${proxyPort}`,
		],
		{ stdout: 'pipe', stderr: 'pipe' },
	)
	if (register.exitCode !== 0) {
		console.warn(
			`[tailnet] tailscale serve failed on :${httpsPort}; tailnet mirror disabled`,
		)
		return null
	}
	const url = `https://${dnsName}${httpsPort === 443 ? '' : `:${httpsPort}`}`
	return { url, httpsPort }
}

async function startTailnetMirror(
	primary: import('bun').Server<undefined>,
): Promise<import('bun').Server<undefined> | null> {
	if (process.env.DEV_TAILSCALE === '0') return null
	const dnsName = await tailnetDnsName()
	if (!dnsName) return null
	const address = await tailnetAddress(dnsName)
	if (!address) return null
	const mirror = bindTailnetMirror(primary, dnsName)
	if (!mirror) return null
	const proxy = bindTailnetProxy(mirror, dnsName)
	if (!proxy) {
		void mirror.stop(true)
		return null
	}
	const published = publishTailnetMirror(proxy.port ?? 0, dnsName)
	if (!published) {
		void mirror.stop(true)
		void proxy.stop(true)
		return null
	}
	process.env.DEV_TAILSCALE_URL = published.url
	console.log(`mino-starter on ${published.url} (tailnet)`)

	// Unregister when the process goes down, whatever the reason.
	const unregister = () => {
		const off = Bun.spawnSync(
			['tailscale', 'serve', '--yes', `--https=${published.httpsPort}`, 'off'],
			{ stdout: 'ignore', stderr: 'ignore' },
		)
		void mirror.stop(true)
		void proxy.stop(true)
		void off
	}
	process.on('SIGINT', unregister)
	process.on('SIGTERM', unregister)
	process.on('exit', unregister)
	return mirror
}

const server = Bun.serve({
	port,
	...(isDev
		? {
				routes: devRoutes,
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
		if (url.pathname.startsWith('/api')) {
			return handleApi(req)
		}
		// SPA fallback: serve the shell for any non-static, non-API path so the
		// client router owns routing. New client routes need no server change.
		// Unknown /api/* paths still 404 (handled by handleApi above).
		return new Response(Bun.file('dist/index.html'))
	},
})

if (isDev) {
	await startTailnetMirror(server)
}

console.log(`mino-starter on http://localhost:${server.port}`)
