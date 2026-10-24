import Link from "next/link";
import { getDb } from "@/lib/db";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Panel,
  StatusPill,
  formatTk,
  type Column,
} from "@/components/admin/ui";

type RecentOrder = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  total: number;
  status: string;
  customer: { name: string };
  _count: { items: number };
};

const orderColumns: Column<RecentOrder>[] = [
  {
    header: "Order",
    render: (o) => (
      <Link
        href={`/admin/orders/${o.id}`}
        className="font-semibold text-green-700 hover:underline"
      >
        {o.orderNumber}
      </Link>
    ),
  },
  {
    header: "Date",
    render: (o) => (
      <span className="text-stone-500">
        {new Date(o.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })}
      </span>
    ),
  },
  {
    header: "Customer",
    render: (o) => <span className="text-stone-700">{o.customer.name}</span>,
  },
  {
    header: "Items",
    align: "right",
    render: (o) => <span className="text-stone-500">{o._count.items}</span>,
  },
  {
    header: "Total",
    align: "right",
    render: (o) => <span className="font-semibold text-stone-900">{formatTk(o.total)}</span>,
  },
  {
    header: "Status",
    align: "right",
    render: (o) => <StatusPill status={o.status} />,
  },
];

function OrderCard({ order: o }: { order: RecentOrder }) {
  return (
    <Link href={`/admin/orders/${o.id}`} className="block">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-green-700">{o.orderNumber}</span>
        <StatusPill status={o.status} />
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-stone-600">
          {o.customer.name} · {o._count.items} items
        </span>
        <span className="font-bold text-stone-900">{formatTk(o.total)}</span>
      </div>
      <p className="mt-1 text-xs text-stone-400">
        {new Date(o.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })}
      </p>
    </Link>
  );
}

