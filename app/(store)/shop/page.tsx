"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import CategoryCircles from "@/components/CategoryCircles";
import type { CategoryWithDetails } from "@/lib/catalog";
import type { Product } from "@/lib/products";

/** Full catalog: round-image categories above, product grid below.
    No filters — the old search box, category dropdown, max price,
    sort and on-sale controls are all gone. */
export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<
    { slug: string; name: string; tagline?: string; image?: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

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

  // Round-image category options, with live product counts.
  const circleCategories: CategoryWithDetails[] = useMemo(
    () =>
      categories.map((c) => ({
        slug: c.slug,
        name: c.name,
        tagline: c.tagline ?? "",
        productCount: products.filter((p) => p.category === c.slug).length,
        ...(c.image ? { image: c.image } : {}),
      })),
    [categories, products]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
        Shop All Products
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        {loading ? "Loading…" : `${products.length} products`}
      </p>

      {/* Round-image categories */}
      {!loading && circleCategories.length > 0 && (
        <div className="mt-6">
          <CategoryCircles categories={circleCategories} />
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="mt-12 text-center text-sm text-stone-500">
          No products yet.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
