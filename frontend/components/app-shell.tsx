import { type ReactNode, useState } from 'react'

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
	const [compact, setCompact] = useState(false)

	return (
		<div className="flex min-h-screen flex-col">
			<header className="app-bar sticky top-0 z-10">
				<div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-6">
					<a href="/" className="group flex items-center gap-2.5">
						<span className="wordmark">
							mino-starter
							<span className="wordmark-cursor" aria-hidden="true" />
						</span>
						<span className="eyebrow hidden sm:inline">starter kit</span>
					</a>
					<div className="flex items-center gap-2">
						<button
							type="button"
							className="btn btn-ghost btn-sm"
							onClick={() => setCompact((c) => !c)}
							aria-pressed={compact}
							title="Toggle compact mode"
						>
							{compact ? 'Compact' : 'Cozy'}
						</button>
						{actions}
					</div>
				</div>
			</header>
			<main
				className={`mx-auto w-full max-w-3xl flex-1 px-6 ${compact ? 'py-4' : 'py-8'}`}
			>
				{children}
			</main>
		</div>
	)
}
