"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/products";

type SortKey = "popular" | "price-asc" | "price-desc" | "rating";

const SORTS: { id: SortKey; label: string }[] = [
  { id: "popular", label: "Most popular" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "rating", label: "Top rated" },
];

/** Full catalog with category, price and sort filters. */
export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>("popular");
  const [query, setQuery] = useState("");
  const [onSale, setOnSale] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/products").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/categories").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([pj, cj]) => {
        if (cancelled) return;
        if (pj?.products) setProducts(pj.products as Product[]);
        const cats = cj?.categories ?? cj ?? [];
        if (Array.isArray(cats)) setCategories(cats);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const priceCeil = useMemo(
    () => products.reduce((m, p) => Math.max(m, p.price), 1000),
    [products]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (maxPrice !== null && p.price > maxPrice) return false;
      if (onSale && !p.oldPrice) return false;
      if (q && !`${p.name} ${p.short ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
      default:
        list = [...list].sort((a, b) => b.reviews - a.reviews);
    }
    return list;
  }, [products, cat, maxPrice, sort, query, onSale]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
        Shop All Products
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        {loading ? "Loading…" : `${filtered.length} of ${products.length} products`}
      </p>

      {/* Filters */}
      <div className="mt-6 grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-5">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
            Search
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-green-600"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
            Category
          </span>
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-600"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
            Max price {maxPrice !== null ? `(৳${maxPrice})` : "(any)"}
          </span>
          <input
            type="range"
            min={0}
            max={priceCeil}
            step={50}
            value={maxPrice ?? priceCeil}
            onChange={(e) =>
              setMaxPrice(
                Number(e.target.value) >= priceCeil ? null : Number(e.target.value)
              )
            }
            className="w-full accent-green-600"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
            Sort by
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-600"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex cursor-pointer items-end gap-2 pb-2">
          <input
            type="checkbox"
            checked={onSale}
            onChange={(e) => setOnSale(e.target.checked)}
            className="h-4 w-4 accent-green-600"
          />
          <span className="text-sm font-medium text-stone-700">On sale only</span>
        </label>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-12 text-center text-sm text-stone-500">
          No products match these filters. Try widening your search.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
