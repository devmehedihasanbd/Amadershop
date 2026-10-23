import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { requireDb } from "@/lib/admin-db";
import { slugify, validateCategoryInput } from "@/lib/admin-validation";

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

  const { data, errors } = validateCategoryInput(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: "Invalid category.", details: errors }, { status: 400 });
  }

  const slug = data.slug || slugify(data.name);
  const clash = await db.category.findUnique({ where: { slug }, select: { id: true } });
  if (clash && clash.id !== id) {
    return NextResponse.json(
      { error: "Another category already uses this slug." },
      { status: 409 }
    );
  }

  try {
    const category = await db.category.update({
      where: { id },
      data: {
        slug,
        name: data.name,
        description: data.tagline || null,
        sortOrder: data.sortOrder,
      },
    });
    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
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

  const used = await db.product.count({ where: { categoryId: id } });
  if (used > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete: this category still has ${used} product${used === 1 ? "" : "s"}. Move or delete them first.`,
      },
      { status: 409 }
    );
  }

  try {
    await db.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }
}
