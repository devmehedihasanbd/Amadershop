/* ------------------------------------------------------------------ */
/*  Storefront settings — everything editable from /admin/settings.    */
/*                                                                     */
/*  Stored in the Setting table; falls back to sane defaults when the  */
/*  database is not configured (or during `next build`, when getDb()   */
/*  intentionally returns null).                                       */
/* ------------------------------------------------------------------ */

import { getDb } from "./db";

export interface StoreSettings {
  /** Text for the slim announcement bar; empty string = hidden. */
  announcement: string;
  /** Delivery fee in taka when the order is below the free threshold. */
  deliveryCharge: number;
  /** Subtotal (taka) at or above which delivery is free. */
  freeDeliveryThreshold: number;
  /** Store identity */
  storeName: string;
  storeTagline: string;
  /** Logo image (data-URL or https URL); empty = built-in basket icon. */
  logoImage: string;
  /** Contact */
  contactPhone: string;
  contactWhatsapp: string;
  contactEmail: string;
  storeAddress: string;
  openHours: string;
  /** Social */
  facebookUrl: string;
  instagramUrl: string;
  footerAbout: string;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  announcement: "",
  deliveryCharge: 60,
  freeDeliveryThreshold: 2000,
  storeName: "Amader Shop",
  storeTagline: "খাঁটি দেশি পণ্য, ঘরে বসে",
  logoImage: "",
  contactPhone: "+880 9600-000000",
  contactWhatsapp: "",
  contactEmail: "hello@amadershop.example",
  storeAddress: "House 12, Road 5, Dhanmondi,\nDhaka 1205, Bangladesh",
  openHours: "Open every day, 9am – 10pm",
  facebookUrl: "",
  instagramUrl: "",
  footerAbout: "",
};

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Raw key→value map of the Setting table (empty when DB unavailable). */
export async function getSettingsMap(): Promise<Map<string, string>> {
  const db = getDb();
  if (!db) return new Map();
  try {
    const rows = await db.setting.findMany();
    return new Map(rows.map((r) => [r.key, r.value]));
  } catch {
    return new Map();
  }
}

function str(map: Map<string, string>, key: string, fallback: string): string {
  const v = map.get(key);
  return v === undefined ? fallback : v;
}

export async function getSettings(): Promise<StoreSettings> {
  const map = await getSettingsMap();
  const d = DEFAULT_SETTINGS;
  return {
    announcement: str(map, "announcement", d.announcement),
    deliveryCharge: parsePositiveInt(map.get("delivery_charge"), d.deliveryCharge),
    freeDeliveryThreshold: parsePositiveInt(
      map.get("free_delivery_threshold"),
      d.freeDeliveryThreshold
    ),
    storeName: str(map, "store_name", d.storeName),
    storeTagline: str(map, "store_tagline", d.storeTagline),
    logoImage: str(map, "logo_image", d.logoImage),
    contactPhone: str(map, "contact_phone", d.contactPhone),
    contactWhatsapp: str(map, "contact_whatsapp", d.contactWhatsapp),
    contactEmail: str(map, "contact_email", d.contactEmail),
    storeAddress: str(map, "store_address", d.storeAddress),
    openHours: str(map, "open_hours", d.openHours),
    facebookUrl: str(map, "facebook_url", d.facebookUrl),
    instagramUrl: str(map, "instagram_url", d.instagramUrl),
    footerAbout: str(map, "footer_about", d.footerAbout),
  };
}
