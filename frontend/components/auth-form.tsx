import { authClient } from '@frontend/lib/auth'
import { signInSchema, signUpSchema } from '@shared/schemas/auth'
import { useForm } from '@tanstack/react-form'
import { useState } from 'react'

type AuthMode = 'signin' | 'signup'

function useAuthForm(mode: AuthMode) {
	const [error, setError] = useState<string | null>(null)

	const form = useForm({
		defaultValues: {
			email: '',
			password: '',
			name: '',
		} as { email: string; password: string; name?: string },
		validators: {
			onChange: mode === 'signup' ? signUpSchema : signInSchema,
		},
		onSubmit: async ({ value }) => {
			setError(null)
			const res =
				mode === 'signin'
					? await authClient.signIn.email({
							email: value.email,
							password: value.password,
						})
					: await authClient.signUp.email({
							email: value.email,
							password: value.password,
							name: value.name ?? '',
						})
			if (res.error) {
				setError(res.error.message ?? 'Authentication failed')
				return
			}
			window.location.href = '/notes'
		},
	})

	return { form, error }
}

export function AuthForm({ mode }: { mode: AuthMode }) {
	const { form, error } = useAuthForm(mode)

	return (
		<form
			className="flex max-w-sm flex-col gap-2"
			onSubmit={(e) => {
				e.preventDefault()
				void form.handleSubmit()
			}}
		>
			{(mode === 'signup'
				? (['name', 'email', 'password'] as const)
				: (['email', 'password'] as const)
			).map((name) => (
				<form.Field
					key={name}
					name={name}
					children={(field) => (
						<input
							className="input input-bordered w-full"
							type={name === 'name' ? 'text' : name}
							placeholder={name.charAt(0).toUpperCase() + name.slice(1)}
							value={field.state.value ?? ''}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
					)}
				/>
			))}
			{error && <div className="text-error">{error}</div>}
			<form.Subscribe
				selector={(state) => [state.canSubmit, state.isSubmitting]}
				children={([canSubmit, isSubmitting]) => (
					<button
						className="btn btn-primary w-full"
						type="submit"
						disabled={!canSubmit || isSubmitting}
					>
						{mode === 'signin' ? 'Sign in' : 'Sign up'}
					</button>
				)}
			/>
		</form>
	)
}
