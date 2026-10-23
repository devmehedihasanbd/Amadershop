/* ------------------------------------------------------------------ */
/*  Storefront settings (announcement bar, delivery charges).          */
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
}

export const DEFAULT_SETTINGS: StoreSettings = {
  announcement: "",
  deliveryCharge: 60,
  freeDeliveryThreshold: 2000,
};

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export async function getSettings(): Promise<StoreSettings> {
  const db = getDb();
  if (db) {
    try {
      const rows = await db.setting.findMany();
      if (rows.length > 0) {
        const map = new Map(rows.map((r) => [r.key, r.value]));
        return {
          announcement: map.get("announcement") ?? DEFAULT_SETTINGS.announcement,
          deliveryCharge: parsePositiveInt(
            map.get("delivery_charge"),
            DEFAULT_SETTINGS.deliveryCharge
          ),
          freeDeliveryThreshold: parsePositiveInt(
            map.get("free_delivery_threshold"),
            DEFAULT_SETTINGS.freeDeliveryThreshold
          ),
        };
      }
    } catch {
      /* fall through to defaults */
    }
  }
  return { ...DEFAULT_SETTINGS };
}
