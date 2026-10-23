import Link from "next/link";
import { getDb } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import DeleteButton from "@/components/admin/DeleteButton";


function formatTk(n: number): string {
  return `৳${n.toLocaleString("en-US")}`;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const category = (params.category ?? "").trim();

  const db = getDb();
  if (!db) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="font-medium text-stone-700">Database not configured.</p>
      </div>
    );
  }

  const [categories, products] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    (async () => {
      const where: Prisma.ProductWhereInput = {};
      if (q) {
        where.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
        ];
      }
      if (category) where.category = { slug: category };
      return db.product.findMany({
        where,
        include: { category: { select: { slug: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 500,
      });
    })(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
        >
          + New product
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name or slug…"
          className="w-full max-w-xs rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/20"
        />
        <select
          name="category"
          defaultValue={category}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-green-700"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
        >
          Filter
        </button>
      </form>

      {/* Table */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs uppercase text-stone-500">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3 text-right">Price</th>
                <th className="py-2 pr-3 text-right">Old price</th>
                <th className="py-2 pr-3 text-right">Stock</th>
                <th className="py-2 pr-3">Badge</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-stone-100 last:border-0">
                  <td className="py-2.5 pr-3">
                    <div className="font-medium text-stone-900">{p.name}</div>
                    <div className="text-xs text-stone-400">{p.slug}</div>
                  </td>
                  <td className="py-2.5 pr-3 text-stone-500">{p.category.name}</td>
                  <td className="py-2.5 pr-3 text-right font-semibold">{formatTk(p.price)}</td>
                  <td className="py-2.5 pr-3 text-right text-stone-400">
                    {p.oldPrice ? formatTk(p.oldPrice) : "—"}
                  </td>
                  <td
                    className={`py-2.5 pr-3 text-right font-semibold ${p.stock < 10 ? "text-red-600" : "text-stone-700"}`}
                  >
                    {p.stock}
                    {p.stock < 10 && <span className="ml-1 text-xs">⚠</span>}
                  </td>
                  <td className="py-2.5 pr-3">
                    {p.badge ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        {p.badge}
                      </span>
                    ) : (
                      <span className="text-stone-300">—</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="rounded-lg border border-stone-300 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        url={`/api/admin/products/${p.id}`}
                        label="Delete"
                        confirmMessage={`Delete "${p.name}"?`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-stone-500">
                    No products found.
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
