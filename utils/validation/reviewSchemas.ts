import {z} from 'zod'

export const reviewSchema = z.object({
  productId: z.string().refine((value) => value !== '', {
    message: 'Product ID cannot be empty',
  }),
  authorName: z.string().refine((value) => value !== '', {
    message: 'Author name cannot be empty',
  }),
  authorImageUrl: z.string().refine((value) => value !== '', {
    message: 'Author image URL cannot be empty',
  }),
  rating: z.coerce
    .number()
    .int()
    .min(1, {message: 'Rating must be at least 1'})
    .max(5, {message: 'Rating must be at most 5'}),
  comment: z
    .string()
    .min(10, {message: 'Comment must be at least 10 characters long'})
    .max(1000, {message: 'Comment must be at most 1000 characters long'}),
})
