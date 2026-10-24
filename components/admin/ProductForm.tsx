"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Panel, inputClass, labelClass, primaryBtnClass, secondaryBtnClass } from "./ui";

export interface ProductFormData {
  name: string;
  slug: string;
  categorySlug: string;
  price: string;
  oldPrice: string;
  unit: string;
  stock: string;
  badge: string;
  rating: string;
  description: string;
  details: string;
}

export default function ProductForm({
  initial,
  categories,
  productId,
}: {
  initial: ProductFormData;
  categories: Array<{ slug: string; name: string }>;
  productId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormData>(initial);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDetails(null);
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        categorySlug: form.categorySlug,
        price: Number(form.price),
        oldPrice: form.oldPrice.trim() === "" ? null : Number(form.oldPrice),
        unit: form.unit,
        stock: Number(form.stock),
        badge: form.badge,
        rating: Number(form.rating),
        description: form.description,
        details: form.details,
      };
      const res = await fetch(
        productId ? `/api/admin/products/${productId}` : "/api/admin/products",
        {
          method: productId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error ?? "Save failed.");
        if (Array.isArray(json?.details)) setDetails(json.details);
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = inputClass;
  const labelCls = labelClass;

  return (
    <Panel title={productId ? "Edit product" : "New product"}>
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <p className="font-medium">{error}</p>
          {details && (
            <ul className="mt-1 list-disc pl-5">
              {details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="pf-name">Name *</label>
          <input id="pf-name" className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div>
          <label className={labelCls} htmlFor="pf-slug">Slug (auto from name if empty)</label>
          <input id="pf-slug" className={inputCls} value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="e.g. wild-honey-1kg" />
        </div>
        <div>
          <label className={labelCls} htmlFor="pf-category">Category *</label>
          <select id="pf-category" className={inputCls} value={form.categorySlug} onChange={(e) => set("categorySlug", e.target.value)} required>
            <option value="">Select category…</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="pf-unit">Unit *</label>
          <input id="pf-unit" className={inputCls} value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="1 kg" required />
        </div>
        <div>
          <label className={labelCls} htmlFor="pf-price">Price (৳) *</label>
          <input id="pf-price" type="number" min="0" step="1" className={inputCls} value={form.price} onChange={(e) => set("price", e.target.value)} required />
        </div>
        <div>
          <label className={labelCls} htmlFor="pf-oldprice">Old price (৳, optional)</label>
          <input id="pf-oldprice" type="number" min="0" step="1" className={inputCls} value={form.oldPrice} onChange={(e) => set("oldPrice", e.target.value)} placeholder="For discount display" />
        </div>
        <div>
          <label className={labelCls} htmlFor="pf-stock">Stock *</label>
          <input id="pf-stock" type="number" min="0" step="1" className={inputCls} value={form.stock} onChange={(e) => set("stock", e.target.value)} required />
        </div>
        <div>
          <label className={labelCls} htmlFor="pf-rating">Rating (0–5)</label>
          <input id="pf-rating" type="number" min="0" max="5" step="0.1" className={inputCls} value={form.rating} onChange={(e) => set("rating", e.target.value)} />
        </div>
        <div>
          <label className={labelCls} htmlFor="pf-badge">Badge</label>
          <select id="pf-badge" className={inputCls} value={form.badge} onChange={(e) => set("badge", e.target.value)}>
            <option value="">None</option>
            <option value="best-selling">Best selling</option>
            <option value="new">New</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="pf-desc">Description *</label>
        <textarea id="pf-desc" rows={4} className={inputCls} value={form.description} onChange={(e) => set("description", e.target.value)} required />
      </div>

      <div>
        <label className={labelCls} htmlFor="pf-details">Details (one per line)</label>
        <textarea id="pf-details" rows={4} className={inputCls} value={form.details} onChange={(e) => set("details", e.target.value)} placeholder={"100% raw and unheated\nPacked in a sealed glass jar"} />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className={primaryBtnClass}
        >
          {loading ? "Saving…" : productId ? "Save changes" : "Create product"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className={secondaryBtnClass}
        >
          Cancel
        </button>
      </div>
    </form>
    </Panel>
  );
}
