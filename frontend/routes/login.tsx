import { AuthForm } from '@frontend/components/AuthForm'
import { useState } from 'react'

export function LoginRoute() {
	const [mode, setMode] = useState<'signin' | 'signup'>('signin')
	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="flex flex-col gap-4">
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
		</div>
	)
}
