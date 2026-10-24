"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DeleteButton from "./DeleteButton";
import {
  DataTable,
  PageHeader,
  Panel,
  inputClass,
  labelClass,
  primaryBtnClass,
  secondaryBtnClass,
  type Column,
} from "./ui";

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  sortOrder: number;
  productCount: number;
}

const columns: Column<CategoryRow>[] = [
  {
    header: "Name",
    render: (c) => <span className="font-medium text-stone-900">{c.name}</span>,
  },
  {
    header: "Slug",
    render: (c) => <span className="text-stone-400">{c.slug}</span>,
  },
  {
    header: "Tagline",
    render: (c) => <span className="text-stone-500">{c.tagline || "—"}</span>,
  },
  {
    header: "Order",
    align: "right",
    render: (c) => <span className="text-stone-500">{c.sortOrder}</span>,
  },
  {
    header: "Products",
    align: "right",
    render: (c) => <span className="font-semibold text-stone-700">{c.productCount}</span>,
  },
];

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

  function CategoryActions({ category: c }: { category: CategoryRow }) {
    return (
      <div className="flex justify-end gap-2">
        <button
          onClick={() => startEdit(c)}
          className="rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
        >
          Edit
        </button>
        <DeleteButton
          url={`/api/admin/categories/${c.id}`}
          label="Delete"
          confirmMessage={`Delete category "${c.name}"?`}
        />
      </div>
    );
  }

  function CategoryCard({ category: c }: { category: CategoryRow }) {
    return (
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-stone-900">{c.name}</p>
            <p className="truncate text-xs text-stone-400">{c.slug}</p>
          </div>
          <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600">
            {c.productCount} products
          </span>
        </div>
        {c.tagline && <p className="mt-1.5 text-sm text-stone-500">{c.tagline}</p>}
        <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
          <span className="text-xs text-stone-400">Sort order: {c.sortOrder}</span>
          <CategoryActions category={c} />
        </div>
      </div>
    );
  }

  const tableColumns: Column<CategoryRow>[] = [
    ...columns,
    {
      header: "Actions",
      align: "right",
      render: (c) => <CategoryActions category={c} />,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        subtitle={`${initial.length} categor${initial.length === 1 ? "y" : "ies"}`}
        actions={
          <button onClick={startCreate} className={primaryBtnClass}>
            + New category
          </button>
        }
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-200">
          {error}
        </p>
      )}

      {editingId && (
        <Panel title={editingId === "new" ? "New category" : "Edit category"}>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Name *</label>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Slug <span className="font-normal text-stone-400">(auto from name if empty)</span></label>
                <input
                  className={inputClass}
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Tagline</label>
                <input
                  className={inputClass}
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  placeholder="Raw & unprocessed"
                />
              </div>
              <div>
                <label className={labelClass}>Sort order</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={loading} className={primaryBtnClass}>
                {loading ? "Saving…" : "Save category"}
              </button>
              <button type="button" onClick={() => setEditingId(null)} className={secondaryBtnClass}>
                Cancel
              </button>
            </div>
          </form>
        </Panel>
      )}

      <DataTable
        columns={tableColumns}
        data={initial}
        keyOf={(c) => c.id}
        renderCard={(c) => <CategoryCard category={c} />}
        emptyMessage="No categories yet."
      />
    </div>
  );
}
