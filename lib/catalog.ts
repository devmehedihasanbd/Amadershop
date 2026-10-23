/* ------------------------------------------------------------------ */
/*  Catalog data access.                                               */
/*                                                                     */
/*  Tries PostgreSQL (via Prisma) first; on any failure — including    */
/*  a missing DATABASE_URL — falls back to the mock catalog in         */
/*  lib/products.ts. Returned shapes always match the Product /        */
/*  Category interfaces the UI already uses, so pages need no changes  */
/*  beyond swapping their data source.                                 */
/* ------------------------------------------------------------------ */

import { getDb } from "./db";
import {
  categories as mockCategories,
  products as mockProducts,
  getProduct as getMockProduct,
  getCategory as getMockCategory,
  searchProducts as searchMockProducts,
  relatedProducts as relatedMockProducts,
  type Badge,
  type Category,
  type Product,
} from "./products";

export type SortKey = "popular" | "price-asc" | "price-desc";

interface DbProductRow {
  slug: string;
  name: string;
  description: string;
  details: unknown;
  price: number;
  oldPrice: number | null;
  unit: string;
  rating: number;
  reviewsCount: number;
  badge: string | null;
  category: { slug: string };
}

function toBadge(value: string | null): Badge {
  return value === "best-selling" || value === "new" ? value : null;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
}

function toProduct(row: DbProductRow): Product {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category.slug,
    price: row.price,
    oldPrice: row.oldPrice ?? undefined,
    unit: row.unit,
    rating: row.rating,
    reviews: row.reviewsCount,
    badge: toBadge(row.badge),
    short: row.description,
    details: toStringArray(row.details),
  };
}

function sortMock(list: Product[], sort: SortKey): Product[] {
  const out = [...list];
  switch (sort) {
    case "price-asc":
      return out.sort((a, b) => a.price - b.price);
    case "price-desc":
      return out.sort((a, b) => b.price - a.price);
    case "popular":
    default:
      return out.sort((a, b) => b.reviews - a.reviews);
  }
}

const productInclude = { category: { select: { slug: true } } } as const;

function dbOrderBy(sort: SortKey) {
  switch (sort) {
    case "price-asc":
      return { price: "asc" } as const;
    case "price-desc":
      return { price: "desc" } as const;
    case "popular":
    default:
      return { reviewsCount: "desc" } as const;
  }
}

/* ------------------------------ categories ----------------------------- */

export async function getCategories(): Promise<Category[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
      if (rows.length > 0) {
        return rows.map((r) => ({
          slug: r.slug,
          name: r.name,
          tagline: r.description ?? "",
        }));
      }
    } catch {
      /* fall through to mock data */
    }
  }
  return mockCategories;
}

export async function getCategory(slug: string): Promise<Category | null> {
  const cats = await getCategories();
  return cats.find((c) => c.slug === slug) ?? getMockCategory(slug) ?? null;
}

/* ------------------------------- products ------------------------------ */

export interface GetProductsOptions {
  categorySlug?: string;
  q?: string;
  sort?: SortKey;
}

export async function getProducts(opts: GetProductsOptions = {}): Promise<Product[]> {
  const { categorySlug, q, sort = "popular" } = opts;
  const db = getDb();

  if (db) {
    try {
      const query = (q ?? "").trim();
      const rows = await db.product.findMany({
        where: {
          ...(categorySlug
            ? { category: { slug: categorySlug } }
            : {}),
          ...(query
            ? {
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        include: productInclude,
        orderBy: dbOrderBy(sort),
      });
      return rows.map((r) =>
        toProduct({
          slug: r.slug,
          name: r.name,
          description: r.description,
          details: r.details,
          price: r.price,
          oldPrice: r.oldPrice,
          unit: r.unit,
          rating: r.rating,
          reviewsCount: r.reviewsCount,
          badge: r.badge,
          category: r.category,
        })
      );
    } catch {
      /* fall through to mock data */
    }
  }

  // Mock fallback
  let list = [...mockProducts];
  if (categorySlug) list = list.filter((p) => p.category === categorySlug);
  const query = (q ?? "").trim();
  if (query) {
    const matched = new Set(searchMockProducts(query).map((p) => p.slug));
    list = list.filter((p) => matched.has(p.slug));
  }
  return sortMock(list, sort);
}

export async function getProduct(slug: string): Promise<Product | null> {
  const db = getDb();
  if (db) {
    try {
      const r = await db.product.findUnique({
        where: { slug },
        include: productInclude,
      });
      if (r) {
        return toProduct({
          slug: r.slug,
          name: r.name,
          description: r.description,
          details: r.details,
          price: r.price,
          oldPrice: r.oldPrice,
          unit: r.unit,
          rating: r.rating,
          reviewsCount: r.reviewsCount,
          badge: r.badge,
          category: r.category,
        });
      }
    } catch {
      /* fall through to mock data */
    }
  }
  return getMockProduct(slug) ?? null;
}

export async function getRelatedProducts(
  product: Product,
  count = 4
): Promise<Product[]> {
  const db = getDb();
  if (db) {
    try {
      const sameCategory = await db.product.findMany({
        where: { category: { slug: product.category }, NOT: { slug: product.slug } },
        include: productInclude,
        orderBy: { reviewsCount: "desc" },
        take: count,
      });
      let related = sameCategory.map((r) =>
        toProduct({
          slug: r.slug,
          name: r.name,
          description: r.description,
          details: r.details,
          price: r.price,
          oldPrice: r.oldPrice,
          unit: r.unit,
          rating: r.rating,
          reviewsCount: r.reviewsCount,
          badge: r.badge,
          category: r.category,
        })
      );
      if (related.length < count) {
        const others = await db.product.findMany({
          where: {
            NOT: [
              { slug: product.slug },
              { slug: { in: related.map((p) => p.slug) } },
            ],
          },
          include: productInclude,
          orderBy: { reviewsCount: "desc" },
          take: count - related.length,
        });
        related = related.concat(
          others.map((r) =>
            toProduct({
              slug: r.slug,
              name: r.name,
              description: r.description,
              details: r.details,
              price: r.price,
              oldPrice: r.oldPrice,
              unit: r.unit,
              rating: r.rating,
              reviewsCount: r.reviewsCount,
              badge: r.badge,
              category: r.category,
            })
          )
        );
      }
      return related;
    } catch {
      /* fall through to mock data */
    }
  }
  return relatedMockProducts(product, count);
}
