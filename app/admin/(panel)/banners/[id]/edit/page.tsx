import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import BannerForm, { type BannerFormData } from "@/components/admin/BannerForm";

export default async function AdminBannerEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  if (!db) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="font-medium text-stone-700">Database not configured.</p>
      </div>
    );
  }

  const banner = await db.banner.findUnique({ where: { id } });
  if (!banner) notFound();

  const initial: BannerFormData = {
    placement: banner.placement === "OFFER" ? "offer" : "hero",
    eyebrow: banner.eyebrow ?? "",
    title: banner.title,
    subtitle: banner.subtitle ?? "",
    images: banner.image ? [banner.image] : [],
    link: banner.link,
    linkLabel: banner.linkLabel ?? "",
    sortOrder: String(banner.sortOrder),
    active: banner.active,
  };

  return (
    <div className="space-y-4">
      <BannerForm initial={initial} bannerId={banner.id} />
    </div>
  );
}
