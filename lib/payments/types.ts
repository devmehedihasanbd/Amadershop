/* ------------------------------------------------------------------ */
/*  Payment provider contracts.                                        */
/*                                                                     */
/*  Real gateway calls live in bkash.ts / nagad.ts / rocket.ts.        */
/*  Every provider throws NotConfiguredError when its credentials     */
/*  are missing — we never fake a successful charge.                   */
/* ------------------------------------------------------------------ */

export type PaymentProviderId = "bkash" | "nagad" | "rocket";

export class NotConfiguredError extends Error {
  readonly provider: string;
  readonly missing: string[];

  constructor(provider: string, missing: string[]) {
    super(
      `${provider} is not configured. Missing: ${missing.join(", ")}. ` +
        `Add them in the admin panel (/admin/payments) or as env vars (see .env.example).`
    );
    this.name = "NotConfiguredError";
    this.provider = provider;
    this.missing = missing;
  }
}

export interface CreatePaymentInput {
  orderNumber: string;
  /** Amount in BDT (whole taka). */
  amount: number;
  customerPhone: string;
  customerName: string;
  /** Where the provider should send the customer back after payment. */
  callbackUrl: string;
}

export interface CreatePaymentResult {
  /** Redirect the customer here to complete payment (web checkout flows). */
  paymentUrl?: string;
  /** Provider-side transaction / payment identifier. */
  transactionId: string;
  raw?: unknown;
}

export interface ExecutePaymentInput {
  transactionId: string;
  [key: string]: unknown;
}

export interface ExecutePaymentResult {
  transactionId: string;
  status: "COMPLETED" | "FAILED" | "PENDING";
  amount?: number;
  raw?: unknown;
}

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  executePayment(input: ExecutePaymentInput): Promise<ExecutePaymentResult>;
}

/** Collect the names of env vars that are missing/empty. */
export function missingEnv(names: string[]): string[] {
  return names.filter((n) => !process.env[n]?.trim());
}
