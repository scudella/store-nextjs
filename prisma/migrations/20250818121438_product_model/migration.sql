-- CreateTable
CREATE TABLE "public"."Product" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL,
    "image" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clerkId" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
