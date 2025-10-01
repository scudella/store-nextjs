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
import {deleteImage, uploadImage} from './oci/bucket-upload'
import {revalidatePath} from 'next/cache'
import type {Product} from '@prisma/client'
import {reviewSchema} from './validation/reviewSchemas'

const getAuthUser = async () => {
  const user = await currentUser()
  if (!user) redirect('/')
  return user
}

const getAdminUser = async () => {
  const user = await getAuthUser()
  if (user.id !== process.env.ADMIN_USER_ID) {
    redirect('/')
  }
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
  const product = await prisma.product.findUnique({
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

export const fetchAdminProducts = async (): Promise<Product[]> => {
  await getAdminUser()
  const products = await prisma.product.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })
  return products
}

export const deleteProductAction = async (prevState: {
  productId: string
  imageName: string
}) => {
  const {productId, imageName} = prevState
  await getAdminUser()

  try {
    await prisma.product.delete({
      where: {
        uid: productId,
      },
    })

    deleteImage(imageName)

    revalidatePath('/admin/products')
    return {message: 'product removed'}
  } catch (error) {
    return renderError(error)
  }
}

export const fetchAdminProductDetails = async (productId: string) => {
  await getAdminUser()
  const product = await prisma.product.findUnique({
    where: {
      uid: productId,
    },
  })

  if (!product) redirect('/admin/products')
  return product
}

export const updateProductAction = async (
  prevState: unknown,
  formData: FormData
) => {
  await getAdminUser()
  try {
    const productId = formData.get('id') as string
    const rawData = Object.fromEntries(formData)
    const validatedFields = await validateWithZodSchema(
      productSchemaServer,
      rawData
    )

    await prisma.product.update({
      where: {
        uid: productId,
      },
      data: {
        ...validatedFields,
      },
    })

    revalidatePath(`/admin/products/${productId}/edit`)

    return {message: 'Product updated successfully'}
  } catch (error) {
    return renderError(error)
  }
}

export const updateProductImageAction = async (
  prevState: unknown,
  formData: FormData
) => {
  await getAuthUser()
  try {
    const file = formData.get('image') as File
    const originalName = formData.get('imageName') as string
    const productId = formData.get('id') as string
    const oldImageUrl = formData.get('url') as string

    const validatedFile = await validateWithZodSchema(imageSchemaServer, file)
    const objectName = await uploadImage(validatedFile, originalName)

    await deleteImage(oldImageUrl)

    await prisma.product.update({
      where: {
        uid: productId,
      },
      data: {
        image: `https://objectstorage.us-ashburn-1.oraclecloud.com/n/idl94repfhz7/b/bucket-store-nextjs/o/${objectName}`,
      },
    })
    revalidatePath(`/admin/products/${productId}/edit`)
    return {message: 'Product Image updated successfully'}
  } catch (error) {
    return renderError(error)
  }
}

export const fetchFavoriteId = async ({productId}: {productId: string}) => {
  const user = await getAuthUser()

  const product = await prisma.product.findUnique({
    where: {
      uid: productId,
    },
  })

  const favorite = await prisma.favorite.findFirst({
    where: {
      productId: product?.id,
      clerkId: user.id,
    },
    select: {
      uid: true,
    },
  })

  return favorite?.uid || null
}

export const toggleFavoriteAction = async (prevState: {
  productId: string
  favoriteId: string | null
  pathName: string
}) => {
  const user = await getAuthUser()
  const {productId, favoriteId, pathName} = prevState

  try {
    if (favoriteId) {
      await prisma.favorite.delete({
        where: {
          uid: favoriteId,
        },
      })
    } else {
      const product = await prisma.product.findUnique({
        where: {
          uid: productId,
        },
      })

      if (product) {
        await prisma.favorite.create({
          data: {
            uid: uuidv4(),
            productId: product.id,
            clerkId: user.id,
          },
        })
      }
    }
    revalidatePath(pathName)
    return {
      message: favoriteId ? 'removed from favorites' : 'added to favorites',
    }
  } catch (error) {
    return renderError(error)
  }
}

export const fetchUserFavorites = async () => {
  const user = await getAuthUser()
  return await prisma.favorite.findMany({
    where: {
      clerkId: user.id,
    },
    include: {
      product: true,
    },
  })
}

export const createReviewAction = async (
  prevState: unknown,
  formData: FormData
) => {
  const user = await getAuthUser()

  try {
    const rawData = Object.fromEntries(formData)
    const validatedFields = await validateWithZodSchema(reviewSchema, rawData)
    const {productId} = validatedFields

    const product = await prisma.product.findUnique({
      where: {
        uid: productId,
      },
    })

    if (product) {
      const {id} = product
      await prisma.review.create({
        data: {
          ...validatedFields,
          productId: id,
          uid: uuidv4(),
          clerkId: user.id,
        },
      })
    }

    revalidatePath(`/products/${productId}`)

    return {message: 'review submitted successfully'}
  } catch (error) {
    return renderError(error)
  }
}

export const fetchProductReviews = async (productId: string) => {
  const product = await prisma.product.findUnique({
    where: {
      uid: productId,
    },
  })

  if (product) {
    const {id} = product
    return await prisma.review.findMany({
      where: {
        productId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }
}

export const fetchProductRating = async (productId: string) => {
  const product = await prisma.product.findUnique({
    where: {
      uid: productId,
    },
  })

  if (product) {
    const {id} = product

    const result = await prisma.review.groupBy({
      by: ['productId'],
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
      where: {
        productId: id,
      },
    })
    return {
      rating: result[0]?._avg.rating?.toFixed(1) ?? 0,
      count: result[0]?._count.rating ?? 0,
    }
  }
  return {
    rating: 0,
    count: 0,
  }
}

export const fetchProductReviewsByUser = async () => {
  const user = await getAuthUser()
  return await prisma.review.findMany({
    where: {
      clerkId: user.id,
    },
    select: {
      uid: true,
      rating: true,
      comment: true,
      product: {
        select: {
          image: true,
          name: true,
        },
      },
    },
  })
}

export const deleteReviewAction = async (prevState: {reviewId: string}) => {
  const {reviewId} = prevState
  const user = await getAuthUser()
  try {
    await prisma.review.delete({
      where: {
        uid: reviewId,
        clerkId: user.id,
      },
    })
    revalidatePath('/reviews')
    return {message: 'review deleted successfully'}
  } catch (error) {
    return renderError(error)
  }
}

export const findExistingReview = async () => {}
