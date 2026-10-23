import { NextResponse, connection } from "next/server";
import { getSettings } from "@/lib/settings";

// Public storefront settings (announcement bar, delivery info).
// Always rendered dynamically so admin changes take effect immediately.
export async function GET() {
  await connection();
  const settings = await getSettings();
  return NextResponse.json({
    announcement: settings.announcement,
    deliveryCharge: settings.deliveryCharge,
    freeDeliveryThreshold: settings.freeDeliveryThreshold,
  });
}
