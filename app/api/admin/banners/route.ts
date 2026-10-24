import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireAdminApi } from "@/lib/admin-auth";
import { requireDb } from "@/lib/admin-db";
import { revalidateStorefront } from "@/lib/revalidate";
import { validateBannerInput } from "@/lib/admin-validation";

function toPlacement(value: "hero" | "offer"): Prisma.BannerCreateInput["placement"] {
  return value === "offer" ? "OFFER" : "HERO";
}

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const result = requireDb();
  if ("response" in result) return result.response;
  const { db } = result;

  const banners = await db.banner.findMany({
    orderBy: [{ placement: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ banners });
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

  const { data, errors } = validateBannerInput(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: "Invalid banner.", details: errors }, { status: 400 });
  }

  const banner = await db.banner.create({
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
  return NextResponse.json({ banner }, { status: 201 });
}
