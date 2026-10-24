/* ------------------------------------------------------------------ */
/*  Steadfast courier integration.                                     */
/*                                                                     */
/*  API: POST {STEADFAST_BASE_URL}/api/v1/create_order                 */
/*  Headers: Api-Key, Secret-Key, Content-Type: application/json       */
/*  Docs: https://portal.steadfast.com.bd (API section)                */
/*                                                                     */
/*  Throws NotConfiguredError when STEADFAST_API_KEY /                 */
/*  STEADFAST_SECRET_KEY are missing. Never called automatically —     */
/*  only via POST /api/courier/steadfast/book after the shop owner    */
/*  confirms the order.                                                */
/* ------------------------------------------------------------------ */

import { getSecret } from "@/lib/site-config";
import { NotConfiguredError } from "../payments/types";

export interface SteadfastOrderInput {
  /** Our order number — becomes Steadfast's invoice reference. */
  invoice: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  /** Cash to collect on delivery (BDT). 0 for prepaid orders. */
  codAmount: number;
  note?: string;
}

export interface SteadfastBooking {
  consignmentId: string;
  trackingCode: string;
  invoice: string;
  raw: unknown;
}

async function config() {
  const apiKey = await getSecret("STEADFAST_API_KEY", "courier_steadfast_api_key");
  const secretKey = await getSecret("STEADFAST_SECRET_KEY", "courier_steadfast_secret_key");
  const missing = [
    !apiKey && "STEADFAST_API_KEY",
    !secretKey && "STEADFAST_SECRET_KEY",
  ].filter(Boolean) as string[];
  if (missing.length > 0) throw new NotConfiguredError("Steadfast", missing);
  const baseUrl = await getSecret("STEADFAST_BASE_URL", "courier_steadfast_base_url");
  return {
    apiKey,
    secretKey,
    baseUrl: (baseUrl || "https://portal.steadfast.com.bd").replace(/\/$/, ""),
  };
}

export async function bookSteadfastConsignment(
  input: SteadfastOrderInput
): Promise<SteadfastBooking> {
  const c = await config();

  const res = await fetch(`${c.baseUrl}/api/v1/create_order`, {
    method: "POST",
    headers: {
      "Api-Key": c.apiKey,
      "Secret-Key": c.secretKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      invoice: input.invoice,
      recipient_name: input.recipientName,
      recipient_phone: input.recipientPhone,
      recipient_address: input.recipientAddress,
      cod_amount: input.codAmount,
      note: input.note ?? "",
    }),
  });

  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !data || (data.status !== 200 && data.status !== "200")) {
    throw new Error(
      `Steadfast create_order failed: ${JSON.stringify(data ?? { httpStatus: res.status })}`
    );
  }

  const consignment = (data.consignment ?? {}) as Record<string, unknown>;
  const consignmentId = String(consignment.consignment_id ?? "");
  const trackingCode = String(
    consignment.tracking_code ?? consignment.consignment_id ?? ""
  );
  if (!consignmentId) {
    throw new Error(
      `Steadfast response missing consignment_id: ${JSON.stringify(data)}`
    );
  }

  return { consignmentId, trackingCode, invoice: input.invoice, raw: data };
}
