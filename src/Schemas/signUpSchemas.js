import { Zen_Tokyo_Zoo } from 'next/font/google'
import {z} from 'zod'

export const usernameSchemaType=z.object({
    username:z.string()
    .min(2, 'Username must be at least 2 characters')
    .max(20, 'Username must be no more than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username must not contain special characters')
})

export const signUpValidation=z.object({
    username:z.string()
    .min(2, 'Username must be at least 2 characters')
    .max(20, 'Username must be no more than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username must not contain special characters'),
    email:z.string().email({message:'Invalid Email Address'}),
    password:z.string().min(6,{message:"Password must be at least 6 characters"}),
    fullName:z.string() .min(2, 'FullName must be at least 2 characters')
    .max(20, 'FullName must be no more than 15 characters'),
    avatar:z.any()
   
})

