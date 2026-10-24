import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { requireDb } from "@/lib/admin-db";
import {
  MANAGED_SECRET_KEYS,
  MANAGED_TOGGLE_KEYS,
  getCourierStatus,
  getPaymentMethods,
} from "@/lib/site-config";

const SECRET_KEYS = MANAGED_SECRET_KEYS as readonly string[];
const TOGGLE_KEYS = MANAGED_TOGGLE_KEYS as readonly string[];

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const result = requireDb();
  if ("response" in result) return result.response;
  const { db } = result;

  const rows = await db.setting.findMany({
    where: { key: { in: [...SECRET_KEYS, ...TOGGLE_KEYS] } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));

  // For secrets: report whether a value exists (env or DB), never the value.
  const secrets: Record<string, { fromEnv: boolean; saved: boolean }> = {};
  const envOf: Record<string, string> = {
    pay_bkash_app_key: "BKASH_APP_KEY",
    pay_bkash_app_secret: "BKASH_APP_SECRET",
    pay_bkash_username: "BKASH_USERNAME",
    pay_bkash_password: "BKASH_PASSWORD",
    pay_bkash_base_url: "BKASH_BASE_URL",
    pay_nagad_merchant_id: "NAGAD_MERCHANT_ID",
    pay_nagad_merchant_number: "NAGAD_MERCHANT_NUMBER",
    pay_nagad_public_key: "NAGAD_PUBLIC_KEY",
    pay_nagad_private_key: "NAGAD_PRIVATE_KEY",
    pay_nagad_base_url: "NAGAD_BASE_URL",
    courier_steadfast_api_key: "STEADFAST_API_KEY",
    courier_steadfast_secret_key: "STEADFAST_SECRET_KEY",
    courier_steadfast_base_url: "STEADFAST_BASE_URL",
  };
  for (const key of SECRET_KEYS) {
    secrets[key] = {
      fromEnv: Boolean(process.env[envOf[key]]?.trim()),
      saved: Boolean(map.get(key)?.trim()),
    };
  }

  const toggles: Record<string, boolean> = {};
  for (const key of TOGGLE_KEYS) {
    toggles[key] = (map.get(key) ?? (key === "pay_cod_enabled" ? "1" : "0")) === "1";
  }

  const [methods, courier] = await Promise.all([getPaymentMethods(), getCourierStatus()]);

  return NextResponse.json({ secrets, toggles, methods, courier });
}

const MAX_SECRET_LEN = 4000;

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

  // Toggles: strict "1"/"0".
  if (b.toggles && typeof b.toggles === "object") {
    for (const [key, value] of Object.entries(b.toggles as Record<string, unknown>)) {
      if (!(TOGGLE_KEYS as readonly string[]).includes(key)) continue;
      updates.push([key, value ? "1" : "0"]);
    }
  }

  // Secrets: stored as given (trimmed). Empty string clears a saved value
  // so the env var (if any) takes over again.
  if (b.secrets && typeof b.secrets === "object") {
    for (const [key, value] of Object.entries(b.secrets as Record<string, unknown>)) {
      if (!(SECRET_KEYS as readonly string[]).includes(key)) continue;
      const v = String(value ?? "");
      if (v.length > MAX_SECRET_LEN) {
        errors.push(`${key} is too long.`);
      } else {
        updates.push([key, v.trim()]);
      }
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "Invalid payment settings.", details: errors }, { status: 400 });
  }

  for (const [key, value] of updates) {
    await db.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  return NextResponse.json({ ok: true });
}
