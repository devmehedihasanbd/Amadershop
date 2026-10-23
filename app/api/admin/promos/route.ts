import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { requireDb } from "@/lib/admin-db";
import { validatePromoInput } from "@/lib/admin-validation";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const result = requireDb();
  if ("response" in result) return result.response;
  const { db } = result;

  const promos = await db.promo.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ promos });
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

  const { data, errors } = validatePromoInput(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: "Invalid promo.", details: errors }, { status: 400 });
  }

  const existing = await db.promo.findUnique({
    where: { code: data.code },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A promo with this code already exists." },
      { status: 409 }
    );
  }

  const promo = await db.promo.create({ data });
  return NextResponse.json({ promo }, { status: 201 });
}
