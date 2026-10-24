import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import ProductForm, { type ProductFormData } from "@/components/admin/ProductForm";


export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  if (!db) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="font-medium text-stone-700">Database not configured.</p>
      </div>
    );
  }

  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id } }),
    db.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
  ]);
  if (!product) notFound();

  const details = Array.isArray(product.details)
    ? (product.details as unknown[]).filter((d): d is string => typeof d === "string")
    : [];

  const initial: ProductFormData = {
    name: product.name,
    slug: product.slug,
    categorySlug: categories.find((c) => c.slug)?.slug ?? "",
    price: String(product.price),
    oldPrice: product.oldPrice != null ? String(product.oldPrice) : "",
    unit: product.unit,
    stock: String(product.stock),
    badge: product.badge ?? "",
    rating: String(product.rating),
    description: product.description,
    details: details.join("\n"),
    images: Array.isArray(product.images)
      ? (product.images as unknown[]).filter((u): u is string => typeof u === "string")
      : [],
  };
  // Resolve the actual category slug from the product's categoryId.
  const cat = await db.category.findUnique({
    where: { id: product.categoryId },
    select: { slug: true },
  });
  initial.categorySlug = cat?.slug ?? "";

  return (
    <div className="space-y-4">
      <ProductForm initial={initial} categories={categories} productId={product.id} />
    </div>
  );
}
