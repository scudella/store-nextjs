'use server'

import {currentUser} from '@clerk/nextjs/server'
import {prisma} from './db'
import {redirect} from 'next/navigation'
import {v4 as uuidv4} from 'uuid'
import {
  imageSchemaServer,
  productSchemaServer,
  validateWithZodSchema,
} from './validation/productSchemas'
import {uploadImage} from './oci/bucket-upload'

const getAuthUser = async () => {
  const user = await currentUser()
  if (!user) redirect('/')
  return user
}

const renderError = (error: unknown): {message: string} => {
  console.log(error)
  return {
    message: error instanceof Error ? error.message : 'an error occurred',
  }
}

export const fetchFeaturedProducts = async () => {
  return await prisma.product.findMany({
    where: {
      featured: true,
    },
  })
}

export const fetchAllProducts = async ({search = ''}: {search: string}) => {
  return await prisma.product.findMany({
    where: {
      OR: [
        {name: {contains: search, mode: 'insensitive'}},
        {company: {contains: search, mode: 'insensitive'}},
      ],
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export const fetchSingleProduct = async (productId: string) => {
  const product = await prisma.product.findFirst({
    where: {
      uid: productId,
    },
  })

  if (!product) {
    redirect('/products')
  }
  return product
}

export const createProductAction = async (
  prevState: unknown,
  formData: FormData
): Promise<{message: string}> => {
  const user = await getAuthUser()

  try {
    const rawData = Object.fromEntries(formData)
    const result = await validateWithZodSchema(productSchemaServer, rawData)
    const file = formData.get('image') as File
    const originalName = formData.get('imageName') as string
    const validatedFile = await validateWithZodSchema(imageSchemaServer, file)
    const objectName = await uploadImage(validatedFile, originalName)

    if (objectName) {
      await prisma.product.create({
        data: {
          ...result,
          uid: uuidv4(),
          image: `https://objectstorage.us-ashburn-1.oraclecloud.com/n/idl94repfhz7/b/bucket-store-nextjs/o/${objectName}`,
          clerkId: user.id,
        },
      })
    } else {
      throw new Error('Bucket upload failed')
    }
  } catch (error) {
    return renderError(error)
  }
  redirect('/admin/products')
}
