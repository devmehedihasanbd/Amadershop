"use client";

import { useState } from "react";
import Link from "next/link";
import { discountPercent, formatPrice, getCategory } from "@/lib/products";
import type { Product } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import ProductImage from "@/components/ProductImage";
import Stars from "@/components/Stars";

export default function ProductDetail({ product }: { product: Product }) {
  const { addItem, setOpen } = useCart();
  const [qty, setQty] = useState(1);
  const pct = discountPercent(product);
  const category = getCategory(product.category);

  const handleAdd = () => {
    addItem(product.slug, qty);
    setOpen(true);
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="relative">
        <ProductImage
          category={product.category}
          name={product.name}
          className="aspect-square w-full rounded-3xl"
        />
        {product.badge === "best-selling" && (
          <span className="absolute left-4 top-4 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow">
            Best Selling
          </span>
        )}
        {product.badge === "new" && (
          <span className="absolute left-4 top-4 rounded-full bg-green-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow">
            New Arrival
          </span>
        )}
      </div>

      <div>
        <p className="text-sm text-stone-500">
          Home /{" "}
          <Link
            href={`/category/${product.category}`}
            className="text-green-700 hover:underline"
          >
            {category?.name}
          </Link>
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-stone-800">
          {product.name}
        </h1>
        <p className="mt-1 text-sm text-stone-500">{product.unit}</p>

        <div className="mt-3 flex items-center gap-2">
          <Stars rating={product.rating} className="h-5 w-5" />
          <span className="text-sm font-semibold text-stone-700">
            {product.rating.toFixed(1)}
          </span>
          <span className="text-sm text-stone-500">
            ({product.reviews} reviews)
          </span>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <p className="text-3xl font-extrabold text-green-700">
            {formatPrice(product.price)}
          </p>
          {product.oldPrice && (
            <>
              <p className="text-lg text-stone-400 line-through">
                {formatPrice(product.oldPrice)}
              </p>
              {pct && (
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600">
                  Save {pct}%
                </span>
              )}
            </>
          )}
        </div>

        <p className="mt-5 leading-relaxed text-stone-600">{product.short}</p>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex items-center rounded-full border-2 border-stone-200">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="px-4 py-2 text-lg text-stone-600 hover:text-green-700"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-8 text-center font-bold">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              className="px-4 py-2 text-lg text-stone-600 hover:text-green-700"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 rounded-full bg-green-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-green-700 active:scale-95"
          >
            Add to Cart
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
          <p className="font-bold text-green-800">Delivery info</p>
          <ul className="mt-2 space-y-1.5 text-sm text-stone-600">
            <li>· Inside Dhaka: delivery within 24 hours</li>
            <li>· Outside Dhaka: delivery within 48–72 hours</li>
            <li>· Delivery charge ৳60 — free on orders over ৳2000</li>
            <li>· Cash on Delivery available</li>
          </ul>
        </div>

        <div className="mt-6">
          <p className="font-bold text-stone-800">Product details</p>
          <ul className="mt-2 space-y-1.5 text-sm text-stone-600">
            {product.details.map((d) => (
              <li key={d} className="flex gap-2">
                <span className="text-green-600">✓</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
