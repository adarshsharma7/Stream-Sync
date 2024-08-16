import {z} from 'zod'

export const commentReplySchema=z.object({
    commentReply:z.string()
    .min(2,"Comment reply must be atleast 2 characters")
    .max(120,"Comment reply should not more than 120 words")
})