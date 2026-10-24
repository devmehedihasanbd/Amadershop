import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { requireDb } from "@/lib/admin-db";
import { revalidateStorefront } from "@/lib/revalidate";
import { slugify, validateProductInput } from "@/lib/admin-validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const result = requireDb();
  if ("response" in result) return result.response;
  const { db } = result;
  const { id } = await params;

  const product = await db.product.findUnique({
    where: { id },
    include: { category: { select: { slug: true, name: true } } },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
  return NextResponse.json({ product });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const result = requireDb();
  if ("response" in result) return result.response;
  const { db } = result;
  const { id } = await params;

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
  const clash = await db.product.findUnique({ where: { slug }, select: { id: true } });
  if (clash && clash.id !== id) {
    return NextResponse.json(
      { error: "Another product already uses this slug." },
      { status: 409 }
    );
  }

  try {
    const product = await db.product.update({
      where: { id },
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
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const result = requireDb();
  if ("response" in result) return result.response;
  const { db } = result;
  const { id } = await params;

  // Block deletion when the product appears in any order (history must stay intact).
  const used = await db.orderItem.count({ where: { productId: id } });
  if (used > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete: this product appears in ${used} order${used === 1 ? "" : "s"}. Order history must stay intact.`,
      },
      { status: 409 }
    );
  }

  try {
    await db.product.delete({ where: { id } });
    revalidateStorefront();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
}
