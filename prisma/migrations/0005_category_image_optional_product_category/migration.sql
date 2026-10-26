-- Add an optional photo to categories
ALTER TABLE "Category" ADD COLUMN "image" TEXT;

-- Make the product category optional
ALTER TABLE "Product" ALTER COLUMN "categoryId" DROP NOT NULL;
