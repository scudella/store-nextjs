'use server'

import {prisma} from './db'
import {redirect} from 'next/navigation'

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

export const createProductAction = async (): // prevState: unknown,
// formData: FormData
Promise<{message: string}> => {
  return {message: 'product created'}
}
