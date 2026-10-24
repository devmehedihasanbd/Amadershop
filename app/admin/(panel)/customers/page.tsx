import { getDb } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import {
  DataTable,
  EmptyState,
  PageHeader,
  formatTk,
  inputClass,
  primaryBtnClass,
  type Column,
} from "@/components/admin/ui";

type CustomerRow = Prisma.CustomerGetPayload<{
  include: {
    _count: { select: { orders: true } };
    orders: { select: { total: true; status: true } };
  };
}>;

function spentOf(c: CustomerRow): number {
  return c.orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((s, o) => s + o.total, 0);
}

const columns: Column<CustomerRow>[] = [
  {
    header: "Name",
    render: (c) => <span className="font-medium text-stone-900">{c.name}</span>,
  },
  {
    header: "Phone",
    render: (c) => <span className="text-stone-600">{c.phone}</span>,
  },
  {
    header: "Address",
    render: (c) => (
      <span className="text-stone-500">
        {c.address}, {c.area}
      </span>
    ),
  },
  {
    header: "Orders",
    align: "right",
    render: (c) => <span className="text-stone-600">{c._count.orders}</span>,
  },
  {
    header: "Total spent",
    align: "right",
    render: (c) => <span className="font-semibold text-stone-900">{formatTk(spentOf(c))}</span>,
  },
];

function CustomerCard({ customer: c }: { customer: CustomerRow }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-800">
          {c.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-stone-900">{c.name}</p>
          <p className="truncate text-xs text-stone-500">{c.phone}</p>
        </div>
      </div>
      <p className="mt-2 truncate text-sm text-stone-500">
        {c.address}, {c.area}
      </p>
      <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3 text-sm">
        <span className="text-stone-500">{c._count.orders} orders</span>
        <span className="font-bold text-stone-900">{formatTk(spentOf(c))}</span>
      </div>
    </div>
  );
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();

  const db = getDb();
  if (!db) {
    return <EmptyState message="Database not configured." />;
  }

  const where: Prisma.CustomerWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q.replace(/\D/g, "") || q } },
    ];
  }

  const customers = await db.customer.findMany({
    where,
    include: {
      _count: { select: { orders: true } },
      orders: { select: { total: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return (
    <div className="space-y-4">
      <PageHeader
        subtitle={`${customers.length} customer${customers.length === 1 ? "" : "s"}`}
      />

      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name or phone…"
          className={`${inputClass} max-w-sm`}
        />
        <button type="submit" className={primaryBtnClass}>
          Search
        </button>
      </form>

      <DataTable
        columns={columns}
        data={customers}
        keyOf={(c) => c.id}
        renderCard={(c) => <CustomerCard customer={c} />}
        emptyMessage="No customers found."
      />
    </div>
  );
}
