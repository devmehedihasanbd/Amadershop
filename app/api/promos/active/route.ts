import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * Public: the single best active promo, for the welcome popup.
 * Highest percent wins; ties break by oldest first.
 * Returns { promo: null } when promos are unavailable.
 */
export async function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ promo: null });

  try {
    const promo = await db.promo.findFirst({
      where: { active: true },
      orderBy: [{ percent: "desc" }, { createdAt: "asc" }],
      select: { code: true, percent: true, minOrder: true, maxDiscount: true },
    });
    return NextResponse.json({ promo });
  } catch {
    return NextResponse.json({ promo: null });
  }
}
