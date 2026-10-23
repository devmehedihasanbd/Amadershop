import Link from "next/link";
import { categoryProductCount } from "@/lib/products";
import type { Category } from "@/lib/products";
import ProductImage from "./ProductImage";

export default function CategoryCard({ category }: { category: Category }) {
  const count = categoryProductCount(category.slug);
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-stone-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-lg"
    >
      <ProductImage
        category={category.slug}
        name={category.name}
        className="h-20 w-20 rounded-2xl [&_svg]:h-10 [&_svg]:w-10 [&>span:first-child]:text-5xl"
      />
      <div>
        <p className="font-semibold text-stone-800 group-hover:text-green-700">
          {category.name}
        </p>
        <p className="text-xs text-stone-500">
          {category.tagline} · {count} items
        </p>
      </div>
    </Link>
  );
}
