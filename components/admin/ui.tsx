import type { ReactNode } from "react";

/* Shared admin UI primitives — Shopify-style, professional. */

export function formatTk(n: number): string {
  return `৳${n.toLocaleString("en-US")}`;
}

/* ------------------------------------------------------------------ */
/* Page header: subtitle + actions. The section title lives in the      */
/* AdminShell topbar, so pages only render this toolbar row.            */
/* ------------------------------------------------------------------ */
export function PageHeader({
  subtitle,
  actions,
}: {
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  if (!subtitle && !actions) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {subtitle ? (
        <p className="text-sm text-stone-500">{subtitle}</p>
      ) : (
        <span />
      )}
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Status pill                                                         */
/* ------------------------------------------------------------------ */
const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 ring-amber-200",
  CONFIRMED: "bg-blue-100 text-blue-800 ring-blue-200",
  PACKED: "bg-violet-100 text-violet-800 ring-violet-200",
  SHIPPED: "bg-cyan-100 text-cyan-800 ring-cyan-200",
  DELIVERED: "bg-green-100 text-green-800 ring-green-200",
  CANCELLED: "bg-red-100 text-red-700 ring-red-200",
};

export function StatusPill({ status }: { status: string }) {
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        STATUS_STYLES[status] ?? "bg-stone-100 text-stone-600 ring-stone-200"
      }`}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
      <p className="text-sm font-medium text-stone-500">{message}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DataTable — desktop table, mobile stacked cards.                    */
/* ------------------------------------------------------------------ */
export type Column<T> = {
  header: string;
  align?: "left" | "right" | "center";
  render: (item: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyOf: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  emptyMessage: string;
};

export function DataTable<T>({
  columns,
  data,
  keyOf,
  renderCard,
  emptyMessage,
}: DataTableProps<T>) {
  if (data.length === 0) return <EmptyState message={emptyMessage} />;

  const alignClass = (align?: "left" | "right" | "center") =>
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return (
    <>
      {/* Desktop: proper table */}
      <div className="hidden overflow-hidden rounded-xl border border-stone-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/70">
              {columns.map((c, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-500 ${alignClass(c.align)} ${
                    i === 0 ? "pl-5" : ""
                  } ${i === columns.length - 1 ? "pr-5" : ""}`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {data.map((item) => (
              <tr key={keyOf(item)} className="transition hover:bg-stone-50/80">
                {columns.map((c, i) => (
                  <td
                    key={i}
                    className={`px-4 py-3.5 ${alignClass(c.align)} ${
                      i === 0 ? "pl-5" : ""
                    } ${i === columns.length - 1 ? "pr-5" : ""}`}
                  >
                    {c.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-3 md:hidden">
        {data.map((item) => (
          <div
            key={keyOf(item)}
            className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            {renderCard(item)}
          </div>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Panel — white content card                                          */
/* ------------------------------------------------------------------ */
export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-stone-200 bg-white ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
          {typeof title === "string" ? (
            <h2 className="font-semibold text-stone-900">{title}</h2>
          ) : (
            title
          )}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Shared form styles                                                  */
/* ------------------------------------------------------------------ */
export const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-green-700 focus:ring-2 focus:ring-green-700/20";

export const labelClass = "mb-1.5 block text-sm font-medium text-stone-700";

export const primaryBtnClass =
  "rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryBtnClass =
  "rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100";
