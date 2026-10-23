import Link from "next/link";
import { getDb } from "@/lib/db";
import type { Prisma } from "@prisma/client";


const TABS = ["All", "PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PACKED: "bg-violet-100 text-violet-800",
  SHIPPED: "bg-cyan-100 text-cyan-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
};

function formatTk(n: number): string {
  return `৳${n.toLocaleString("en-US")}`;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const status = (params.status ?? "All").toUpperCase();
  const q = (params.q ?? "").trim();

  const db = getDb();
  if (!db) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="font-medium text-stone-700">Database not configured.</p>
      </div>
    );
  }

  const where: Prisma.OrderWhereInput = {};
  if ((TABS as readonly string[]).includes(status) && status !== "All") {
    where.status = status as Exclude<(typeof TABS)[number], "All">;
  }
  if (q) {
    const digits = q.replace(/\D/g, "");
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      ...(digits.length >= 6 ? [{ customer: { phone: { contains: digits } } }] : []),
    ];
  }

  const orders = await db.order.findMany({
    where,
    include: {
      customer: { select: { name: true, phone: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const tabHref = (tab: string) => {
    const sp = new URLSearchParams();
    if (tab !== "All") sp.set("status", tab);
    if (q) sp.set("q", q);
    const s = sp.toString();
    return `/admin/orders${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-stone-900">Orders</h1>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        {status !== "All" && <input type="hidden" name="status" value={status} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search order number or phone…"
          className="w-full max-w-sm rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/20"
        />
        <button
          type="submit"
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
        >
          Search
        </button>
      </form>

      {/* Status tabs */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {TABS.map((tab) => {
          const active = status === tab.toUpperCase();
          return (
            <Link
              key={tab}
              href={tabHref(tab)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-green-700 text-white"
                  : "bg-white text-stone-600 hover:bg-stone-200"
              }`}
            >
              {tab === "All" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs uppercase text-stone-500">
                <th className="py-2 pr-3">Order</th>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Customer</th>
                <th className="py-2 pr-3">Items</th>
                <th className="py-2 pr-3 text-right">Total</th>
                <th className="py-2 pr-3">Payment</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-stone-100 last:border-0">
                  <td className="py-2.5 pr-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-medium text-green-700 hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-3 text-stone-500">
                    {new Date(o.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-2.5 pr-3">
                    <div>{o.customer.name}</div>
                    <div className="text-xs text-stone-500">{o.customer.phone}</div>
                  </td>
                  <td className="py-2.5 pr-3 text-stone-500">{o._count.items}</td>
                  <td className="py-2.5 pr-3 text-right font-semibold">{formatTk(o.total)}</td>
                  <td className="py-2.5 pr-3 text-stone-500">{o.paymentMethod}</td>
                  <td className="py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[o.status] ?? "bg-stone-100 text-stone-600"}`}
                    >
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-stone-500">
                    No orders found.
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
