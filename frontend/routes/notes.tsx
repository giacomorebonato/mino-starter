import { AppShell } from '@frontend/components/app-shell'
import { NoteForm } from '@frontend/components/note-form'
import { NoteList } from '@frontend/components/note-list'
import { authClient } from '@frontend/lib/auth'

export function NotesRoute() {
	const { data: session } = authClient.useSession()

	return (
		<AppShell
			actions={
				<button
					type="button"
					className="btn btn-ghost btn-sm"
					onClick={() =>
						authClient.signOut().then(() => (window.location.href = '/login'))
					}
				>
					Sign out
					<span className="hidden opacity-60 sm:inline">
						· {session?.user.email}
					</span>
				</button>
			}
		>
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-1">
					<span className="eyebrow">demo route</span>
					<h1 className="font-bold text-2xl">Notes</h1>
				</div>
				<NoteForm />
				<NoteList />
			</div>
		</AppShell>
	)
}
