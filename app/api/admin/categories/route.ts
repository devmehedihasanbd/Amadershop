import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { requireDb } from "@/lib/admin-db";
import { revalidateStorefront } from "@/lib/revalidate";
import { slugify, validateCategoryInput } from "@/lib/admin-validation";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const result = requireDb();
  if ("response" in result) return result.response;
  const { db } = result;

  const categories = await db.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({
    categories: categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      tagline: c.description ?? "",
      image: c.image ?? "",
      sortOrder: c.sortOrder,
      productCount: c._count.products,
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

  const { data, errors } = validateCategoryInput(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: "Invalid category.", details: errors }, { status: 400 });
  }

  const slug = data.slug || slugify(data.name);
  const existing = await db.category.findUnique({ where: { slug }, select: { id: true } });
  if (existing) {
    return NextResponse.json(
      { error: "A category with this slug already exists." },
      { status: 409 }
    );
  }

  const category = await db.category.create({
    data: {
      slug,
      name: data.name,
      description: data.tagline || null,
      image: data.image,
      sortOrder: data.sortOrder,
    },
  });
  revalidateStorefront();
  return NextResponse.json({ category }, { status: 201 });
}
