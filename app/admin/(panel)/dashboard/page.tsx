import Link from "next/link";
import { getDb } from "@/lib/db";


function formatTk(n: number): string {
  return `৳${n.toLocaleString("en-US")}`;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PACKED: "bg-violet-100 text-violet-800",
  SHIPPED: "bg-cyan-100 text-cyan-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function AdminDashboardPage() {
  const db = getDb();
  if (!db) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="font-medium text-stone-700">Database not configured.</p>
        <p className="mt-1 text-sm text-stone-500">
          Set DATABASE_URL to use the admin panel.
        </p>
      </div>
    );
  }

  const [
    revenueAgg,
    orderCount,
    pendingCount,
    productCount,
    customerCount,
    lowStockCount,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    db.order.aggregate({
      _sum: { total: true },
      where: { status: { not: "CANCELLED" } },
    }),
    db.order.count(),
    db.order.count({ where: { status: "PENDING" } }),
    db.product.count(),
    db.customer.count(),
    db.product.count({ where: { stock: { lt: 10 } } }),
    db.order.findMany({
      include: {
        customer: { select: { name: true, phone: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.orderItem.groupBy({
      by: ["productName"],
      _sum: { qty: true },
      orderBy: { _sum: { qty: "desc" } },
      take: 5,
    }),
  ]);

  // 7-day revenue (non-cancelled orders), oldest → newest.
  const days: { label: string; total: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      total: 0,
    });
  }
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);
  const weekOrders = await db.order.findMany({
    where: { createdAt: { gte: weekStart }, status: { not: "CANCELLED" } },
    select: { total: true, createdAt: true },
  });
  for (const o of weekOrders) {
    const idx = Math.floor(
      (new Date(o.createdAt).setHours(0, 0, 0, 0) - weekStart.getTime()) /
        86400000
    );
    if (idx >= 0 && idx < 7) days[idx].total += o.total;
  }
  const maxDay = Math.max(1, ...days.map((d) => d.total));

  const stats = [
    { label: "Total revenue", value: formatTk(revenueAgg._sum.total ?? 0), accent: true },
    { label: "Orders", value: String(orderCount) },
    { label: "Pending orders", value: String(pendingCount) },
    { label: "Products", value: String(productCount) },
    { label: "Customers", value: String(customerCount) },
    { label: "Low stock (<10)", value: String(lowStockCount) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl p-4 shadow-sm ${
              s.accent ? "bg-green-700 text-white" : "bg-white"
            }`}
          >
            <p className={`text-xs font-medium ${s.accent ? "text-green-100" : "text-stone-500"}`}>
              {s.label}
            </p>
            <p className={`mt-1 text-2xl font-extrabold ${s.accent ? "text-white" : "text-stone-900"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 7-day revenue chart */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-stone-900">Revenue — last 7 days</h2>
          <div className="flex h-40 items-end gap-2">
            {days.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-medium text-stone-500">
                  {d.total > 0 ? `৳${d.total >= 1000 ? `${(d.total / 1000).toFixed(1)}k` : d.total}` : ""}
                </span>
                <div
                  className="w-full rounded-t bg-green-600"
                  style={{ height: `${Math.max(4, (d.total / maxDay) * 100)}%` }}
                  title={`${d.label}: ৳${d.total.toLocaleString()}`}
                />
                <span className="text-xs text-stone-500">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-stone-900">Top products by quantity sold</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-stone-500">No sales yet.</p>
          ) : (
            <ul className="space-y-3">
              {topProducts.map((p) => (
                <li key={p.productName} className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-stone-700">{p.productName}</span>
                  <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">
                    {p._sum.qty ?? 0} sold
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-stone-900">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-green-700 hover:underline">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs uppercase text-stone-500">
                <th className="py-2 pr-3">Order</th>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Customer</th>
                <th className="py-2 pr-3">Items</th>
                <th className="py-2 pr-3 text-right">Total</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
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
                    })}
                  </td>
                  <td className="py-2.5 pr-3">{o.customer.name}</td>
                  <td className="py-2.5 pr-3 text-stone-500">{o._count.items}</td>
                  <td className="py-2.5 pr-3 text-right font-semibold">{formatTk(o.total)}</td>
                  <td className="py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[o.status] ?? "bg-stone-100 text-stone-600"}`}
                    >
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-stone-500">
                    No orders yet.
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
