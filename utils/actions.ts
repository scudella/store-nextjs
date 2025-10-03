'use server'

import {auth, currentUser} from '@clerk/nextjs/server'
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
import type {Product, Cart} from '@prisma/client'
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

  const product = await fetchProduct(productId)

  const favorite = await prisma.favorite.findFirst({
    where: {
      productId: product.id,
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
      const product = await fetchProduct(productId)

      await prisma.favorite.create({
        data: {
          uid: uuidv4(),
          productId: product.id,
          clerkId: user.id,
        },
      })
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

    const product = await fetchProduct(productId)

    const {id} = product
    await prisma.review.create({
      data: {
        ...validatedFields,
        productId: id,
        uid: uuidv4(),
        clerkId: user.id,
      },
    })

    revalidatePath(`/products/${productId}`)

    return {message: 'review submitted successfully'}
  } catch (error) {
    return renderError(error)
  }
}

export const fetchProductReviews = async (productId: string) => {
  const product = await fetchProduct(productId)

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

export const fetchProductRating = async (productId: string) => {
  const product = await fetchProduct(productId)

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

export const findExistingReview = async (userId: string, productId: bigint) => {
  return await prisma.review.findFirst({
    where: {
      clerkId: userId,
      productId,
    },
  })
}

export const fetchCartItems = async () => {
  const {userId} = await auth()
  const cart = await prisma.cart.findFirst({
    where: {
      clerkId: userId ?? '',
    },
    select: {
      numItemsInCart: true,
    },
  })
  return cart?.numItemsInCart || 0
}

const fetchProduct = async (productId: string) => {
  const product = await prisma.product.findUnique({
    where: {
      uid: productId,
    },
  })

  if (!product) {
    throw new Error('Product Not Found')
  }
  return product
}

const includeProductClause = {
  cartItems: {
    include: {
      product: true,
    },
  },
}

export const fetchOrCreateCart = async ({
  userId,
  errorOnFailure = false,
}: {
  userId: string
  errorOnFailure?: boolean
}) => {
  let cart = await prisma.cart.findFirst({
    where: {
      clerkId: userId,
    },
    include: includeProductClause,
  })

  if (!cart && errorOnFailure) {
    throw new Error('Cart not found')
  }

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        clerkId: userId,
        uid: uuidv4(),
      },
      include: includeProductClause,
    })
  }
  return cart
}

const updateOrCreateCartItem = async ({
  productId,
  cartId,
  amount,
}: {
  productId: bigint
  cartId: bigint
  amount: number
}) => {
  let cartItem = await prisma.cartItem.findFirst({
    where: {
      productId,
      cartId,
    },
  })

  if (cartItem) {
    cartItem = await prisma.cartItem.update({
      where: {
        id: cartItem.id,
      },
      data: {
        amount: cartItem.amount + amount,
      },
    })
  } else {
    cartItem = await prisma.cartItem.create({
      data: {
        amount,
        productId,
        cartId,
        uid: uuidv4(),
      },
    })
  }
}

export const updateCart = async (cart: Cart) => {
  const cartItems = await prisma.cartItem.findMany({
    where: {
      cartId: cart.id,
    },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })
  let numItemsInCart = 0
  let cartTotal = 0

  for (const item of cartItems) {
    numItemsInCart += item.amount
    cartTotal += item.amount * item.product.price
  }
  const tax = cart.taxRate * cartTotal
  const shipping = cartTotal ? cart.shipping : 0
  const orderTotal = cartTotal + tax + shipping

  const currentCart = await prisma.cart.update({
    where: {
      id: cart.id,
    },
    data: {
      numItemsInCart,
      cartTotal,
      tax,
      orderTotal,
    },
    include: includeProductClause,
  })
  return {cartItems, currentCart}
}

export const addToCartAction = async (
  prevState: unknown,
  formData: FormData
) => {
  const user = await getAuthUser()
  try {
    const productId = formData.get('productId') as string
    const amount = Number(formData.get('amount'))
    const product = await fetchProduct(productId)
    const cart = await fetchOrCreateCart({userId: user.id})
    await updateOrCreateCartItem({
      productId: product.id,
      cartId: cart.id,
      amount,
    })
    await updateCart(cart)
  } catch (error) {
    return renderError(error)
  }
  redirect('/cart')
}

export const removeCartItemAction = async (
  prevState: unknown,
  formData: FormData
) => {
  const user = await getAuthUser()
  try {
    const cartItemId = formData.get('id') as string
    const cart = await fetchOrCreateCart({
      userId: user.id,
      errorOnFailure: true,
    })

    await prisma.cartItem.delete({
      where: {
        uid: cartItemId,
        cartId: cart.id,
      },
    })
    await updateCart(cart)
    revalidatePath('/cart')
  } catch (error) {
    return renderError(error)
  }
  return {message: 'Item removed from cart'}
}

export const updateCartItemAction = async ({
  amount,
  cartItemId,
}: {
  amount: number
  cartItemId: string
}) => {
  const user = await getAuthUser()
  try {
    const cart = await fetchOrCreateCart({
      userId: user.id,
      errorOnFailure: true,
    })

    await prisma.cartItem.update({
      where: {
        uid: cartItemId,
        cartId: cart.id,
      },
      data: {
        amount,
      },
    })
    await updateCart(cart)
    revalidatePath('/cart')
    return {message: 'cart updated'}
  } catch (error) {
    return renderError(error)
  }
}

export const createOrderAction = async (
  prevState: unknown,
  formData: FormData
) => {
  return {message: 'order created'}
}
