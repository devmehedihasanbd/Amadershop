import { NextResponse } from "next/server";
import type { PaymentProviderId } from "@/lib/payments/types";

const PROVIDERS: PaymentProviderId[] = ["bkash", "nagad", "rocket"];

/**
 * Provider redirect target after the customer pays on the provider's site.
 *
 * TODO: verify the payment server-side here (bkash execute, Nagad verify,
 * aggregator webhook for Rocket), mark the Order PAID in the database,
 * then redirect the customer to /order/<orderNumber>/success.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  if (!PROVIDERS.includes(provider as PaymentProviderId)) {
    return NextResponse.json(
      { error: `Unknown payment provider: ${provider}.` },
      { status: 404 }
    );
  }
  return NextResponse.json(
    {
      error: "PROVIDER_NOT_CONFIGURED",
      message:
        `Online ${provider} payment is not configured yet. ` +
        `See lib/payments/${provider}.ts for the verification flow to implement.`,
    },
    { status: 501 }
  );
}
