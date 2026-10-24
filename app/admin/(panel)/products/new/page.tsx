import { getDb } from "@/lib/db";
import ProductForm, { type ProductFormData } from "@/components/admin/ProductForm";


const EMPTY: ProductFormData = {
  name: "",
  slug: "",
  categorySlug: "",
  price: "",
  oldPrice: "",
  unit: "",
  stock: "100",
  badge: "",
  rating: "4.5",
  description: "",
  details: "",
  images: [],
};

export default async function AdminProductNewPage() {
  const db = getDb();
  if (!db) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="font-medium text-stone-700">Database not configured.</p>
      </div>
    );
  }
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true },
  });

  return (
    <div className="space-y-4">
      <ProductForm initial={EMPTY} categories={categories} />
    </div>
  );
}
