import { getDb } from "@/lib/db";
import CategoryManager from "@/components/admin/CategoryManager";


export default async function AdminCategoriesPage() {
  const db = getDb();
  if (!db) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="font-medium text-stone-700">Database not configured.</p>
      </div>
    );
  }

  const categories = await db.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <CategoryManager
      initial={categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        tagline: c.description ?? "",
        image: c.image ?? "",
        sortOrder: c.sortOrder,
        productCount: c._count.products,
      }))}
    />
  );
}
