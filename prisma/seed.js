/* eslint-disable @typescript-eslint/no-require-imports */
const {PrismaClient} = require('@prisma/client')
const products = require('./products.json')
const {v4: uuidv4} = require('uuid')
const prisma = new PrismaClient()

async function main() {
  for (const product of products) {
    product.uid = uuidv4()
    await prisma.product.create({
      data: product,
    })
  }
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
