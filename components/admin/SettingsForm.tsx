"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Panel, inputClass, labelClass, primaryBtnClass } from "./ui";
import ImageUploader from "./ImageUploader";

export interface SiteSettingsFormData {
  announcement: string;
  delivery_charge: string;
  free_delivery_threshold: string;
  store_name: string;
  store_tagline: string;
  logo_image: string;
  contact_phone: string;
  contact_whatsapp: string;
  contact_email: string;
  store_address: string;
  open_hours: string;
  facebook_url: string;
  instagram_url: string;
  footer_about: string;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-stone-200 p-4">
      <legend className="px-1 text-sm font-bold text-stone-800">{title}</legend>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

export default function SettingsForm({
  initial,
}: {
  initial: SiteSettingsFormData;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [logo, setLogo] = useState<string[]>(initial.logo_image ? [initial.logo_image] : []);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, logo_image: logo[0] ?? "" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const details = Array.isArray(json?.details) ? `: ${json.details.join(" ")}` : "";
        setError(`${json?.error ?? "Save failed."}${details}`);
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = inputClass;
  const labelCls = labelClass;
  const set = (k: keyof SiteSettingsFormData) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value }),
  });

  return (
    <Panel title="Store settings">
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {saved && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Settings saved — the live store updates immediately.
        </p>
      )}

      <Section title="Store identity">
        <div>
          <label className={labelCls} htmlFor="set-name">Store name *</label>
          <input id="set-name" className={inputCls} maxLength={60} required {...set("store_name")} />
        </div>
        <div>
          <label className={labelCls} htmlFor="set-tagline">Tagline</label>
          <input id="set-tagline" className={inputCls} maxLength={120} {...set("store_tagline")} />
        </div>
        <ImageUploader
          images={logo}
          onChange={setLogo}
          max={1}
          label="Logo (square works best — shown in the header)"
        />
      </Section>

      <Section title="Contact">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="set-phone">Phone</label>
            <input id="set-phone" className={inputCls} maxLength={25} placeholder="+880 1XXX-XXXXXX" {...set("contact_phone")} />
          </div>
          <div>
            <label className={labelCls} htmlFor="set-wa">WhatsApp number</label>
            <input id="set-wa" className={inputCls} maxLength={25} placeholder="8801XXXXXXXXX" {...set("contact_whatsapp")} />
            <p className="mt-1 text-xs text-stone-400">Shown as a chat button in the footer.</p>
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor="set-email">Email</label>
          <input id="set-email" type="email" className={inputCls} maxLength={120} {...set("contact_email")} />
        </div>
        <div>
          <label className={labelCls} htmlFor="set-address">Address</label>
          <textarea id="set-address" rows={2} className={inputCls} maxLength={300} {...set("store_address")} />
        </div>
        <div>
          <label className={labelCls} htmlFor="set-hours">Opening hours</label>
          <input id="set-hours" className={inputCls} maxLength={120} {...set("open_hours")} />
        </div>
      </Section>

      <Section title="Social & footer">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="set-fb">Facebook page URL</label>
            <input id="set-fb" className={inputCls} placeholder="https://facebook.com/…" {...set("facebook_url")} />
          </div>
          <div>
            <label className={labelCls} htmlFor="set-ig">Instagram URL</label>
            <input id="set-ig" className={inputCls} placeholder="https://instagram.com/…" {...set("instagram_url")} />
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor="set-about">Footer about text</label>
          <textarea id="set-about" rows={3} className={inputCls} maxLength={500} {...set("footer_about")} placeholder="A short line about your shop, shown in the footer." />
        </div>
      </Section>

      <Section title="Storefront">
        <div>
          <label className={labelCls} htmlFor="set-announcement">
            Announcement bar text
          </label>
          <input
            id="set-announcement"
            className={inputCls}
            maxLength={200}
            placeholder="e.g. Free delivery this week!"
            {...set("announcement")}
          />
          <p className="mt-1 text-xs text-stone-400">
            Shown as a slim bar at the very top of the store. Leave empty to hide it.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="set-delivery">
              Delivery charge (৳)
            </label>
            <input
              id="set-delivery"
              type="number"
              min="0"
              step="1"
              className={inputCls}
              value={form.delivery_charge}
              onChange={(e) => setForm({ ...form, delivery_charge: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="set-threshold">
              Free delivery threshold (৳)
            </label>
            <input
              id="set-threshold"
              type="number"
              min="0"
              step="1"
              className={inputCls}
              value={form.free_delivery_threshold}
              onChange={(e) => setForm({ ...form, free_delivery_threshold: e.target.value })}
            />
            <p className="mt-1 text-xs text-stone-400">
              Orders at or above this subtotal get free delivery.
            </p>
          </div>
        </div>
      </Section>

      <button
        type="submit"
        disabled={loading}
        className={primaryBtnClass}
      >
        {loading ? "Saving…" : "Save settings"}
      </button>
    </form>
    </Panel>
  );
}
