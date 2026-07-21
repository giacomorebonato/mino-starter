import type { ReactNode } from 'react'

/**
 * App shell — top bar with the mino-starter wordmark.
 * The wordmark is a placeholder: replace `.wordmark` text and the
 * `mino-starter` label with your product name when you fork this kit.
 */
export function AppShell({
	children,
	actions,
}: {
	children: ReactNode
	actions?: ReactNode
}) {
	return (
		<div className="min-h-screen flex flex-col">
			<header className="app-bar sticky top-0 z-10">
				<div className="mx-auto max-w-3xl w-full px-6 h-14 flex items-center justify-between">
					<a href="/" className="flex items-center gap-2.5 group">
						<span className="wordmark">
							mino-starter
							<span className="wordmark-cursor" aria-hidden="true" />
						</span>
						<span className="eyebrow hidden sm:inline">starter kit</span>
					</a>
					{actions && <div className="flex items-center gap-2">{actions}</div>}
				</div>
			</header>
			<main className="flex-1 mx-auto max-w-3xl w-full px-6 py-8">
				{children}
			</main>
		</div>
	)
}
