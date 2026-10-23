import { getDb } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import SettingsForm from "@/components/admin/SettingsForm";


export default async function AdminSettingsPage() {
  const db = getDb();
  if (!db) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="font-medium text-stone-700">Database not configured.</p>
      </div>
    );
  }

  const rows = await db.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-stone-900">Settings</h1>
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
      <div className="max-w-xl rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-medium">Note</p>
        <p className="mt-1">
          The admin password is set via the <code className="font-mono">ADMIN_PASSWORD</code>{" "}
          environment variable and cannot be changed here.
        </p>
      </div>
    </div>
  );
}
