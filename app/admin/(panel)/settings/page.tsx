import { getDb } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import SettingsForm from "@/components/admin/SettingsForm";
import { EmptyState, PageHeader } from "@/components/admin/ui";


export default async function AdminSettingsPage() {
  const db = getDb();
  if (!db) {
    return <EmptyState message="Database not configured." />;
  }

  const rows = await db.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));

  return (
    <div className="space-y-4">
      <PageHeader subtitle="Storefront preferences. Changes apply to the live store immediately." />
      <SettingsForm
        initial={{
          announcement: map.get("announcement") ?? DEFAULT_SETTINGS.announcement,
          delivery_charge:
            map.get("delivery_charge") ?? String(DEFAULT_SETTINGS.deliveryCharge),
          free_delivery_threshold:
            map.get("free_delivery_threshold") ??
            String(DEFAULT_SETTINGS.freeDeliveryThreshold),
        }}
      />
      <div className="max-w-xl rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
        <p className="font-semibold">Note</p>
        <p className="mt-1">
          The admin password is set via the <code className="font-mono">ADMIN_PASSWORD</code>{" "}
          environment variable and cannot be changed here.
        </p>
      </div>
    </div>
  );
}
