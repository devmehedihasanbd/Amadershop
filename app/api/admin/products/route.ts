import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireAdminApi } from "@/lib/admin-auth";
import { requireDb } from "@/lib/admin-db";
import { revalidateStorefront } from "@/lib/revalidate";
import { slugify, validateProductInput } from "@/lib/admin-validation";

export async function GET(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const result = requireDb();
  if ("response" in result) return result.response;
  const { db } = result;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const category = (searchParams.get("category") ?? "").trim();

  const where: Prisma.ProductWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }
  if (category) where.category = { slug: category };

  const products = await db.product.findMany({
    where,
    include: { category: { select: { slug: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      price: p.price,
      oldPrice: p.oldPrice,
      unit: p.unit,
      stock: p.stock,
      badge: p.badge,
      rating: p.rating,
      imageCount: p.images.length,
    })),
  });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const result = requireDb();
  if ("response" in result) return result.response;
  const { db } = result;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { data, errors } = validateProductInput(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: "Invalid product.", details: errors }, { status: 400 });
  }

  const category = await db.category.findUnique({
    where: { slug: data.categorySlug },
    select: { id: true },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 400 });
  }

  const slug = data.slug || slugify(data.name);
  const existing = await db.product.findUnique({ where: { slug }, select: { id: true } });
  if (existing) {
    return NextResponse.json(
      { error: "A product with this slug already exists." },
      { status: 409 }
    );
  }

  const product = await db.product.create({
    data: {
      slug,
      name: data.name,
      description: data.description,
      details: data.details,
      price: data.price,
      oldPrice: data.oldPrice,
      unit: data.unit,
      stock: data.stock,
      badge: data.badge,
      rating: data.rating,
      images: data.images,
      categoryId: category.id,
    },
  });
  revalidateStorefront();
  return NextResponse.json({ product }, { status: 201 });
}
