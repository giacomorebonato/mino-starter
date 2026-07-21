import { useTRPC } from '@frontend/lib/trpc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export function NoteForm() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const [title, setTitle] = useState('')
	const [content, setContent] = useState('')
	const create = useMutation(
		trpc.notes.create.mutationOptions({
			onSuccess: async () => {
				await queryClient.invalidateQueries(trpc.notes.list.queryFilter())
				setTitle('')
				setContent('')
			},
		}),
	)

	function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		create.mutate({ title, content })
	}

	return (
		<form className="flex flex-col gap-3 max-w-sm" onSubmit={onSubmit}>
			<input
				className="input input-bordered w-full"
				placeholder="Title"
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				required
			/>
			<textarea
				className="textarea textarea-bordered w-full min-h-24"
				placeholder="Content"
				value={content}
				onChange={(e) => setContent(e.target.value)}
				required
			/>
			<button
				className="btn btn-primary w-full"
				type="submit"
				disabled={create.isPending}
			>
				Add note
			</button>
		</form>
	)
}
