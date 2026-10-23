/* ------------------------------------------------------------------ */
/*  Promotional codes.                                                  */
/*                                                                     */
/*  The server (lib/orders.ts) is the source of truth: it re-validates */
/*  every code and computes the discount from server-side prices.      */
/*  This module is shared so the checkout page can show a live         */
/*  estimate before placing the order.                                 */
/* ------------------------------------------------------------------ */

export interface PromoRule {
  /** percent off the subtotal, e.g. 10 = 10% */
  percent: number;
  /** minimum subtotal (taka) required for the code to apply */
  minOrder: number;
  /** maximum discount (taka) the code can give */
  maxDiscount: number;
  /** short human-readable label for the UI */
  label: string;
}

/**
 * Hardcoded fallback rules. Used when the database is unavailable
 * (and during `next build`). Mirrors the seeded AMADER10 promo.
 */
export const PROMOS: Record<string, PromoRule> = {
  AMADER10: {
    percent: 10,
    minOrder: 500,
    maxDiscount: 500,
    label: "10% off your first order",
  },
};

/** Normalize user input: trim + uppercase. */
export function normalizePromoCode(raw: string): string {
  return (raw ?? "").trim().toUpperCase();
}

export interface PromoResult {
  code: string;
  discount: number;
}

function applyWithRules(
  rules: Record<string, PromoRule>,
  rawCode: string | null | undefined,
  subtotal: number
): PromoResult | null {
  const code = normalizePromoCode(rawCode ?? "");
  if (!code) return null;
  const rule = rules[code];
  if (!rule) return null;
  if (subtotal < rule.minOrder) return null;
  const discount = Math.min(
    Math.floor((subtotal * rule.percent) / 100),
    rule.maxDiscount
  );
  if (discount <= 0) return null;
  return { code, discount };
}

/**
 * Validate a promo code against a subtotal and return the discount.
 * Returns null when the code is missing, unknown, or the subtotal
 * is below the minimum order value.
 *
 * Sync version using the hardcoded fallback rules — safe for
 * client-side live estimates in checkout.
 */
export function applyPromo(
  rawCode: string | null | undefined,
  subtotal: number
): PromoResult | null {
  return applyWithRules(PROMOS, rawCode, subtotal);
}

/**
 * Async version that reads ACTIVE promos from the database first,
 * falling back to the hardcoded rules when the DB is unavailable.
 * This is the server source of truth (used by lib/orders.ts).
 */
import { getDb } from "./db";

export async function getPromoRules(): Promise<Record<string, PromoRule>> {
  const db = getDb();
  if (db) {
    try {
      const rows = await db.promo.findMany({ where: { active: true } });
      if (rows.length > 0) {
        const rules: Record<string, PromoRule> = {};
        for (const r of rows) {
          rules[r.code.toUpperCase()] = {
            percent: r.percent,
            minOrder: r.minOrder,
            maxDiscount: r.maxDiscount,
            label: `${r.percent}% off`,
          };
        }
        return rules;
      }
    } catch {
      /* fall through to hardcoded rules */
    }
  }
  return PROMOS;
}

/** Server-side promo validation against live database rules. */
export async function applyPromoAsync(
  rawCode: string | null | undefined,
  subtotal: number
): Promise<PromoResult | null> {
  const rules = await getPromoRules();
  return applyWithRules(rules, rawCode, subtotal);
}
