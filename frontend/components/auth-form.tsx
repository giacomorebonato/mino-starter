import { authClient } from '@frontend/lib/auth'
import { useState } from 'react'

export function AuthForm({ mode }: { mode: 'signin' | 'signup' }) {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [name, setName] = useState('')
	const [error, setError] = useState<string | null>(null)

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError(null)
		const res =
			mode === 'signin'
				? await authClient.signIn.email({ email, password })
				: await authClient.signUp.email({ email, password, name })
		if (res.error) {
			setError(res.error.message ?? 'Authentication failed')
			return
		}
		window.location.href = '/notes'
	}

	return (
		<form className="flex max-w-sm flex-col gap-2" onSubmit={onSubmit}>
			{mode === 'signup' && (
				<input
					className="input input-bordered w-full"
					placeholder="Name"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>
			)}
			<input
				className="input input-bordered w-full"
				type="email"
				placeholder="Email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				required
			/>
			<input
				className="input input-bordered w-full"
				type="password"
				placeholder="Password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				required
			/>
			{error && <div className="text-error">{error}</div>}
			<button className="btn btn-primary w-full" type="submit">
				{mode === 'signin' ? 'Sign in' : 'Sign up'}
			</button>
		</form>
	)
}
