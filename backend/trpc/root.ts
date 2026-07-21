import type { Context } from '@backend/trpc/context'
import { notesRouter } from '@backend/trpc/notes'
import { initTRPC } from '@trpc/server'

const t = initTRPC.context<Context>().create()

export const appRouter = t.router({
	notes: notesRouter,
})

export type AppRouter = typeof appRouter
