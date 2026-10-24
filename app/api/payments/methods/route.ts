import { NextResponse } from "next/server";
import { getPaymentMethods } from "@/lib/site-config";

/**
 * Public: payment methods the store currently offers.
 * Only booleans + labels — never credentials.
 */
export async function GET() {
  const methods = await getPaymentMethods();
  return NextResponse.json({ methods });
}
