import Link from "next/link";
import type { CategoryWithDetails } from "@/lib/catalog";

const RING_COLORS = [
  "ring-rose-200",
  "ring-amber-200",
  "ring-green-200",
  "ring-sky-200",
  "ring-orange-200",
  "ring-yellow-200",
  "ring-pink-200",
  "ring-emerald-200",
];

/**
 * "Browse by categories" — circular photos with live product counts,
 * in the style of modern organic grocery storefronts.
 */
export default function CategoryCircles({
  categories,
}: {
  categories: CategoryWithDetails[];
}) {
  return (
    <div className="mt-8 flex gap-5 overflow-x-auto pb-4 sm:grid sm:grid-cols-4 sm:overflow-visible lg:grid-cols-7">
      {categories.map((c, i) => (
        <Link
          key={c.slug}
          href={`/category/${c.slug}`}
          className="group flex w-28 shrink-0 flex-col items-center text-center sm:w-auto"
        >
          <span
            className={`relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-green-50 ring-4 transition duration-300 group-hover:scale-105 group-hover:shadow-lg ${RING_COLORS[i % RING_COLORS.length]}`}
          >
            {c.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-3xl font-extrabold text-green-700">
                {c.name.charAt(0)}
              </span>
            )}
          </span>
          <span className="mt-3 text-sm font-bold text-stone-800 transition group-hover:text-green-700">
            {c.name}
          </span>
          <span className="text-xs text-stone-400">
            {c.productCount} {c.productCount === 1 ? "item" : "items"}
          </span>
        </Link>
      ))}
    </div>
  );
}
