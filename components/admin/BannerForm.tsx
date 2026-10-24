"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Panel, inputClass, labelClass, primaryBtnClass, secondaryBtnClass } from "./ui";
import ImageUploader from "./ImageUploader";

export interface BannerFormData {
  placement: "hero" | "offer";
  eyebrow: string;
  title: string;
  subtitle: string;
  images: string[];
  link: string;
  linkLabel: string;
  sortOrder: string;
  active: boolean;
}

export default function BannerForm({
  initial,
  bannerId,
}: {
  initial: BannerFormData;
  bannerId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<BannerFormData>(initial);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof BannerFormData>(key: K, value: BannerFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDetails(null);
    setLoading(true);
    try {
      const payload = {
        placement: form.placement,
        eyebrow: form.eyebrow,
        title: form.title,
        subtitle: form.subtitle,
        image: form.images[0] ?? "",
        link: form.link,
        linkLabel: form.linkLabel,
        sortOrder: Number(form.sortOrder),
        active: form.active,
      };
      const res = await fetch(
        bannerId ? `/api/admin/banners/${bannerId}` : "/api/admin/banners",
        {
          method: bannerId ? "PATCH" : "POST",
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
      router.push("/admin/banners");
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
    <Panel title={bannerId ? "Edit banner" : "New banner"}>
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
            <label className={labelCls} htmlFor="bf-placement">Placement *</label>
            <select
              id="bf-placement"
              className={inputCls}
              value={form.placement}
              onChange={(e) => set("placement", e.target.value as "hero" | "offer")}
            >
              <option value="hero">Hero slider (top of homepage)</option>
              <option value="offer">Offer card (Current offers section)</option>
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="bf-sort">Sort order</label>
            <input
              id="bf-sort"
              type="number"
              min="0"
              step="1"
              className={inputCls}
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", e.target.value)}
              placeholder="0 = first"
            />
          </div>
        </div>

        <ImageUploader
          images={form.images}
          onChange={(images) => set("images", images)}
          max={1}
          label={form.placement === "hero" ? "Photo * (shown in the slider)" : "Photo (optional — gradient card when empty)"}
        />

        <div>
          <label className={labelCls} htmlFor="bf-eyebrow">Eyebrow (small tagline)</label>
          <input
            id="bf-eyebrow"
            className={inputCls}
            value={form.eyebrow}
            onChange={(e) => set("eyebrow", e.target.value)}
            placeholder="e.g. Raw & Unfiltered"
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="bf-title">Title *</label>
          <input
            id="bf-title"
            className={inputCls}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Pure Sundarban Honey"
            required
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="bf-subtitle">Subtitle</label>
          <textarea
            id="bf-subtitle"
            rows={3}
            className={inputCls}
            value={form.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
            placeholder="One or two sentences under the title."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="bf-link">Link</label>
            <input
              id="bf-link"
              className={inputCls}
              value={form.link}
              onChange={(e) => set("link", e.target.value)}
              placeholder="/category/honey"
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="bf-linklabel">Button label</label>
            <input
              id="bf-linklabel"
              className={inputCls}
              value={form.linkLabel}
              onChange={(e) => set("linkLabel", e.target.value)}
              placeholder="Shop Now"
            />
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-sm font-medium text-stone-700">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => set("active", e.target.checked)}
            className="h-5 w-5 rounded accent-green-600"
          />
          Show on the store (active)
        </label>

        <div className="flex gap-2">
          <button type="submit" disabled={loading} className={primaryBtnClass}>
            {loading ? "Saving…" : bannerId ? "Save changes" : "Create banner"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/banners")}
            className={secondaryBtnClass}
          >
            Cancel
          </button>
        </div>
      </form>
    </Panel>
  );
}
