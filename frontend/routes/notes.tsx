import { AppLayout } from '@frontend/components/app-layout'
import { NoteForm } from '@frontend/components/note-form'
import { NoteList } from '@frontend/components/note-list'
import { authClient } from '@frontend/lib/auth'

export function NotesRoute() {
	const { data: session } = authClient.useSession()

	const signOut = (): Promise<void> =>
		authClient.signOut().then(() => {
			window.location.href = '/login'
		})

	return (
		<AppLayout
			actions={
				<button
					type="button"
					className="btn btn-ghost btn-sm"
					onClick={signOut}
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
					<h1 className="text-2xl font-bold">Notes</h1>
				</div>
				<NoteForm />
				<NoteList />
			</div>
		</AppLayout>
	)
}
