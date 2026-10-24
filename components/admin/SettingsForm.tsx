"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Panel, inputClass, labelClass, primaryBtnClass } from "./ui";

export default function SettingsForm({
  initial,
}: {
  initial: { announcement: string; delivery_charge: string; free_delivery_threshold: string };
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
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
        body: JSON.stringify({
          announcement: form.announcement,
          delivery_charge: Number(form.delivery_charge),
          free_delivery_threshold: Number(form.free_delivery_threshold),
        }),
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

  return (
    <Panel title="Store settings">
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {saved && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Settings saved.
        </p>
      )}

      <div>
        <label className={labelCls} htmlFor="set-announcement">
          Announcement bar text
        </label>
        <input
          id="set-announcement"
          className={inputCls}
          value={form.announcement}
          onChange={(e) => setForm({ ...form, announcement: e.target.value })}
          placeholder="e.g. Free delivery this week!"
          maxLength={200}
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
