import { optional, z } from 'zod';




export const uploadVideoSchema = z.object({
    title: z.string()
        .min(4, "Title must be at least 4 characters")
        .max(20, "Title should not be more than 500 characters"),
    description: z.string()
        .min(15, "Description must be at least 15 characters")
        .max(100, "Description should not be more than 10000 characters"),

    videoFile: z.any(),

    thumbnail: z.any()


});
export const updateVideoSchema = z.object({
    title: z.string()
        .min(4, "Title must be at least 4 characters")
        .max(20, "Title should not be more than 500 characters")
        .optional(),
    description: z.string()
        .min(15, "Description must be at least 15 characters")
        .max(100, "Description should not be more than 10000 characters")
        .optional()
}).refine(data => data.title || data.description, {
    message: "Either title or description must be provided",
    path: ["title", "description"], // This can be an array or just the path you want to show the error under
});
