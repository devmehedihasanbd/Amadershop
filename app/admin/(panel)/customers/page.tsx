import { getDb } from "@/lib/db";
import type { Prisma } from "@prisma/client";


function formatTk(n: number): string {
  return `৳${n.toLocaleString("en-US")}`;
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
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="font-medium text-stone-700">Database not configured.</p>
      </div>
    );
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
      <h1 className="text-2xl font-bold text-stone-900">Customers</h1>

      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name or phone…"
          className="w-full max-w-sm rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/20"
        />
        <button
          type="submit"
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
        >
          Search
        </button>
      </form>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs uppercase text-stone-500">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Phone</th>
                <th className="py-2 pr-3">Address</th>
                <th className="py-2 pr-3 text-right">Orders</th>
                <th className="py-2 text-right">Total spent</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const spent = c.orders
                  .filter((o) => o.status !== "CANCELLED")
                  .reduce((s, o) => s + o.total, 0);
                return (
                  <tr key={c.id} className="border-b border-stone-100 last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-stone-900">{c.name}</td>
                    <td className="py-2.5 pr-3 text-stone-600">{c.phone}</td>
                    <td className="py-2.5 pr-3 text-stone-500">
                      {c.address}, {c.area}
                    </td>
                    <td className="py-2.5 pr-3 text-right">{c._count.orders}</td>
                    <td className="py-2.5 text-right font-semibold">{formatTk(spent)}</td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-stone-500">
                    No customers found.
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
