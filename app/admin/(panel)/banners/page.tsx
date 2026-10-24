import Link from "next/link";
import { getDb } from "@/lib/db";
import DeleteButton from "@/components/admin/DeleteButton";
import BannerActiveToggle from "@/components/admin/BannerActiveToggle";
import {
  EmptyState,
  PageHeader,
  primaryBtnClass,
} from "@/components/admin/ui";

export default async function AdminBannersPage() {
  const db = getDb();
  if (!db) {
    return <EmptyState message="Database not configured." />;
  }

  const banners = await db.banner.findMany({
    orderBy: [{ placement: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const hero = banners.filter((b) => b.placement === "HERO");
  const offer = banners.filter((b) => b.placement === "OFFER");

  function BannerCard({ b }: { b: (typeof banners)[number] }) {
    return (
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="relative h-36 bg-gradient-to-br from-stone-200 to-stone-300">
          {b.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={b.image}
              alt={b.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10" aria-hidden="true">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          )}
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow ${
              b.placement === "HERO" ? "bg-green-600" : "bg-amber-600"
            }`}
          >
            {b.placement === "HERO" ? "Hero slider" : "Offer card"}
          </span>
        </div>
        <div className="space-y-1 p-4">
          {b.eyebrow && (
            <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
              {b.eyebrow}
            </p>
          )}
          <p className="font-bold text-stone-900">{b.title}</p>
          {b.subtitle && (
            <p className="line-clamp-2 text-sm text-stone-500">{b.subtitle}</p>
          )}
          <p className="truncate text-xs text-stone-400">
            → {b.link}
            <span className="ml-2 text-stone-300">· order {b.sortOrder}</span>
          </p>
          <div className="flex items-center justify-between pt-2">
            <BannerActiveToggle id={b.id} active={b.active} />
            <div className="flex gap-2">
              <Link
                href={`/admin/banners/${b.id}/edit`}
                className="rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
              >
                Edit
              </Link>
              <DeleteButton
                url={`/api/admin/banners/${b.id}`}
                label="Delete"
                confirmMessage={`Delete banner "${b.title}"?`}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        subtitle="Hero slider + offer cards on the homepage"
        actions={
          <Link href="/admin/banners/new" className={primaryBtnClass}>
            + New banner
          </Link>
        }
      />

      {banners.length === 0 ? (
        <EmptyState message="No banners yet — the homepage shows its default slides." />
      ) : (
        <>
          {hero.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-stone-500">
                Hero slider ({hero.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {hero.map((b) => (
                  <BannerCard key={b.id} b={b} />
                ))}
              </div>
            </section>
          )}
          {offer.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-stone-500">
                Offer cards ({offer.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {offer.map((b) => (
                  <BannerCard key={b.id} b={b} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
