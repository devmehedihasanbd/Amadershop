import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { requireDb } from "@/lib/admin-db";
import { getSettings } from "@/lib/settings";
import { validateOneImage } from "@/lib/admin-validation";

const KNOWN_KEYS = [
  "announcement",
  "delivery_charge",
  "free_delivery_threshold",
  "store_name",
  "store_tagline",
  "logo_image",
  "contact_phone",
  "contact_whatsapp",
  "contact_email",
  "store_address",
  "open_hours",
  "facebook_url",
  "instagram_url",
  "footer_about",
] as const;

function isHttpsUrl(v: string): boolean {
  return /^https:\/\/[^\s]+$/i.test(v) && v.length <= 500;
}

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const result = requireDb();
  if ("response" in result) return result.response;

  const s = await getSettings();
  return NextResponse.json({
    settings: {
      announcement: s.announcement,
      delivery_charge: String(s.deliveryCharge),
      free_delivery_threshold: String(s.freeDeliveryThreshold),
      store_name: s.storeName,
      store_tagline: s.storeTagline,
      logo_image: s.logoImage,
      contact_phone: s.contactPhone,
      contact_whatsapp: s.contactWhatsapp,
      contact_email: s.contactEmail,
      store_address: s.storeAddress,
      open_hours: s.openHours,
      facebook_url: s.facebookUrl,
      instagram_url: s.instagramUrl,
      footer_about: s.footerAbout,
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

  const maxLen = (key: string, v: string, max: number, label: string) => {
    if (v.length > max) errors.push(`${label} must be ${max} characters or fewer.`);
    else updates.push([key, v.trim()]);
  };

  if ("announcement" in b) {
    maxLen("announcement", String(b.announcement ?? ""), 200, "Announcement");
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
  if ("store_name" in b) {
    const v = String(b.store_name ?? "").trim();
    if (!v) errors.push("Store name is required.");
    else if (v.length > 60) errors.push("Store name must be 60 characters or fewer.");
    else updates.push(["store_name", v]);
  }
  if ("store_tagline" in b) {
    maxLen("store_tagline", String(b.store_tagline ?? ""), 120, "Tagline");
  }
  if ("logo_image" in b) {
    const v = String(b.logo_image ?? "").trim();
    const err = validateOneImage(v);
    if (err) errors.push(err);
    else updates.push(["logo_image", v]);
  }
  if ("contact_phone" in b) {
    maxLen("contact_phone", String(b.contact_phone ?? ""), 25, "Phone");
  }
  if ("contact_whatsapp" in b) {
    maxLen("contact_whatsapp", String(b.contact_whatsapp ?? ""), 25, "WhatsApp number");
  }
  if ("contact_email" in b) {
    const v = String(b.contact_email ?? "").trim();
    if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      errors.push("Email address looks invalid.");
    } else if (v.length > 120) {
      errors.push("Email must be 120 characters or fewer.");
    } else {
      updates.push(["contact_email", v]);
    }
  }
  if ("store_address" in b) {
    maxLen("store_address", String(b.store_address ?? ""), 300, "Address");
  }
  if ("open_hours" in b) {
    maxLen("open_hours", String(b.open_hours ?? ""), 120, "Opening hours");
  }
  for (const key of ["facebook_url", "instagram_url"] as const) {
    if (key in b) {
      const v = String(b[key] ?? "").trim();
      if (v && !isHttpsUrl(v)) {
        errors.push(`${key === "facebook_url" ? "Facebook" : "Instagram"} URL must start with https://`);
      } else {
        updates.push([key, v]);
      }
    }
  }
  if ("footer_about" in b) {
    maxLen("footer_about", String(b.footer_about ?? ""), 500, "About text");
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

  const s = await getSettings();
  return NextResponse.json({
    settings: {
      announcement: s.announcement,
      delivery_charge: String(s.deliveryCharge),
      free_delivery_threshold: String(s.freeDeliveryThreshold),
      store_name: s.storeName,
      store_tagline: s.storeTagline,
      logo_image: s.logoImage,
      contact_phone: s.contactPhone,
      contact_whatsapp: s.contactWhatsapp,
      contact_email: s.contactEmail,
      store_address: s.storeAddress,
      open_hours: s.openHours,
      facebook_url: s.facebookUrl,
      instagram_url: s.instagramUrl,
      footer_about: s.footerAbout,
    },
  });
}