/** ▲/▼ pill comparing this week with the previous week. */
function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous <= 0) {
    return (
      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-stone-500">
        new
      </span>
    );
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  const up = pct >= 0;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
        up ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
      }`}
    >
      {up ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}

const DONUT_COLORS = [
  "#15803d", // green-700
  "#16a34a", // green-600
  "#4ade80", // green-400
  "#86efac", // green-300
  "#f59e0b", // amber-500
  "#fbbf24", // amber-400
  "#a16207", // yellow-700
  "#78716c", // stone-500
];

function CategoryDonut({ data }: { data: { name: string; revenue: number }[] }) {
  const total = data.reduce((s, d) => s + d.revenue, 0);
  if (total <= 0) {
    return <p className="text-sm text-stone-500">No sales yet.</p>;
  }
  const R = 54;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const segments = data.slice(0, 8).map((d, i) => {
    const frac = d.revenue / total;
    const seg = { ...d, dash: frac * C, offset: acc, color: DONUT_COLORS[i % DONUT_COLORS.length] };
    acc += frac * C;
    return seg;
  });
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
      <div className="relative shrink-0">
        <svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="Sales by category">
          <circle cx="80" cy="80" r={R} fill="none" stroke="#f5f5f4" strokeWidth="26" />
          {segments.map((s) => (
            <circle
              key={s.name}
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="26"
              strokeDasharray={`${Math.max(0, s.dash - 2)} ${C - Math.max(0, s.dash - 2)}`}
              strokeDashoffset={-s.offset}
              transform="rotate(-90 80 80)"
              strokeLinecap="butt"
            >
              <title>{`${s.name}: ${formatTk(s.revenue)}`}</title>
            </circle>
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold text-stone-900">{formatTk(total)}</span>
          <span className="text-[11px] text-stone-500">Total sales</span>
        </div>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-2.5">
        {segments.map((s) => (
          <li key={s.name} className="flex items-center gap-2.5 text-sm">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="min-w-0 flex-1 truncate text-stone-600">{s.name}</span>
            <span className="shrink-0 font-bold text-stone-900">{formatTk(s.revenue)}</span>
            <span className="w-11 shrink-0 text-right text-xs text-stone-400">
              {Math.round((s.revenue / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function shortTk(n: number): string {
  return n >= 1000 ? `৳${(n / 1000).toFixed(1)}k` : `৳${n}`;
}

export default async function AdminDashboardPage() {
  const db = getDb();
  if (!db) {
    return (
      <EmptyState message="Database not configured. Set DATABASE_URL to use the admin panel." />
    );
  }

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const [
    revenueAgg,
    orderCount,
    pendingCount,
    productCount,
    customerCount,
    lowStockCount,
    recentOrders,
    topProducts,
    weekOrders,
    prevWeekOrders,
    newCustomersWeek,
    soldItems,
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
      where: { order: { status: { not: "CANCELLED" } } },
      orderBy: { _sum: { qty: "desc" } },
      take: 5,
    }),
    db.order.findMany({
      where: { createdAt: { gte: weekStart }, status: { not: "CANCELLED" } },
      select: { total: true, createdAt: true },
    }),
    db.order.findMany({
      where: {
        createdAt: { gte: prevWeekStart, lt: weekStart },
        status: { not: "CANCELLED" },
      },
      select: { total: true },
    }),
    db.customer.count({ where: { createdAt: { gte: weekStart } } }),
    db.orderItem.findMany({
      where: { order: { status: { not: "CANCELLED" } } },
      select: {
        qty: true,
        unitPrice: true,
        product: { select: { category: { select: { name: true } } } },
      },
    }),
  ]);

  // 7-day revenue, oldest → newest.
  const days: { label: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      total: 0,
    });
  }
  for (const o of weekOrders) {
    const idx = Math.floor(
      (new Date(o.createdAt).setHours(0, 0, 0, 0) - weekStart.getTime()) / 86400000
    );
    if (idx >= 0 && idx < 7) days[idx].total += o.total;
  }
  const maxDay = Math.max(1, ...days.map((d) => d.total));
  const weekTotal = days.reduce((s, d) => s + d.total, 0);
  const weekOrderCount = weekOrders.length;
  const prevWeekTotal = prevWeekOrders.reduce((s, o) => s + o.total, 0);
  const prevWeekOrderCount = prevWeekOrders.length;

  // Sales by category (revenue).
  const byCat = new Map<string, number>();
  for (const it of soldItems) {
    const name = it.product?.category?.name ?? "Other";
    byCat.set(name, (byCat.get(name) ?? 0) + it.qty * it.unitPrice);
  }
  const catSales = [...byCat.entries()]
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  const maxTopQty = Math.max(1, ...topProducts.map((p) => p._sum.qty ?? 0));

  const kpis = [
    {
      label: "Total revenue",
      value: formatTk(revenueAgg._sum.total ?? 0),
      sub: `${formatTk(weekTotal)} this week`,
      trend: <TrendBadge current={weekTotal} previous={prevWeekTotal} />,
      icon: "M12 2v20m5-17H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
      accent: true,
    },
    {
      label: "Orders",
      value: String(orderCount),
      sub: `${weekOrderCount} this week · ${pendingCount} pending`,
      trend: <TrendBadge current={weekOrderCount} previous={prevWeekOrderCount} />,
      icon: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
    },
    {
      label: "Customers",
      value: String(customerCount),
      sub: `${newCustomersWeek} new this week`,
      icon: "M16 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1m18 0v-1a4 4 0 00-3-3.87M13 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    },
    {
      label: "Products",
      value: String(productCount),
      sub: lowStockCount > 0 ? `${lowStockCount} low on stock` : "Stock looks healthy",
      icon: "M20 7l-8-4-8 4v10l8 4 8-4zM12 3v8m0 0l8-4m-8 4L4 7m8 12v-8",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader subtitle="Here's what's happening across your store today." />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
              k.accent
                ? "border-green-700 bg-gradient-to-br from-green-700 to-green-800 text-white"
                : "border-stone-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  k.accent ? "bg-white/15 text-white" : "bg-green-100 text-green-700"
                }`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={k.icon} />
                </svg>
              </span>
              {k.trend}
            </div>
            <p className={`mt-4 text-3xl font-extrabold tracking-tight ${k.accent ? "text-white" : "text-stone-900"}`}>
              {k.value}
            </p>
            <p className={`text-xs font-semibold uppercase tracking-wide ${k.accent ? "text-green-100" : "text-stone-500"}`}>
              {k.label}
            </p>
            <p className={`mt-1 text-xs ${k.accent ? "text-green-200" : "text-stone-400"}`}>
              {k.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Revenue chart */}
        <div className="lg:col-span-3">
          <Panel
            title="Revenue — last 7 days"
            action={
              <span className="text-sm font-bold text-green-700">{formatTk(weekTotal)}</span>
            }
          >
            <div className="flex h-48 items-end gap-2 sm:gap-3">
              {days.map((d, i) => {
                const isPeak = d.total === maxDay && d.total > 0;
                return (
                  <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                    <span className={`text-[10px] font-bold ${isPeak ? "text-green-700" : "text-stone-400"}`}>
                      {d.total > 0 ? shortTk(d.total) : ""}
                    </span>
                    <div
                      className={`w-full max-w-12 rounded-t-lg transition-all ${
                        isPeak
                          ? "bg-gradient-to-t from-green-800 to-green-500 shadow-md"
                          : i === days.length - 1
                            ? "bg-gradient-to-t from-amber-500 to-amber-300"
                            : "bg-gradient-to-t from-green-700/70 to-green-500/70"
                      }`}
                      style={{ height: `${Math.max(3, (d.total / maxDay) * 100)}%` }}
                      title={`${d.label}: ৳${d.total.toLocaleString()}`}
                    />
                    <span className={`text-xs ${i === days.length - 1 ? "font-bold text-stone-700" : "text-stone-500"}`}>
                      {i === days.length - 1 ? "Today" : d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* Sales by category donut */}
        <div className="lg:col-span-2">
          <Panel title="Sales by category">
            <CategoryDonut data={catSales} />
          </Panel>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Top products */}
        <div className="lg:col-span-2">
          <Panel title="Top products">
            {topProducts.length === 0 ? (
              <p className="text-sm text-stone-500">No sales yet.</p>
            ) : (
              <ul className="space-y-4">
                {topProducts.map((p, i) => {
                  const qty = p._sum.qty ?? 0;
                  return (
                    <li key={p.productName}>
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-100 text-xs font-extrabold text-green-800">
                            {i + 1}
                          </span>
                          <span className="truncate font-medium text-stone-700">
                            {p.productName}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs font-bold text-stone-500">
                          {qty} sold
                        </span>
                      </div>
                      <div className="ml-9 mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400"
                          style={{ width: `${Math.max(4, (qty / maxTopQty) * 100)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        {/* Recent orders */}
        <div className="lg:col-span-3">
          <Panel
            title="Recent orders"
            action={
              <Link href="/admin/orders" className="text-sm font-semibold text-green-700 hover:underline">
                View all →
              </Link>
            }
          >
            <DataTable
              columns={orderColumns}
              data={recentOrders}
              keyOf={(o) => o.id}
              renderCard={(o) => <OrderCard order={o} />}
              emptyMessage="No orders yet."
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
