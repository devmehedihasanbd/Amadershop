"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel, inputClass, labelClass, primaryBtnClass, secondaryBtnClass } from "./ui";

export const MAX_PRODUCT_IMAGES = 3;

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
  images: string[];
}

/**
 * Shrink a photo in the browser so uploads stay small:
 * max 1200px on the long edge, JPEG quality 0.72.
 * Returns a data-URL ready to store.
 */
async function compressImage(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("read"));
      el.src = objectUrl;
    });
    const maxDim = 1200;
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    // Flatten transparency onto white so JPEG has no black background.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.72);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function ImageUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setImgError(null);
    const remaining = MAX_PRODUCT_IMAGES - images.length;
    if (remaining <= 0) {
      setImgError(`At most ${MAX_PRODUCT_IMAGES} photos per product.`);
      return;
    }
    const picked = Array.from(fileList).slice(0, remaining);
    setBusy(true);
    try {
      const compressed: string[] = [];
      for (const f of picked) {
        if (!f.type.startsWith("image/")) {
          throw new Error("Only image files can be uploaded.");
        }
        if (f.size > 12 * 1024 * 1024) {
          throw new Error(`"${f.name}" is larger than 12 MB.`);
        }
        compressed.push(await compressImage(f));
      }
      onChange([...images, ...compressed]);
    } catch {
      setImgError("Could not read that photo. Please try a JPG or PNG image.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...images];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    onChange(next);
  }

  return (
    <div>
      <span className={labelClass}>Photos (up to {MAX_PRODUCT_IMAGES})</span>
      <div className="mt-1.5 flex flex-wrap gap-3">
        {images.map((src, i) => (
          <div key={`${i}-${src.slice(0, 24)}`} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Product photo ${i + 1}`}
              className="h-24 w-24 rounded-xl border border-stone-200 object-cover"
            />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Main
              </span>
            )}
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-stone-900/85 text-sm font-bold text-white shadow hover:bg-red-600"
            >
              ×
            </button>
            <div className="absolute inset-x-1 bottom-1 flex justify-between">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Move photo left"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-stone-700 shadow disabled:opacity-30"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === images.length - 1}
                aria-label="Move photo right"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-stone-700 shadow disabled:opacity-30"
              >
                ›
              </button>
            </div>
          </div>
        ))}

        {images.length < MAX_PRODUCT_IMAGES && (
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-stone-300 text-stone-500 transition hover:border-green-500 hover:text-green-700 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span className="px-1 text-center text-[11px] font-semibold leading-tight">
              {busy ? "Compressing…" : images.length === 0 ? "Add photos" : "Add more"}
            </span>
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {imgError && <p className="mt-1.5 text-sm text-red-600">{imgError}</p>}
      <p className="mt-1.5 text-xs text-stone-400">
        The first photo is the main one shown in listings. Photos are compressed
        automatically before upload.
      </p>
    </div>
  );
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
        images: form.images,
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

      <ImageUploader images={form.images} onChange={(images) => set("images", images)} />

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
