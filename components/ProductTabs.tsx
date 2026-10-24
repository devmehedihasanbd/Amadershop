"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";
import Reveal from "./Reveal";
import type { Product } from "@/lib/products";

type TabId = "best" | "new" | "rated";

/**
 * Tabbed product showcase: Best Selling / New Arrivals / Top Rated.
 */
export default function ProductTabs({
  bestSellers,
  newArrivals,
  topRated,
}: {
  bestSellers: Product[];
  newArrivals: Product[];
  topRated: Product[];
}) {
  const [tab, setTab] = useState<TabId>("best");

  const tabs: { id: TabId; label: string; products: Product[] }[] = [
    { id: "best", label: "Best Selling", products: bestSellers },
    { id: "new", label: "New Arrivals", products: newArrivals },
    { id: "rated", label: "Top Rated", products: topRated },
  ];
  const active = tabs.find((t) => t.id === tab)!;

  return (
    <section className="mx-auto max-w-7xl px-4 py-14">
      <div className="flex flex-col items-center text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-green-700">
          Weekly best selling organic items
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-stone-900">
          Shop Our Products
        </h2>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                tab === t.id
                  ? "bg-green-600 text-white shadow"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div key={tab} className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {active.products.length === 0 ? (
          <p className="col-span-full py-8 text-center text-sm text-stone-500">
            Products are on their way — check back soon.
          </p>
        ) : (
          active.products.slice(0, 8).map((p, i) => (
            <Reveal key={p.slug} delay={Math.min(i, 3) * 70}>
              <ProductCard product={p} />
            </Reveal>
          ))
        )}
      </div>
    </section>
  );
}
