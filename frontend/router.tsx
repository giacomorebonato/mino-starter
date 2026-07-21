import { authClient } from '@frontend/lib/auth'
import { LoginRoute } from '@frontend/routes/login'
import { NotesRoute } from '@frontend/routes/notes'
import {
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider,
	redirect,
} from '@tanstack/react-router'

const rootRoute = createRootRoute({
	component: () => <Outlet />,
})

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/',
	beforeLoad: () => {
		throw redirect({ to: '/notes' })
	},
})

const loginRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: 'login',
	component: LoginRoute,
})

const notesRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: 'notes',
	component: NotesRoute,
	beforeLoad: async () => {
		const { data } = await authClient.getSession()
		if (!data) {
			throw redirect({ to: '/login' })
		}
	},
})

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, notesRoute])

export const router = createRouter({ routeTree, defaultPreload: 'intent' })

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}

export { RouterProvider }
