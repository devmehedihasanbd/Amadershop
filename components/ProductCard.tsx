"use client";

import Link from "next/link";
import { discountPercent, formatPrice } from "@/lib/products";
import type { Product } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import ProductImage from "./ProductImage";
import Stars from "./Stars";

const RIBBON: Record<string, string> = {
  "best-selling": "bg-amber-500",
  new: "bg-green-600",
  discount: "bg-red-500",
};

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, setOpen } = useCart();
  const pct = discountPercent(product);

  const ribbon =
    product.badge === "best-selling"
      ? { text: "Best Selling", cls: RIBBON["best-selling"] }
      : product.badge === "new"
        ? { text: "New Arrival", cls: RIBBON["new"] }
        : pct
          ? { text: `Save ${pct}%`, cls: RIBBON["discount"] }
          : null;

  const handleAdd = () => {
    addItem(product.slug, 1);
    setOpen(true);
  };

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-xl">
      <Link
        href={`/product/${product.slug}`}
        className="relative block overflow-hidden"
        aria-label={product.name}
      >
        <ProductImage
          category={product.category}
          name={product.name}
          className="aspect-square w-full transition duration-500 ease-out group-hover:scale-110"
        />
        {ribbon && (
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow ${ribbon.cls}`}
          >
            {ribbon.text}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 font-semibold leading-snug text-stone-800 transition group-hover:text-green-700"
        >
          {product.name}
        </Link>
        <p className="text-xs text-stone-500">{product.unit}</p>
        <div className="flex items-center gap-1.5">
          <Stars rating={product.rating} />
          <span className="text-xs text-stone-500">({product.reviews})</span>
        </div>
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <p className="text-lg font-extrabold text-green-700">
              {formatPrice(product.price)}
            </p>
            {product.oldPrice && (
              <p className="text-xs text-stone-400 line-through">
                {formatPrice(product.oldPrice)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-green-700 active:scale-95"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
