import Link from "next/link";
import { getDb } from "@/lib/db";
import { getPaymentMethods } from "@/lib/site-config";
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

function KpiIcon({ d }: { d: string }) {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={d} />
      </svg>
    </span>
  );
}

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

export default async function AdminDashboardPage() {
  const db = getDb();
  if (!db) {
    return (
      <EmptyState message="Database not configured. Set DATABASE_URL to use the admin panel." />
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
    activeBannerCount,
    activePromoCount,
    categoryCount,
    payMethods,
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
    db.banner.count({ where: { active: true } }),
    db.promo.count({ where: { active: true } }),
    db.category.count(),
    getPaymentMethods(),
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
  const weekTotal = days.reduce((s, d) => s + d.total, 0);

  const stats = [
    {
      label: "Total revenue",
      value: formatTk(revenueAgg._sum.total ?? 0),
      trend: `${formatTk(weekTotal)} this week`,
      icon: "M12 2v20m5-17H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
      accent: true,
    },
    {
      label: "Orders",
      value: String(orderCount),
      trend: `${pendingCount} awaiting action`,
      icon: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
    },
    {
      label: "Pending orders",
      value: String(pendingCount),
      trend: "Need confirmation",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      label: "Products",
      value: String(productCount),
      trend: `${lowStockCount} low on stock`,
      icon: "M20 7l-8-4-8 4v10l8 4 8-4zM12 3v8m0 0l8-4m-8 4L4 7m8 12v-8",
    },
    {
      label: "Customers",
      value: String(customerCount),
      trend: "Total registered",
      icon: "M16 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1m18 0v-1a4 4 0 00-3-3.87M13 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    },
    {
      label: "Low stock",
      value: String(lowStockCount),
      trend: "Below 10 units",
      icon: "M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader subtitle="Here's what's happening across your store today." />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border p-4 transition ${
              s.accent
                ? "border-green-700 bg-green-700 text-white"
                : "border-stone-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              {s.accent ? (
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={s.icon} />
                  </svg>
                </span>
              ) : (
                <KpiIcon d={s.icon} />
              )}
            </div>
            <p className={`mt-3 text-2xl font-extrabold tracking-tight ${s.accent ? "text-white" : "text-stone-900"}`}>
              {s.value}
            </p>
            <p className={`text-xs font-medium ${s.accent ? "text-green-100" : "text-stone-500"}`}>
              {s.label}
            </p>
            <p className={`mt-1 text-[11px] ${s.accent ? "text-green-200" : "text-stone-400"}`}>
              {s.trend}
            </p>
          </div>
        ))}
      </div>

      {/* Store controls — everything editable lives here */}
      <Panel
        title="Store controls"
        action={
          <span className="text-xs text-stone-400">
            Name, logo, banners, payments & more
          </span>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              href: "/admin/settings",
              title: "Site settings",
              desc: "Store name, logo, phone, WhatsApp, address, social links",
              icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 01-.1 1.2l2 1.6-2 3.4-2.4-1a7 7 0 01-2 1.2L14 20h-4l-.5-2.6a7 7 0 01-2-1.2l-2.4 1-2-3.4 2-1.6A7 7 0 015 12a7 7 0 01.1-1.2l-2-1.6 2-3.4 2.4 1a7 7 0 012-1.2L10 4h4l.5 2.6a7 7 0 012 1.2l2.4-1 2 3.4-2 1.6c.06.4.1.8.1 1.2z",
            },
            {
              href: "/admin/banners",
              title: "Banners",
              desc: `${activeBannerCount} active — hero slider & offer cards`,
              icon: "M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm0 4l4 4 3-3 4 4 5-5",
            },
            {
              href: "/admin/payments",
              title: "Payments & courier",
              desc: `${payMethods.filter((m) => m.enabled).length} payment methods on · Steadfast keys`,
              icon: "M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2zm0 3h18M7 14h4",
            },
            {
              href: "/admin/promos",
              title: "Promo codes",
              desc: `${activePromoCount} active promos — drives the welcome popup`,
              icon: "M3 9V7a2 2 0 012-2h14a2 2 0 012 2v2a2.5 2.5 0 000 5v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2.5 2.5 0 000-5zM13 5v2m0 3v2m0 3v2",
            },
            {
              href: "/admin/products",
              title: "Products",
              desc: `${productCount} products — photos, prices, stock`,
              icon: "M20 7l-8-4-8 4v10l8 4 8-4zM12 3v8m0 0l8-4m-8 4L4 7m8 12v-8",
            },
            {
              href: "/admin/categories",
              title: "Categories",
              desc: `${categoryCount} categories`,
              icon: "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z",
            },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group flex items-start gap-3 rounded-xl border border-stone-200 p-4 transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700 transition group-hover:bg-green-600 group-hover:text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={c.icon} />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block font-bold text-stone-900">
                  {c.title}
                  <span className="ml-1.5 font-semibold text-green-700 opacity-0 transition group-hover:opacity-100">
                    →
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-stone-500">{c.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 7-day revenue chart */}
        <Panel title="Revenue — last 7 days">
          <div className="flex h-44 items-end gap-2 sm:gap-3">
            {days.map((d) => (
              <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-[10px] font-semibold text-stone-500">
                  {d.total > 0
                    ? `৳${d.total >= 1000 ? `${(d.total / 1000).toFixed(1)}k` : d.total}`
                    : ""}
                </span>
                <div
                  className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-green-700 to-green-500"
                  style={{ height: `${Math.max(3, (d.total / maxDay) * 100)}%` }}
                  title={`${d.label}: ৳${d.total.toLocaleString()}`}
                />
                <span className="text-xs text-stone-500">{d.label}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Top products */}
        <Panel title="Top products by quantity sold">
          {topProducts.length === 0 ? (
            <p className="text-sm text-stone-500">No sales yet.</p>
          ) : (
            <ul className="space-y-3">
              {topProducts.map((p, i) => (
                <li key={p.productName} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-xs font-bold text-stone-600">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-stone-700">
                    {p.productName}
                  </span>
                  <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">
                    {p._sum.qty ?? 0} sold
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Recent orders */}
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
  );
}
