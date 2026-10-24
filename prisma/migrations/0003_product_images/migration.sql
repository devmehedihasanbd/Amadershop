-- Add multi-photo support to products (up to 3 photos per product)
ALTER TABLE "Product" ADD COLUMN "images" TEXT[] NOT NULL DEFAULT '{}';
