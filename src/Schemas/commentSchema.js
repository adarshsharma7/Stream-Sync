import {z} from 'zod'

export const commentSchema=z.object({
    comment:z.string()
    .min(2,"Comment must be atleast 2 characters")
    .max(120,"Comment should not more than 120 words")
})