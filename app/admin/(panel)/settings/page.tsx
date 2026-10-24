import { getDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import SettingsForm from "@/components/admin/SettingsForm";
import { EmptyState, PageHeader } from "@/components/admin/ui";


export default async function AdminSettingsPage() {
  const db = getDb();
  if (!db) {
    return <EmptyState message="Database not configured." />;
  }

  const s = await getSettings();

  return (
    <div className="space-y-4">
      <PageHeader subtitle="Storefront preferences. Changes apply to the live store immediately." />
      <SettingsForm
        initial={{
          announcement: s.announcement,
          delivery_charge: String(s.deliveryCharge),
          free_delivery_threshold: String(s.freeDeliveryThreshold),
          store_name: s.storeName,
          store_tagline: s.storeTagline,
          logo_image: s.logoImage,
          contact_phone: s.contactPhone,
          contact_whatsapp: s.contactWhatsapp,
          contact_email: s.contactEmail,
          store_address: s.storeAddress,
          open_hours: s.openHours,
          facebook_url: s.facebookUrl,
          instagram_url: s.instagramUrl,
          footer_about: s.footerAbout,
        }}
      />
      <div className="max-w-2xl rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
        <p className="font-semibold">Note</p>
        <p className="mt-1">
          The admin password is set via the <code className="font-mono">ADMIN_PASSWORD</code>{" "}
          environment variable and cannot be changed here.
        </p>
      </div>
    </div>
  );
}
