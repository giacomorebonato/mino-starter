import { useTRPC } from '@frontend/lib/trpc'
import { noteSchema } from '@shared/schemas/note'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function NoteForm() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const form = useForm({
		defaultValues: {
			title: '',
			content: '',
		},
		validators: {
			onChange: noteSchema,
		},
		onSubmit: ({ value }) => {
			create.mutate(value)
		},
	})

	const create = useMutation(
		trpc.notes.create.mutationOptions({
			onSuccess: async () => {
				await queryClient.invalidateQueries(trpc.notes.list.queryFilter())
				form.reset()
			},
		}),
	)

	return (
		<form
			className="flex max-w-sm flex-col gap-3"
			onSubmit={(e) => {
				e.preventDefault()
				void form.handleSubmit()
			}}
		>
			<form.Field
				name="title"
				children={(field) => (
					<input
						className="input input-bordered w-full"
						placeholder="Title"
						value={field.state.value}
						onBlur={field.handleBlur}
						onChange={(e) => field.handleChange(e.target.value)}
					/>
				)}
			/>
			<form.Field
				name="content"
				children={(field) => (
					<textarea
						className="textarea textarea-bordered min-h-24 w-full"
						placeholder="Content"
						value={field.state.value}
						onBlur={field.handleBlur}
						onChange={(e) => field.handleChange(e.target.value)}
					/>
				)}
			/>
			<form.Subscribe
				selector={(state) => [state.canSubmit, state.isSubmitting]}
				children={([canSubmit, isSubmitting]) => (
					<button
						className="btn btn-primary w-full"
						type="submit"
						disabled={!canSubmit || isSubmitting || create.isPending}
					>
						Add note
					</button>
				)}
			/>
		</form>
	)
}
