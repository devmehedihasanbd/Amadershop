"use client";

import { useState } from "react";
import Link from "next/link";
import { discountPercent, formatPrice, getCategory } from "@/lib/products";
import type { Product } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import ProductImage from "@/components/ProductImage";
import Stars from "@/components/Stars";

function ProductGallery({ product }: { product: Product }) {
  const photos = product.images ?? [];
  const [active, setActive] = useState(0);
  const current = photos[Math.min(active, photos.length - 1)];

  return (
    <div>
      <div className="relative">
        {current ? (
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <ProductImage
            category={product.category}
            name={product.name}
            className="aspect-square w-full rounded-3xl"
          />
        )}
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
        {photos.length > 1 && (
          <span className="absolute bottom-4 right-4 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
            {Math.min(active, photos.length - 1) + 1} / {photos.length}
          </span>
        )}
      </div>
      {photos.length > 1 && (
        <div className="mt-3 flex gap-2.5">
          {photos.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1}`}
              className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                i === active
                  ? "border-green-600"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
    <>
      {/* sticky add-to-cart bar — mobile app feel (sits above the tab bar) */}
      <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-30 border-t border-stone-200 bg-white/95 px-4 pb-2 pt-2 backdrop-blur-lg md:hidden">
        <div className="flex items-center gap-3">
          <ProductImage
            category={product.category}
            name={product.name}
            images={product.images}
            className="h-11 w-11 shrink-0 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-stone-800">
              {product.name}
            </p>
            <p className="text-sm font-extrabold text-green-700">
              {formatPrice(product.price)}
              <span className="ml-1 text-xs font-normal text-stone-500">
                / {product.unit}
              </span>
            </p>
          </div>
          <div className="flex shrink-0 items-center rounded-full border border-stone-200">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex min-h-[40px] min-w-[40px] items-center justify-center text-lg text-stone-600"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-bold">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              className="flex min-h-[40px] min-w-[40px] items-center justify-center text-lg text-stone-600"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="shrink-0 rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow transition active:scale-95"
          >
            Add
          </button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
      <ProductGallery product={product} />

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

        {/* desktop add-to-cart row — on mobile the sticky bar handles it */}
        <div className="mt-5 hidden items-center gap-3 md:flex">
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
              className="flex min-h-[44px] min-w-[44px] items-center justify-center text-lg text-stone-600 hover:text-green-700"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-8 text-center font-bold">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center text-lg text-stone-600 hover:text-green-700"
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
    </>
  );
}
