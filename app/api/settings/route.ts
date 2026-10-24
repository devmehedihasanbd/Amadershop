import { NextResponse, connection } from "next/server";
import { getSettings } from "@/lib/settings";

// Public storefront settings (identity, contact, delivery info).
// Always rendered dynamically so admin changes take effect immediately.
export async function GET() {
  await connection();
  const s = await getSettings();
  return NextResponse.json({
    announcement: s.announcement,
    deliveryCharge: s.deliveryCharge,
    freeDeliveryThreshold: s.freeDeliveryThreshold,
    storeName: s.storeName,
    storeTagline: s.storeTagline,
    logoImage: s.logoImage,
    contactPhone: s.contactPhone,
    contactWhatsapp: s.contactWhatsapp,
    contactEmail: s.contactEmail,
    storeAddress: s.storeAddress,
    openHours: s.openHours,
    facebookUrl: s.facebookUrl,
    instagramUrl: s.instagramUrl,
    footerAbout: s.footerAbout,
  });
}
