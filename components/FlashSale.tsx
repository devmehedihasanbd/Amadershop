"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/products";

function useCountdownToMidnight() {
  const [left, setLeft] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const ms = Math.max(0, end.getTime() - now.getTime());
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return left;
}

/**
 * Flash sale — discounted products (oldPrice set in the admin panel)
 * with a live countdown to midnight. Render nothing when empty.
 */
export default function FlashSale({ products }: { products: Product[] }) {
  const countdown = useCountdownToMidnight();
  if (products.length === 0) return null;

  return (
    <section className="bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 py-14">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-rose-600">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-600" />
              </span>
              Limited time
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-stone-900">
              ⚡ Super Flash Sale
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Discounts refresh every midnight — set them from the product's old price.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Ends in
            </span>
            <span
              className="rounded-xl bg-stone-900 px-4 py-2 font-mono text-xl font-extrabold tabular-nums text-white shadow"
              aria-live="off"
            >
              {countdown}
            </span>
            <Link
              href="/shop"
              className="ml-2 rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-green-700"
            >
              Shop More
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.slice(0, 8).map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
