"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DeleteButton from "./DeleteButton";

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  sortOrder: number;
  productCount: number;
}

export default function CategoryManager({
  initial,
}: {
  initial: CategoryRow[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", tagline: "", sortOrder: "0" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function startCreate() {
    setEditingId("new");
    setForm({ name: "", slug: "", tagline: "", sortOrder: "0" });
    setError(null);
  }

  function startEdit(c: CategoryRow) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      tagline: c.tagline,
      sortOrder: String(c.sortOrder),
    });
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        tagline: form.tagline,
        sortOrder: Number(form.sortOrder),
      };
      const isNew = editingId === "new";
      const res = await fetch(
        isNew ? "/api/admin/categories" : `/api/admin/categories/${editingId}`,
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
        <h1 className="text-2xl font-bold text-stone-900">Categories</h1>
        <button
          onClick={startCreate}
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
        >
          + New category
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {editingId && (
        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-stone-900">
            {editingId === "new" ? "New category" : "Edit category"}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className={labelCls}>Name *</label>
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className={labelCls}>Slug (auto from name if empty)</label>
              <input className={inputCls} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Tagline</label>
              <input className={inputCls} value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Raw & unprocessed" />
            </div>
            <div>
              <label className={labelCls}>Sort order</label>
              <input type="number" min="0" className={inputCls} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
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
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs uppercase text-stone-500">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Slug</th>
                <th className="py-2 pr-3">Tagline</th>
                <th className="py-2 pr-3 text-right">Order</th>
                <th className="py-2 pr-3 text-right">Products</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initial.map((c) => (
                <tr key={c.id} className="border-b border-stone-100 last:border-0">
                  <td className="py-2.5 pr-3 font-medium text-stone-900">{c.name}</td>
                  <td className="py-2.5 pr-3 text-stone-400">{c.slug}</td>
                  <td className="py-2.5 pr-3 text-stone-500">{c.tagline || "—"}</td>
                  <td className="py-2.5 pr-3 text-right text-stone-500">{c.sortOrder}</td>
                  <td className="py-2.5 pr-3 text-right">{c.productCount}</td>
                  <td className="py-2.5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => startEdit(c)}
                        className="rounded-lg border border-stone-300 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                      >
                        Edit
                      </button>
                      <DeleteButton
                        url={`/api/admin/categories/${c.id}`}
                        label="Delete"
                        confirmMessage={`Delete category "${c.name}"?`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {initial.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-stone-500">
                    No categories yet.
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
