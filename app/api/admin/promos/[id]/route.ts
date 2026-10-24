import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { requireDb } from "@/lib/admin-db";
import { revalidateStorefront } from "@/lib/revalidate";
import { validatePromoInput } from "@/lib/admin-validation";

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

  const { data, errors } = validatePromoInput(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: "Invalid promo.", details: errors }, { status: 400 });
  }

  const clash = await db.promo.findUnique({
    where: { code: data.code },
    select: { id: true },
  });
  if (clash && clash.id !== id) {
    return NextResponse.json(
      { error: "Another promo already uses this code." },
      { status: 409 }
    );
  }

  try {
    const promo = await db.promo.update({ where: { id }, data });
    revalidateStorefront();
    return NextResponse.json({ promo });
  } catch {
    return NextResponse.json({ error: "Promo not found." }, { status: 404 });
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

  try {
    await db.promo.delete({ where: { id } });
    revalidateStorefront();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Promo not found." }, { status: 404 });
  }
}
