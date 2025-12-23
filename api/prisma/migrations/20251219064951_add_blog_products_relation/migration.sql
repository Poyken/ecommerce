-- CreateTable
CREATE TABLE "BlogProduct" (
    "blogId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogProduct_pkey" PRIMARY KEY ("blogId","productId")
);

-- CreateIndex
CREATE INDEX "BlogProduct_blogId_idx" ON "BlogProduct"("blogId");

-- CreateIndex
CREATE INDEX "BlogProduct_productId_idx" ON "BlogProduct"("productId");

-- AddForeignKey
ALTER TABLE "BlogProduct" ADD CONSTRAINT "BlogProduct_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogProduct" ADD CONSTRAINT "BlogProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
