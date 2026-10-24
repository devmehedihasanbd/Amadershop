import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * Public banner feed for the storefront (hero slider + offer cards).
 * Only active banners, ordered for display. When the DB has none,
 * the UI falls back to its built-in slides.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placementParam = (searchParams.get("placement") ?? "").toLowerCase();
  const placement = placementParam === "offer" ? "OFFER" : placementParam === "hero" ? "HERO" : undefined;

  const db = getDb();
  if (!db) return NextResponse.json({ banners: [] });

  try {
    const banners = await db.banner.findMany({
      where: {
        active: true,
        ...(placement ? { placement } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        placement: true,
        eyebrow: true,
        title: true,
        subtitle: true,
        image: true,
        link: true,
        linkLabel: true,
      },
    });
    return NextResponse.json({
      banners: banners.map((b) => ({ ...b, placement: b.placement.toLowerCase() })),
    });
  } catch {
    return NextResponse.json({ banners: [] });
  }
}
