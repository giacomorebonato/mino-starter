import { NoteForm } from '@frontend/components/NoteForm'
import { NoteList } from '@frontend/components/NoteList'
import { authClient } from '@frontend/lib/auth'

export function NotesRoute() {
	const { data: session } = authClient.useSession()

	return (
		<div className="min-h-screen p-8 flex flex-col gap-4">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Notes</h1>
				<button
					type="button"
					className="btn btn-ghost"
					onClick={() =>
						authClient.signOut().then(() => (window.location.href = '/login'))
					}
				>
					Sign out ({session?.user.email})
				</button>
			</div>
			<NoteForm />
			<NoteList />
		</div>
	)
}
