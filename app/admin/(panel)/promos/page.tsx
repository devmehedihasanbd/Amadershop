import { getDb } from "@/lib/db";
import PromoManager from "@/components/admin/PromoManager";


export default async function AdminPromosPage() {
  const db = getDb();
  if (!db) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="font-medium text-stone-700">Database not configured.</p>
      </div>
    );
  }

  const promos = await db.promo.findMany({ orderBy: { createdAt: "desc" } });

  return <PromoManager initial={promos} />;
}
