import Link from "next/link";
import { getDb } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import DeleteButton from "@/components/admin/DeleteButton";
import {
  DataTable,
  EmptyState,
  PageHeader,
  formatTk,
  inputClass,
  primaryBtnClass,
  type Column,
} from "@/components/admin/ui";

type ProductRow = Prisma.ProductGetPayload<{
  include: { category: { select: { slug: true; name: true } } };
}>;

function StockBadge({ stock }: { stock: number }) {
  const low = stock < 10;
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold ${
        low ? "text-red-600" : "text-stone-700"
      }`}
    >
      {stock}
      {low && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
        </svg>
      )}
    </span>
  );
}

function ProductActions({ product: p }: { product: ProductRow }) {
  return (
    <div className="flex justify-end gap-2">
      <Link
        href={`/admin/products/${p.id}/edit`}
        className="rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
      >
        Edit
      </Link>
      <DeleteButton
        url={`/api/admin/products/${p.id}`}
        label="Delete"
        confirmMessage={`Delete "${p.name}"?`}
      />
    </div>
  );
}

const columns: Column<ProductRow>[] = [
  {
    header: "Name",
    render: (p) => (
      <span>
        <span className="block font-medium text-stone-900">{p.name}</span>
        <span className="block text-xs text-stone-400">{p.slug}</span>
        {p.images.length > 0 && (
          <span className="mt-0.5 inline-block text-xs text-stone-500">
            📷 {p.images.length} photo{p.images.length === 1 ? "" : "s"}
          </span>
        )}
      </span>
    ),
  },
  {
    header: "Category",
    render: (p) => <span className="text-stone-500">{p.category.name}</span>,
  },
  {
    header: "Price",
    align: "right",
    render: (p) => <span className="font-semibold text-stone-900">{formatTk(p.price)}</span>,
  },
  {
    header: "Old price",
    align: "right",
    render: (p) => (
      <span className="text-stone-400">{p.oldPrice ? formatTk(p.oldPrice) : "—"}</span>
    ),
  },
  {
    header: "Stock",
    align: "right",
    render: (p) => <StockBadge stock={p.stock} />,
  },
  {
    header: "Badge",
    render: (p) =>
      p.badge ? (
        <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
          {p.badge}
        </span>
      ) : (
        <span className="text-stone-300">—</span>
      ),
  },
  {
    header: "Actions",
    align: "right",
    render: (p) => <ProductActions product={p} />,
  },
];

function ProductCard({ product: p }: { product: ProductRow }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-stone-900">{p.name}</p>
          <p className="truncate text-xs text-stone-400">{p.slug}</p>
          {p.images.length > 0 && (
            <p className="mt-0.5 text-xs text-stone-500">
              📷 {p.images.length} photo{p.images.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
        {p.badge && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
            {p.badge}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-stone-500">{p.category.name}</span>
        <span className="font-bold text-stone-900">
          {formatTk(p.price)}{" "}
          {p.oldPrice && (
            <span className="font-normal text-stone-400 line-through">
              {formatTk(p.oldPrice)}
            </span>
          )}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
        <span className="text-sm">
          Stock: <StockBadge stock={p.stock} />
        </span>
        <ProductActions product={p} />
      </div>
    </div>
  );
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
    return <EmptyState message="Database not configured." />;
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
      <PageHeader
        subtitle={`${products.length} product${products.length === 1 ? "" : "s"}`}
        actions={
          <Link href="/admin/products/new" className={primaryBtnClass}>
            + New product
          </Link>
        }
      />

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name or slug…"
          className={`${inputClass} w-full max-w-xs flex-1 sm:flex-none`}
        />
        <select
          name="category"
          defaultValue={category}
          className={`${inputClass} w-auto`}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className={primaryBtnClass}>
          Filter
        </button>
      </form>

      <DataTable
        columns={columns}
        data={products}
        keyOf={(p) => p.id}
        renderCard={(p) => <ProductCard product={p} />}
        emptyMessage="No products found."
      />
    </div>
  );
}
