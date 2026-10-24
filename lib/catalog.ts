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
  images: unknown;
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
  const images = toStringArray(row.images);
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
    ...(images.length > 0 ? { images } : {}),
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
  /** Fetch only these slugs (used by the cart to resolve DB products). */
  slugs?: string[];
}

export async function getProducts(opts: GetProductsOptions = {}): Promise<Product[]> {
  const { categorySlug, q, sort = "popular", slugs } = opts;
  const db = getDb();

  if (db) {
    try {
      const query = (q ?? "").trim();
      const rows = await db.product.findMany({
        where: {
          ...(categorySlug
            ? { category: { slug: categorySlug } }
            : {}),
          ...(slugs && slugs.length > 0 ? { slug: { in: slugs } } : {}),
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
          images: r.images,
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
  if (slugs && slugs.length > 0) {
    const wanted = new Set(slugs);
    list = list.filter((p) => wanted.has(p.slug));
  }
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
          images: r.images,
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
          images: r.images,
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
              images: r.images,
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

/* ------------------------- homepage sections ------------------------ */

export interface CategoryWithDetails {
  slug: string;
  name: string;
  tagline: string;
  productCount: number;
  image?: string;
}

/** Categories with live product counts + a representative photo. */
export async function getCategoriesWithDetails(): Promise<CategoryWithDetails[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = await db.category.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          _count: { select: { products: true } },
          products: { select: { images: true }, take: 1 },
        },
      });
      if (rows.length > 0) {
        return rows.map((r) => {
          const imgs = toStringArray(r.products[0]?.images);
          return {
            slug: r.slug,
            name: r.name,
            tagline: r.description ?? "",
            productCount: r._count.products,
            ...(imgs.length > 0 ? { image: imgs[0] } : {}),
          };
        });
      }
    } catch {
      /* fall through to mock data */
    }
  }
  return mockCategories.map((c) => ({
    slug: c.slug,
    name: c.name,
    tagline: "",
    productCount: mockProducts.filter((p) => p.category === c.slug).length,
  }));
}

type DbRow = {
  slug: string; name: string; description: string; details: unknown;
  price: number; oldPrice: number | null; unit: string; rating: number;
  reviewsCount: number; badge: string | null; images: unknown;
  category: { slug: string };
};

function mapRows(rows: DbRow[]): Product[] {
  return rows.map((r) =>
    toProduct({
      slug: r.slug, name: r.name, description: r.description,
      details: r.details, price: r.price, oldPrice: r.oldPrice,
      unit: r.unit, rating: r.rating, reviewsCount: r.reviewsCount,
      badge: r.badge, images: r.images, category: r.category,
    })
  );
}

/** Top sellers by actual units sold (falls back to the badge). */
export async function getBestSellers(limit = 8): Promise<Product[]> {
  const db = getDb();
  if (db) {
    try {
      const grouped = await db.orderItem.groupBy({
        by: ["productId"],
        _sum: { qty: true },
        where: { order: { status: { not: "CANCELLED" } } },
        orderBy: { _sum: { qty: "desc" } },
        take: limit,
      });
      if (grouped.length > 0) {
        const ids = grouped.map((g) => g.productId);
        const rows = await db.product.findMany({
          where: { id: { in: ids } },
          include: productInclude,
        });
        const byId = new Map(rows.map((r) => [r.id, r]));
        const ordered = ids
          .map((id) => byId.get(id))
          .filter((r): r is (typeof rows)[number] => Boolean(r));
        return mapRows(ordered);
      }
      const badged = await db.product.findMany({
        where: { badge: "best-selling" },
        include: productInclude,
        take: limit,
      });
      if (badged.length > 0) return mapRows(badged);
    } catch {
      /* fall through to mock data */
    }
  }
  return mockProducts.filter((p) => p.badge === "best-selling").slice(0, limit);
}

/** Newest products first. */
export async function getNewArrivals(limit = 8): Promise<Product[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = await db.product.findMany({
        include: productInclude,
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      if (rows.length > 0) return mapRows(rows);
    } catch {
      /* fall through to mock data */
    }
  }
  return mockProducts.filter((p) => p.badge === "new").slice(0, limit);
}

/** Highest rated products. */
export async function getTopRated(limit = 8): Promise<Product[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = await db.product.findMany({
        include: productInclude,
        orderBy: [{ rating: "desc" }, { reviewsCount: "desc" }],
        take: limit,
      });
      if (rows.length > 0) return mapRows(rows);
    } catch {
      /* fall through to mock data */
    }
  }
  return [...mockProducts].sort((a, b) => b.rating - a.rating).slice(0, limit);
}

/** Discounted products (oldPrice set) — powers the flash sale. */
export async function getFlashSaleProducts(limit = 8): Promise<Product[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = await db.product.findMany({
        where: { oldPrice: { not: null } },
        include: productInclude,
        take: limit,
      });
      if (rows.length > 0) return mapRows(rows);
    } catch {
      /* fall through to mock data */
    }
  }
  return mockProducts.filter((p) => p.oldPrice).slice(0, limit);
}
