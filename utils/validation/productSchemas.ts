import {z} from 'zod'

export const productSchemaServer = z.object({
  name: z
    .string()
    .min(2, {
      message: 'name must be at least 2 characters',
    })
    .max(100, {
      message: 'name must be less than 100 characters',
    }),
  company: z.string().min(1, 'Company is required'),
  featured: z.coerce.boolean(),
  price: z.coerce.number().int().min(0, {
    message: 'price must be a positive number',
  }),
  description: z.string().refine(
    (description) => {
      const wordCount = description.split(' ').length
      return wordCount >= 10 && wordCount <= 1000
    },
    {
      message: 'description must be between 10 and 1000 words',
    }
  ),
})

export const imageSchemaServer = fileValidation<Blob>()

export const imageSchemaClient = fileValidation<File>()

function fileValidation<T extends File | Blob>() {
  const maxUploadSize = 1024 * 1024
  const acceptedFileTypes = ['image/']
  return z
    .custom<T>((val) => val instanceof Blob, {
      // Blob is parent of File, works for both
      message: 'expected a file',
    })
    .refine((file) => {
      return !file || file.size <= maxUploadSize
    }, 'file size must be less than 1MB')
    .refine((file) => {
      return (
        !file || acceptedFileTypes.some((type) => file.type.startsWith(type))
      )
    }, 'file must be an image')
}

export async function validateWithZodSchema<T>(
  schema: z.ZodType<T>,
  data: unknown
): Promise<T> {
  const result = await schema.safeParseAsync(data)

  if (!result.success) {
    const errors = result.error.issues.map((error) => error.message)
    throw new Error(errors.join(', '))
  }

  return result.data
}
