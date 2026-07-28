import { z } from 'zod'

export const noteSchema = z.object({
	title: z.string().min(1),
	content: z.string().min(1),
})

export type NoteInput = z.infer<typeof noteSchema>
