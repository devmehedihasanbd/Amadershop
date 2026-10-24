import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireAdminApi } from "@/lib/admin-auth";
import { requireDb } from "@/lib/admin-db";
import { revalidateStorefront } from "@/lib/revalidate";
import { validateBannerInput } from "@/lib/admin-validation";

function toPlacement(value: "hero" | "offer"): Prisma.BannerCreateInput["placement"] {
  return value === "offer" ? "OFFER" : "HERO";
}

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

  const banner = await db.banner.findUnique({ where: { id } });
  if (!banner) {
    return NextResponse.json({ error: "Banner not found." }, { status: 404 });
  }
  return NextResponse.json({ banner });
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

  const { data, errors } = validateBannerInput(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: "Invalid banner.", details: errors }, { status: 400 });
  }

  try {
    const banner = await db.banner.update({
      where: { id },
      data: {
        placement: toPlacement(data.placement),
        eyebrow: data.eyebrow,
        title: data.title,
        subtitle: data.subtitle,
        image: data.image,
        link: data.link,
        linkLabel: data.linkLabel,
        sortOrder: data.sortOrder,
        active: data.active,
      },
    });
    revalidateStorefront();
    return NextResponse.json({ banner });
  } catch {
    return NextResponse.json({ error: "Banner not found." }, { status: 404 });
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
    await db.banner.delete({ where: { id } });
    revalidateStorefront();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Banner not found." }, { status: 404 });
  }
}
