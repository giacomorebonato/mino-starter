import { AppShell } from '@frontend/components/AppShell'
import { NoteForm } from '@frontend/components/NoteForm'
import { NoteList } from '@frontend/components/NoteList'
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
					<span className="hidden sm:inline opacity-60">
						· {session?.user.email}
					</span>
				</button>
			}
		>
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-1">
					<span className="eyebrow">demo route</span>
					<h1 className="text-2xl font-bold">Notes</h1>
				</div>
				<NoteForm />
				<NoteList />
			</div>
		</AppShell>
	)
}
