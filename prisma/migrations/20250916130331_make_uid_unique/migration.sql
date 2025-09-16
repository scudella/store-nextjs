/*
  Warnings:

  - A unique constraint covering the columns `[uid]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Product_uid_key" ON "public"."Product"("uid");
