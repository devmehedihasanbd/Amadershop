"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DeleteButton from "./DeleteButton";
import {
  DataTable,
  PageHeader,
  Panel,
  formatTk,
  inputClass,
  labelClass,
  primaryBtnClass,
  secondaryBtnClass,
  type Column,
} from "./ui";

export interface PromoRow {
  id: string;
  code: string;
  percent: number;
  minOrder: number;
  maxDiscount: number;
  active: boolean;
}

const EMPTY = { code: "", percent: "10", minOrder: "0", maxDiscount: "0", active: true };

function ActiveToggle({
  promo: p,
  onToggle,
}: {
  promo: PromoRow;
  onToggle: (p: PromoRow) => void;
}) {
  return (
    <button
      onClick={() => onToggle(p)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        p.active ? "bg-green-600" : "bg-stone-300"
      }`}
      role="switch"
      aria-checked={p.active}
      aria-label={`Toggle ${p.code}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
          p.active ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

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

  function PromoActions({ promo: p }: { promo: PromoRow }) {
    return (
      <div className="flex items-center justify-end gap-2">
        <ActiveToggle promo={p} onToggle={toggleActive} />
        <button
          onClick={() => startEdit(p)}
          className="rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
        >
          Edit
        </button>
        <DeleteButton
          url={`/api/admin/promos/${p.id}`}
          label="Delete"
          confirmMessage={`Delete promo "${p.code}"?`}
        />
      </div>
    );
  }

  function PromoCard({ promo: p }: { promo: PromoRow }) {
    return (
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-md bg-stone-900 px-2.5 py-1 font-mono text-sm font-bold tracking-wide text-white">
            {p.code}
          </span>
          <ActiveToggle promo={p} onToggle={toggleActive} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-stone-50 px-2 py-2">
            <p className="text-base font-bold text-stone-900">{p.percent}%</p>
            <p className="text-[10px] uppercase text-stone-500">Off</p>
          </div>
          <div className="rounded-lg bg-stone-50 px-2 py-2">
            <p className="text-base font-bold text-stone-900">{formatTk(p.minOrder)}</p>
            <p className="text-[10px] uppercase text-stone-500">Min order</p>
          </div>
          <div className="rounded-lg bg-stone-50 px-2 py-2">
            <p className="text-base font-bold text-stone-900">{formatTk(p.maxDiscount)}</p>
            <p className="text-[10px] uppercase text-stone-500">Max off</p>
          </div>
        </div>
        <div className="mt-3 flex justify-end border-t border-stone-100 pt-3">
          <PromoActions promo={p} />
        </div>
      </div>
    );
  }

  const columns: Column<PromoRow>[] = [
    {
      header: "Code",
      render: (p) => (
        <span className="rounded-md bg-stone-900 px-2.5 py-1 font-mono text-xs font-bold tracking-wide text-white">
          {p.code}
        </span>
      ),
    },
    {
      header: "% off",
      align: "right",
      render: (p) => <span className="font-semibold text-stone-900">{p.percent}%</span>,
    },
    {
      header: "Min order",
      align: "right",
      render: (p) => <span className="text-stone-500">{formatTk(p.minOrder)}</span>,
    },
    {
      header: "Max discount",
      align: "right",
      render: (p) => <span className="text-stone-500">{formatTk(p.maxDiscount)}</span>,
    },
    {
      header: "Active",
      render: (p) => <ActiveToggle promo={p} onToggle={toggleActive} />,
    },
    {
      header: "Actions",
      align: "right",
      render: (p) => <PromoActions promo={p} />,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        subtitle={`${initial.length} promo code${initial.length === 1 ? "" : "s"}`}
        actions={
          <button onClick={startCreate} className={primaryBtnClass}>
            + New promo
          </button>
        }
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-200">
          {error}
        </p>
      )}

      {editingId && (
        <Panel title={editingId === "new" ? "New promo code" : "Edit promo code"}>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className={labelClass}>Code *</label>
                <input
                  className={`${inputClass} font-mono uppercase`}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="EID20"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Percent off * (1–90)</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  className={inputClass}
                  value={form.percent}
                  onChange={(e) => setForm({ ...form, percent: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Min order (৳)</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={form.minOrder}
                  onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Max discount (৳)</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={form.maxDiscount}
                  onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                />
              </div>
              <div className="flex items-end pb-2.5">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-stone-700">
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
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={loading} className={primaryBtnClass}>
                {loading ? "Saving…" : "Save promo"}
              </button>
              <button type="button" onClick={() => setEditingId(null)} className={secondaryBtnClass}>
                Cancel
              </button>
            </div>
          </form>
        </Panel>
      )}

      <DataTable
        columns={columns}
        data={initial}
        keyOf={(p) => p.id}
        renderCard={(p) => <PromoCard promo={p} />}
        emptyMessage="No promo codes yet."
      />
    </div>
  );
}
