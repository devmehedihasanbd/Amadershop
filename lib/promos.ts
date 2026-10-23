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

/**
 * Validate a promo code against a subtotal and return the discount.
 * Returns null when the code is missing, unknown, or the subtotal
 * is below the minimum order value.
 */
export function applyPromo(
  rawCode: string | null | undefined,
  subtotal: number
): PromoResult | null {
  const code = normalizePromoCode(rawCode ?? "");
  if (!code) return null;
  const rule = PROMOS[code];
  if (!rule) return null;
  if (subtotal < rule.minOrder) return null;
  const discount = Math.min(
    Math.floor((subtotal * rule.percent) / 100),
    rule.maxDiscount
  );
  if (discount <= 0) return null;
  return { code, discount };
}
