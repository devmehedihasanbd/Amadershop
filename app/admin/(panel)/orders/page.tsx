import Link from "next/link";
import { getDb } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import {
  DataTable,
  EmptyState,
  PageHeader,
  StatusPill,
  formatTk,
  inputClass,
  primaryBtnClass,
  type Column,
} from "@/components/admin/ui";

const TABS = ["All", "PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

type OrderRow = Prisma.OrderGetPayload<{
  include: {
    customer: { select: { name: true; phone: true } };
    _count: { select: { items: true } };
  };
}>;

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const columns: Column<OrderRow>[] = [
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
    render: (o) => <span className="text-stone-500">{formatDate(o.createdAt)}</span>,
  },
  {
    header: "Customer",
    render: (o) => (
      <span>
        <span className="block font-medium text-stone-900">{o.customer.name}</span>
        <span className="block text-xs text-stone-500">{o.customer.phone}</span>
      </span>
    ),
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
    header: "Payment",
    render: (o) => <span className="text-stone-500">{o.paymentMethod}</span>,
  },
  {
    header: "Status",
    align: "right",
    render: (o) => <StatusPill status={o.status} />,
  },
];

function OrderCard({ order: o }: { order: OrderRow }) {
  return (
    <Link href={`/admin/orders/${o.id}`} className="block">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-green-700">{o.orderNumber}</span>
        <StatusPill status={o.status} />
      </div>
      <div className="mt-2 space-y-1 text-sm">
        <p className="font-medium text-stone-900">
          {o.customer.name} <span className="font-normal text-stone-500">· {o.customer.phone}</span>
        </p>
        <p className="text-xs text-stone-500">{formatDate(o.createdAt)}</p>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3 text-sm">
        <span className="text-stone-500">
          {o._count.items} items · {o.paymentMethod}
        </span>
        <span className="text-base font-bold text-stone-900">{formatTk(o.total)}</span>
      </div>
    </Link>
  );
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
    return <EmptyState message="Database not configured." />;
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
      <PageHeader
        subtitle={`${orders.length} order${orders.length === 1 ? "" : "s"}`}
      />

      {/* Search */}
      <form method="GET" className="flex gap-2">
        {status !== "All" && <input type="hidden" name="status" value={status} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search order number or phone…"
          className={`${inputClass} max-w-sm`}
        />
        <button type="submit" className={primaryBtnClass}>
          Search
        </button>
      </form>

      {/* Status tabs */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((tab) => {
          const active = status === tab.toUpperCase();
          return (
            <Link
              key={tab}
              href={tabHref(tab)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-stone-900 text-white"
                  : "bg-white text-stone-600 ring-1 ring-inset ring-stone-200 hover:bg-stone-100"
              }`}
            >
              {tab === "All" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Link>
          );
        })}
      </div>

      <DataTable
        columns={columns}
        data={orders}
        keyOf={(o) => o.id}
        renderCard={(o) => <OrderCard order={o} />}
        emptyMessage="No orders found."
      />
    </div>
  );
}
