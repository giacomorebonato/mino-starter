import { AppShell } from '@frontend/components/AppShell'
import { AuthForm } from '@frontend/components/AuthForm'
import { useState } from 'react'

export function LoginRoute() {
	const [mode, setMode] = useState<'signin' | 'signup'>('signin')
	return (
		<AppShell>
			<div className="flex flex-col gap-6 max-w-sm">
				<div className="flex flex-col gap-1">
					<span className="eyebrow">
						{mode === 'signin' ? 'welcome back' : 'create account'}
					</span>
					<h1 className="text-2xl font-bold">
						{mode === 'signin' ? 'Sign in' : 'Sign up'}
					</h1>
				</div>
				<div className="join">
					<button
						type="button"
						className={`btn join-item ${mode === 'signin' ? 'btn-active' : ''}`}
						onClick={() => setMode('signin')}
					>
						Sign in
					</button>
					<button
						type="button"
						className={`btn join-item ${mode === 'signup' ? 'btn-active' : ''}`}
						onClick={() => setMode('signup')}
					>
						Sign up
					</button>
				</div>
				<AuthForm mode={mode} />
			</div>
		</AppShell>
	)
}
