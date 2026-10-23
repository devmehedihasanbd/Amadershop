/* ------------------------------------------------------------------ */
/*  Nagad checkout integration (skeleton — real flow).                */
/*                                                                     */
/*  Flow (Nagad PG v2):                                                */
/*    1. Encrypt sensitiveData with the PG public key (RSA), sign the  */
/*       request with the merchant private key.                        */
/*    2. POST {BASE}/api/dfs/check-out/initialize/{merchantId}/{id}    */
/*       with dateTime, sensitiveData, signature → returns paymentRefId */
/*       + callBackUrl.                                                */
/*    3. Customer completes payment on the returned callBackUrl; Nagad  */
/*       redirects to our callbackUrl with paymentRefId.               */
/*    4. POST {BASE}/api/dfs/verify/payment/{paymentRefId} to confirm. */
/*                                                                     */
/*  TODO (before going live):                                          */
/*    - Complete Nagad merchant onboarding; fill NAGAD_* in .env.      */
/*    - Implement RSA encrypt/sign with node:crypto (keys are PEM).    */
/*    - NAGAD_BASE_URL sandbox: http://sandbox.mynagad.com:10080       */
/*      live: https://api.mynagad.com (confirm with Nagad docs).       */
/*    - Wire /api/payments/nagad/callback to executePayment().        */
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
  "NAGAD_MERCHANT_ID",
  "NAGAD_MERCHANT_NUMBER",
  "NAGAD_PUBLIC_KEY",
  "NAGAD_PRIVATE_KEY",
  "NAGAD_BASE_URL",
];

function config() {
  const missing = missingEnv(REQUIRED_ENV);
  if (missing.length > 0) throw new NotConfiguredError("Nagad", missing);
  return {
    merchantId: process.env.NAGAD_MERCHANT_ID!.trim(),
    merchantNumber: process.env.NAGAD_MERCHANT_NUMBER!.trim(),
    publicKey: process.env.NAGAD_PUBLIC_KEY!.trim(),
    privateKey: process.env.NAGAD_PRIVATE_KEY!.trim(),
    baseUrl: process.env.NAGAD_BASE_URL!.trim().replace(/\/$/, ""),
  };
}

class NagadProvider implements PaymentProvider {
  readonly id = "nagad" as const;

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const c = config();

    // TODO: build the real initialize payload:
    //   const sensitiveData = { merchantId, datetime, orderId, challenge };
    //   1. RSA-encrypt sensitiveData with NAGAD_PUBLIC_KEY
    //   2. Sign (encryptedData + merchantId) with NAGAD_PRIVATE_KEY
    //   3. POST /api/dfs/check-out/initialize/{merchantId}/{orderId}
    // For now we stop here instead of faking a payment URL.
    void c;
    void input;
    throw new Error(
      "Nagad initialize() is not implemented yet: RSA encrypt/sign the " +
        "sensitiveData payload and POST /api/dfs/check-out/initialize. " +
        "See the TODO at the top of lib/payments/nagad.ts."
    );
  }

  async executePayment(input: ExecutePaymentInput): Promise<ExecutePaymentResult> {
    const c = config();

    // TODO: verify the payment server-side:
    //   POST {BASE}/api/dfs/verify/payment/{paymentRefId}
    //   with X-KM-IP-V4 / X-KM-Client-Type headers per Nagad docs,
    //   then map the response status to COMPLETED / FAILED / PENDING.
    void c;
    void input;
    throw new Error(
      "Nagad executePayment() is not implemented yet: call " +
        "/api/dfs/verify/payment/{paymentRefId}. " +
        "See the TODO at the top of lib/payments/nagad.ts."
    );
  }
}

export const nagadProvider: PaymentProvider = new NagadProvider();
