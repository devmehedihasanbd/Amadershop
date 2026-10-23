/* ------------------------------------------------------------------ */
/*  Seed the database from the mock catalog in lib/products.ts.        */
/*                                                                     */
/*  Run with a DATABASE_URL set:                                       */
/*    npx prisma migrate deploy && npm run db:seed                     */
/* ------------------------------------------------------------------ */

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { categories, products } from "../lib/products";

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Cannot seed.");
}

const adapter = new PrismaNeon({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`Seeding ${categories.length} categories, ${products.length} products…`);

  for (const [i, c] of categories.entries()) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.tagline, sortOrder: i },
      create: { slug: c.slug, name: c.name, description: c.tagline, sortOrder: i },
    });
  }

  for (const p of products) {
    const category = await prisma.category.findUnique({
      where: { slug: p.category },
      select: { id: true },
    });
    if (!category) throw new Error(`Category not found for product ${p.slug}`);

    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.short,
        details: p.details,
        price: p.price,
        oldPrice: p.oldPrice ?? null,
        unit: p.unit,
        rating: p.rating,
        reviewsCount: p.reviews,
        badge: p.badge,
        categoryId: category.id,
      },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.short,
        details: p.details,
        price: p.price,
        oldPrice: p.oldPrice ?? null,
        unit: p.unit,
        rating: p.rating,
        reviewsCount: p.reviews,
        badge: p.badge,
        categoryId: category.id,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
