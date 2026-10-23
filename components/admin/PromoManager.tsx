"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DeleteButton from "./DeleteButton";

export interface PromoRow {
  id: string;
  code: string;
  percent: number;
  minOrder: number;
  maxDiscount: number;
  active: boolean;
}

const EMPTY = { code: "", percent: "10", minOrder: "0", maxDiscount: "0", active: true };

export default function PromoManager({ initial }: { initial: PromoRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function startCreate() {
    setEditingId("new");
    setForm(EMPTY);
    setError(null);
  }

  function startEdit(p: PromoRow) {
    setEditingId(p.id);
    setForm({
      code: p.code,
      percent: String(p.percent),
      minOrder: String(p.minOrder),
      maxDiscount: String(p.maxDiscount),
      active: p.active,
    });
    setError(null);
  }

  async function toggleActive(p: PromoRow) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/promos/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: p.code,
          percent: p.percent,
          minOrder: p.minOrder,
          maxDiscount: p.maxDiscount,
          active: !p.active,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error ?? "Update failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        code: form.code,
        percent: Number(form.percent),
        minOrder: Number(form.minOrder),
        maxDiscount: Number(form.maxDiscount),
        active: form.active,
      };
      const isNew = editingId === "new";
      const res = await fetch(
        isNew ? "/api/admin/promos" : `/api/admin/promos/${editingId}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const details = Array.isArray(json?.details) ? `: ${json.details.join(" ")}` : "";
        setError(`${json?.error ?? "Save failed."}${details}`);
        return;
      }
      setEditingId(null);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/20";
  const labelCls = "mb-1 block text-xs font-medium text-stone-600";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Promo codes</h1>
        <button
          onClick={startCreate}
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
        >
          + New promo
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {editingId && (
        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-stone-900">
            {editingId === "new" ? "New promo" : "Edit promo"}
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className={labelCls}>Code *</label>
              <input className={inputCls} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="EID20" required />
            </div>
            <div>
              <label className={labelCls}>Percent off * (1–90)</label>
              <input type="number" min="1" max="90" className={inputCls} value={form.percent} onChange={(e) => setForm({ ...form, percent: e.target.value })} required />
            </div>
            <div>
              <label className={labelCls}>Min order (৳)</label>
              <input type="number" min="0" className={inputCls} value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Max discount (৳)</label>
              <input type="number" min="0" className={inputCls} value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="h-4 w-4 accent-green-700"
                />
                Active
              </label>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs uppercase text-stone-500">
                <th className="py-2 pr-3">Code</th>
                <th className="py-2 pr-3 text-right">% off</th>
                <th className="py-2 pr-3 text-right">Min order</th>
                <th className="py-2 pr-3 text-right">Max discount</th>
                <th className="py-2 pr-3">Active</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initial.map((p) => (
                <tr key={p.id} className="border-b border-stone-100 last:border-0">
                  <td className="py-2.5 pr-3 font-mono font-bold text-stone-900">{p.code}</td>
                  <td className="py-2.5 pr-3 text-right">{p.percent}%</td>
                  <td className="py-2.5 pr-3 text-right text-stone-500">৳{p.minOrder.toLocaleString()}</td>
                  <td className="py-2.5 pr-3 text-right text-stone-500">৳{p.maxDiscount.toLocaleString()}</td>
                  <td className="py-2.5 pr-3">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        p.active ? "bg-green-100 text-green-800" : "bg-stone-200 text-stone-500"
                      }`}
                      title="Toggle active"
                    >
                      {p.active ? "ON" : "OFF"}
                    </button>
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => startEdit(p)}
                        className="rounded-lg border border-stone-300 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                      >
                        Edit
                      </button>
                      <DeleteButton
                        url={`/api/admin/promos/${p.id}`}
                        label="Delete"
                        confirmMessage={`Delete promo "${p.code}"?`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {initial.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-stone-500">
                    No promo codes yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
