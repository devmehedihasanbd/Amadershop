/* ------------------------------------------------------------------ */
/*  Payments & courier configuration — controllable from the admin      */
/*  panel (/admin/payments), with environment variables as override.   */
/*                                                                     */
/*  Secrets resolve: process.env first, then the Setting table.        */
/*  Toggles live in the Setting table (pay_*_enabled,                  */
/*  courier_steadfast_enabled as "1"/"0").                             */
/* ------------------------------------------------------------------ */

import { getSettingsMap } from "./settings";

/** A secret value: env var wins, then the Setting table, else "". */
export async function getSecret(envName: string, settingKey: string): Promise<string> {
  const fromEnv = process.env[envName]?.trim();
  if (fromEnv) return fromEnv;
  const map = await getSettingsMap();
  return map.get(settingKey)?.trim() ?? "";
}

export type PayMethodId = "cod" | "bkash" | "nagad" | "rocket";

export interface PayMethodStatus {
  id: PayMethodId;
  label: string;
  /** Admin toggle — whether customers may choose it. */
  enabled: boolean;
  /** Credentials present (env or admin panel). COD is always configured. */
  configured: boolean;
}

interface PayDef {
  id: PayMethodId;
  label: string;
  /** [envName, settingKey] pairs, all required for `configured`. */
  creds: Array<[string, string]>;
}

const PAY_DEFS: PayDef[] = [
  { id: "cod", label: "Cash on Delivery", creds: [] },
  {
    id: "bkash",
    label: "bKash",
    creds: [
      ["BKASH_APP_KEY", "pay_bkash_app_key"],
      ["BKASH_APP_SECRET", "pay_bkash_app_secret"],
      ["BKASH_USERNAME", "pay_bkash_username"],
      ["BKASH_PASSWORD", "pay_bkash_password"],
      ["BKASH_BASE_URL", "pay_bkash_base_url"],
    ],
  },
  {
    id: "nagad",
    label: "Nagad",
    creds: [
      ["NAGAD_MERCHANT_ID", "pay_nagad_merchant_id"],
      ["NAGAD_MERCHANT_NUMBER", "pay_nagad_merchant_number"],
      ["NAGAD_PUBLIC_KEY", "pay_nagad_public_key"],
      ["NAGAD_PRIVATE_KEY", "pay_nagad_private_key"],
      ["NAGAD_BASE_URL", "pay_nagad_base_url"],
    ],
  },
  // Rocket has no public merchant API — kept for display/manual handling.
  { id: "rocket", label: "Rocket", creds: [] },
];

const DEFAULT_ENABLED: Record<PayMethodId, boolean> = {
  cod: true,
  bkash: false,
  nagad: false,
  rocket: false,
};

export async function getPaymentMethods(): Promise<PayMethodStatus[]> {
  const map = await getSettingsMap();
  const out: PayMethodStatus[] = [];
  for (const def of PAY_DEFS) {
    let configured = true;
    for (const [env, key] of def.creds) {
      const v = process.env[env]?.trim() || map.get(key)?.trim();
      if (!v) {
        configured = false;
        break;
      }
    }
    const raw = map.get(`pay_${def.id}_enabled`);
    out.push({
      id: def.id,
      label: def.label,
      enabled: raw === undefined ? DEFAULT_ENABLED[def.id] : raw === "1",
      configured,
    });
  }
  return out;
}

export interface CourierStatus {
  id: "steadfast";
  label: string;
  enabled: boolean;
  configured: boolean;
}

export async function getCourierStatus(): Promise<CourierStatus> {
  const map = await getSettingsMap();
  const apiKey =
    process.env.STEADFAST_API_KEY?.trim() ||
    map.get("courier_steadfast_api_key")?.trim() ||
    "";
  const secretKey =
    process.env.STEADFAST_SECRET_KEY?.trim() ||
    map.get("courier_steadfast_secret_key")?.trim() ||
    "";
  return {
    id: "steadfast",
    label: "Steadfast Courier",
    enabled: (map.get("courier_steadfast_enabled") ?? "0") === "1",
    configured: Boolean(apiKey && secretKey),
  };
}

/** All payment/courier secret keys managed in /admin/payments. */
export const MANAGED_SECRET_KEYS = [
  "pay_bkash_app_key",
  "pay_bkash_app_secret",
  "pay_bkash_username",
  "pay_bkash_password",
  "pay_bkash_base_url",
  "pay_nagad_merchant_id",
  "pay_nagad_merchant_number",
  "pay_nagad_public_key",
  "pay_nagad_private_key",
  "pay_nagad_base_url",
  "courier_steadfast_api_key",
  "courier_steadfast_secret_key",
  "courier_steadfast_base_url",
] as const;

export const MANAGED_TOGGLE_KEYS = [
  "pay_cod_enabled",
  "pay_bkash_enabled",
  "pay_nagad_enabled",
  "pay_rocket_enabled",
  "courier_steadfast_enabled",
] as const;
