import {z} from 'zod'

export const chatMessageSchema=z.object({
    chatMessage:z.string()
    .max(1000,"Message should not more than 1000 words")
})