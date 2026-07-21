import { useTRPC } from '@frontend/lib/trpc'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function NoteList() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const { data, isPending } = useQuery(trpc.notes.list.queryOptions())
	const del = useMutation(
		trpc.notes.delete.mutationOptions({
			onSuccess: async () => {
				await queryClient.invalidateQueries(trpc.notes.list.queryFilter())
			},
		}),
	)

	if (isPending) return <div>Loading…</div>

	return (
		<ul className="flex flex-col gap-2">
			{data?.map((note) => (
				<li
					key={note.id}
					className="card flex items-start justify-between gap-4 border border-base-300 bg-base-200 p-4"
				>
					<div>
						<div className="font-bold">{note.title}</div>
						<div>{note.content}</div>
					</div>
					<button
						type="button"
						className="btn btn-ghost btn-sm btn-error"
						onClick={() => del.mutate({ id: note.id })}
						disabled={del.isPending}
					>
						Delete
					</button>
				</li>
			))}
		</ul>
	)
}
