import { TanStackDevtools } from '@tanstack/react-devtools'
import { formDevtoolsPlugin } from '@tanstack/react-form-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import type { AnyRouter } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

export function DevtoolsContent({ router }: { router: AnyRouter }) {
	return (
		<TanStackDevtools
			config={{ position: 'bottom-right' }}
			plugins={[
				{
					name: 'TanStack Query',
					render: <ReactQueryDevtoolsPanel />,
				},
				{
					name: 'TanStack Router',
					render: <TanStackRouterDevtoolsPanel router={router} />,
				},
				formDevtoolsPlugin(),
			]}
		/>
	)
}
