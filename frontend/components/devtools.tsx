import type { AnyRouter } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

const DevtoolsContent = lazy(() =>
	import('./devtools-content').then((m) => ({ default: m.DevtoolsContent })),
)

export function AppDevtools({ router }: { router: AnyRouter }) {
	if (process.env.NODE_ENV !== 'development') return null
	return (
		<Suspense fallback={null}>
			<DevtoolsContent router={router} />
		</Suspense>
	)
}
