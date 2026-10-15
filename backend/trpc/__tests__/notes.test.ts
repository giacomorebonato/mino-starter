import { expect, mock, test } from 'bun:test'

import type { Context } from '@backend/trpc/context'
import { notesRouter } from '@backend/trpc/notes'

const mockSession = { user: { id: 'user-1' }, session: { id: 'sess-1' } }

function createContext(overrides: Partial<Context> = {}): Context {
	return {
		prisma: {
			note: {
				findMany: mock(() =>
					Promise.resolve([
						{ id: 'n1', title: 'T', content: 'C', userId: 'user-1' },
					]),
				),
				create: mock(() =>
					Promise.resolve({
						id: 'n1',
						title: 'T',
						content: 'C',
						userId: 'user-1',
					}),
				),
				deleteMany: mock(() => Promise.resolve({ count: 1 })),
			},
		} as unknown as Context['prisma'],
		session: mockSession as unknown as Context['session'],
		...overrides,
	}
}

test('notes.list returns own notes', async () => {
	const ctx = createContext()
	const caller = notesRouter.createCaller(ctx)
	const result = await caller.list()
	expect(result.length).toBe(1)
})

test('notes.list throws UNAUTHORIZED without session', async () => {
	const ctx = createContext({ session: null })
	const caller = notesRouter.createCaller(ctx)
	// eslint-disable-next-line @typescript-eslint/await-thenable -- Bun awaits rejects at runtime, but the matcher is inferred as void.
	await expect(caller.list()).rejects.toThrow()
})

test('notes.create creates a note', async () => {
	const ctx = createContext()
	const caller = notesRouter.createCaller(ctx)
	const result = await caller.create({ title: 'T', content: 'C' })
	expect(result.title).toBe('T')
})

test('notes.delete deletes own note', async () => {
	const ctx = createContext()
	const caller = notesRouter.createCaller(ctx)
	const result = await caller.delete({ id: 'n1' })
	expect(result.count).toBe(1)
})
