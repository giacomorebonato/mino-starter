import type { Context } from '@backend/trpc/context'
import { notesRouter } from '@backend/trpc/notes'
import { publicRouter } from '@backend/trpc/public'
import { initTRPC } from '@trpc/server'

const t = initTRPC.context<Context>().create()

export const appRouter = t.router({
	notes: notesRouter,
	public: publicRouter,
})

export type AppRouter = typeof appRouter
