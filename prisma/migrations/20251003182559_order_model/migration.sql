-- CreateTable
CREATE TABLE "public"."Order" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "products" INTEGER NOT NULL DEFAULT 0,
    "orderTotal" INTEGER NOT NULL DEFAULT 0,
    "tax" INTEGER NOT NULL DEFAULT 0,
    "shipping" INTEGER NOT NULL DEFAULT 0,
    "email" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_uid_key" ON "public"."Order"("uid");
