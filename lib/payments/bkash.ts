/* ------------------------------------------------------------------ */
/*  bKash Tokenized Checkout integration (skeleton — real flow).       */
/*                                                                     */
/*  Flow:                                                              */
/*    1. Grant token  → POST {BASE}/tokenized/checkout/token/grant     */
/*    2. Create       → POST {BASE}/tokenized/checkout/create          */
/*                      (returns paymentID + bkashURL)                 */
/*    3. Customer pays at bkashURL, bKash redirects to callbackUrl     */
/*    4. Execute      → POST {BASE}/tokenized/checkout/execute         */
/*                                                                     */
/*  TODO (before going live):                                          */
/*    - Fill BKASH_* vars in .env from the bKash merchant dashboard.   */
/*    - Use BKASH_BASE_URL=https://tokenized.pay.bka.sh/v1.2.0-beta    */
/*      (sandbox) or https://tokenized.pay.bka.sh/v1.2.0-beta → live   */
/*      endpoint supplied by bKash at onboarding.                      */
/*    - Persist the id_token per request (it expires); add retries.    */
/*    - Wire /api/payments/bkash/callback to executePayment().         */
/* ------------------------------------------------------------------ */

import {
  NotConfiguredError,
  missingEnv,
  type CreatePaymentInput,
  type CreatePaymentResult,
  type ExecutePaymentInput,
  type ExecutePaymentResult,
  type PaymentProvider,
} from "./types";

const REQUIRED_ENV = [
  "BKASH_APP_KEY",
  "BKASH_APP_SECRET",
  "BKASH_USERNAME",
  "BKASH_PASSWORD",
  "BKASH_BASE_URL",
];

function config() {
  const missing = missingEnv(REQUIRED_ENV);
  if (missing.length > 0) throw new NotConfiguredError("bKash", missing);
  return {
    appKey: process.env.BKASH_APP_KEY!.trim(),
    appSecret: process.env.BKASH_APP_SECRET!.trim(),
    username: process.env.BKASH_USERNAME!.trim(),
    password: process.env.BKASH_PASSWORD!.trim(),
    baseUrl: process.env.BKASH_BASE_URL!.trim().replace(/\/$/, ""),
  };
}

async function bkashFetch(
  baseUrl: string,
  path: string,
  idToken: string | null,
  appKey: string,
  body: unknown
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-APP-Key": appKey,
  };
  if (idToken) headers.Authorization = idToken;
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !data || data.statusCode !== "0000") {
    throw new Error(
      `bKash API error at ${path}: ${JSON.stringify(data ?? { httpStatus: res.status })}`
    );
  }
  return data;
}

class BkashProvider implements PaymentProvider {
  readonly id = "bkash" as const;

  private async grantToken(): Promise<string> {
    const c = config();
    const data = await bkashFetch(c.baseUrl, "/tokenized/checkout/token/grant", null, c.appKey, {
      app_key: c.appKey,
      app_secret: c.appSecret,
    });
    const idToken = data.id_token as string | undefined;
    if (!idToken) throw new Error("bKash token grant did not return id_token");
    return idToken;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const c = config();
    const idToken = await this.grantToken();
    const data = await bkashFetch(
      c.baseUrl,
      "/tokenized/checkout/create",
      idToken,
      c.appKey,
      {
        mode: "0011", // 0011 = checkout (one-time)
        payerReference: input.customerPhone,
        callbackURL: input.callbackUrl,
        amount: String(input.amount),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: input.orderNumber,
      }
    );
    const paymentID = data.paymentID as string | undefined;
    const bkashURL = data.bkashURL as string | undefined;
    if (!paymentID || !bkashURL) {
      throw new Error("bKash create did not return paymentID/bkashURL");
    }
    return { paymentUrl: bkashURL, transactionId: paymentID, raw: data };
  }

  async executePayment(input: ExecutePaymentInput): Promise<ExecutePaymentResult> {
    const c = config();
    const idToken = await this.grantToken();
    const data = await bkashFetch(
      c.baseUrl,
      "/tokenized/checkout/execute",
      idToken,
      c.appKey,
      { paymentID: input.transactionId }
    );
    const status = (data.transactionStatus as string) ?? "";
    return {
      transactionId: input.transactionId,
      status:
        status === "Completed"
          ? "COMPLETED"
          : status === "Failed" || status === "Cancelled"
            ? "FAILED"
            : "PENDING",
      amount: data.amount ? Number(data.amount) : undefined,
      raw: data,
    };
  }
}

export const bkashProvider: PaymentProvider = new BkashProvider();
