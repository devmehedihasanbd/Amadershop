import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { requireDb } from "@/lib/admin-db";
import { DEFAULT_SETTINGS } from "@/lib/settings";

const KNOWN_KEYS = ["announcement", "delivery_charge", "free_delivery_threshold"] as const;

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const result = requireDb();
  if ("response" in result) return result.response;
  const { db } = result;

  const rows = await db.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return NextResponse.json({
    settings: {
      announcement: map.get("announcement") ?? DEFAULT_SETTINGS.announcement,
      delivery_charge: map.get("delivery_charge") ?? String(DEFAULT_SETTINGS.deliveryCharge),
      free_delivery_threshold:
        map.get("free_delivery_threshold") ?? String(DEFAULT_SETTINGS.freeDeliveryThreshold),
    },
  });
}

export async function PUT(request: Request) {
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
  const b = (body ?? {}) as Record<string, unknown>;
  const errors: string[] = [];
  const updates: Array<[string, string]> = [];

  if ("announcement" in b) {
    const v = String(b.announcement ?? "");
    if (v.length > 200) errors.push("Announcement must be 200 characters or fewer.");
    else updates.push(["announcement", v.trim()]);
  }
  for (const key of ["delivery_charge", "free_delivery_threshold"] as const) {
    if (key in b) {
      const n = Number(b[key]);
      if (!Number.isInteger(n) || n < 0 || n > 100000) {
        errors.push(`${key} must be a whole number of taka (0 – 100,000).`);
      } else {
        updates.push([key, String(n)]);
      }
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "Invalid settings.", details: errors }, { status: 400 });
  }
  // Ignore unknown keys silently (forward-compatible).
  const known = updates.filter(([k]) => (KNOWN_KEYS as readonly string[]).includes(k));
  for (const [key, value] of known) {
    await db.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  const rows = await db.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return NextResponse.json({
    settings: {
      announcement: map.get("announcement") ?? DEFAULT_SETTINGS.announcement,
      delivery_charge: map.get("delivery_charge") ?? String(DEFAULT_SETTINGS.deliveryCharge),
      free_delivery_threshold:
        map.get("free_delivery_threshold") ?? String(DEFAULT_SETTINGS.freeDeliveryThreshold),
    },
  });
}
