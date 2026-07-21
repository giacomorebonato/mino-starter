import type { Context } from '@backend/trpc/context'
import { initTRPC, TRPCError } from '@trpc/server'
import { z } from 'zod'

const t = initTRPC.context<Context>().create()

const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({ code: 'UNAUTHORIZED' })
	}
	return next({ ctx: { session: ctx.session } })
})

export const notesRouter = t.router({
	list: protectedProcedure.query(({ ctx }) =>
		ctx.prisma.note.findMany({ where: { userId: ctx.session.user.id } }),
	),
	create: protectedProcedure
		.input(z.object({ title: z.string().min(1), content: z.string().min(1) }))
		.mutation(({ ctx, input }) =>
			ctx.prisma.note.create({
				data: {
					title: input.title,
					content: input.content,
					userId: ctx.session.user.id,
				},
			}),
		),
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(({ ctx, input }) =>
			ctx.prisma.note.deleteMany({
				where: { id: input.id, userId: ctx.session.user.id },
			}),
		),
})
