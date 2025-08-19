import {prisma} from './db'

export const fetchFeaturedProducts = async () => {
  return await prisma.product.findMany({
    where: {
      featured: true,
    },
  })
}

export const fetchAllProducts = async () => {
  return prisma.product.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })
}
