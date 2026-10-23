import { NextResponse } from "next/server";
import type { PaymentProviderId } from "@/lib/payments/types";

const PROVIDERS: PaymentProviderId[] = ["bkash", "nagad", "rocket"];

/**
 * Starts an online payment for an order.
 *
 * Currently every provider returns 501: the real gateway flows live in
 * lib/payments/{bkash,nagad,rocket}.ts and need merchant credentials
 * (see .env.example) before they can be switched on.
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
        `Complete the TODOs in lib/payments/${provider}.ts and set the ` +
        `credentials from .env.example, then this endpoint can create ` +
        `real payment sessions.`,
    },
    { status: 501 }
  );
}
