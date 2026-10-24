"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/products";
import ProductImage from "@/components/ProductImage";

export const FREE_DELIVERY_THRESHOLD = 2000;
export const DELIVERY_CHARGE = 60;

export default function CartPage() {
  const { lines, setQty, removeItem, clear, subtotal, resolveProduct } = useCart();

  const delivery =
    lines.length === 0
      ? 0
      : subtotal >= FREE_DELIVERY_THRESHOLD
        ? 0
        : DELIVERY_CHARGE;
  const total = subtotal + delivery;

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-green-700" aria-hidden="true">
            <circle cx="9" cy="20" r="1.5" />
            <circle cx="17" cy="20" r="1.5" />
            <path d="M2 3h3l2.6 12.4a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L20.5 7H6" />
          </svg>
        </span>
        <h1 className="mt-6 text-2xl font-extrabold text-stone-800">
          Your cart is empty
        </h1>
        <p className="mt-2 text-stone-500">
          Browse our fresh categories and add something delicious.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-full bg-green-600 px-7 py-3 font-semibold text-white hover:bg-green-700"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-stone-800">Your Cart</h1>
        <button
          type="button"
          onClick={clear}
          className="text-sm text-stone-500 hover:text-red-600"
        >
          Clear all
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <ul className="space-y-4 lg:col-span-2">
          {lines.map((line) => {
            const p = resolveProduct(line.slug);
            if (!p) return null;
            return (
              <li
                key={line.slug}
                className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
              >
                <Link href={`/product/${p.slug}`} className="shrink-0">
                  <ProductImage
                    category={p.category}
                    name={p.name}
                    images={p.images}
                    className="h-24 w-24 rounded-2xl"
                  />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/product/${p.slug}`}
                        className="font-semibold text-stone-800 hover:text-green-700"
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs text-stone-500">
                        {formatPrice(p.price)} · {p.unit}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(line.slug)}
                      className="rounded-full p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${p.name}`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                        <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center rounded-full border border-stone-200">
                      <button
                        type="button"
                        onClick={() => setQty(line.slug, line.qty - 1)}
                        className="flex min-h-[40px] min-w-[40px] items-center justify-center text-lg text-stone-600 hover:text-green-700"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-bold">
                        {line.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(line.slug, line.qty + 1)}
                        className="flex min-h-[40px] min-w-[40px] items-center justify-center text-lg text-stone-600 hover:text-green-700"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-extrabold text-green-700">
                      {formatPrice(p.price * line.qty)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-stone-800">Order Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-500">Subtotal</dt>
              <dd className="font-semibold">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Delivery</dt>
              <dd className="font-semibold">
                {delivery === 0 ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  formatPrice(delivery)
                )}
              </dd>
            </div>
            {delivery > 0 && (
              <p className="text-xs text-stone-500">
                Add {formatPrice(FREE_DELIVERY_THRESHOLD - subtotal)} more for
                free delivery.
              </p>
            )}
            <div className="flex justify-between border-t border-stone-200 pt-3 text-base">
              <dt className="font-bold">Total</dt>
              <dd className="font-extrabold text-green-700">
                {formatPrice(total)}
              </dd>
            </div>
          </dl>
          <Link
            href="/checkout"
            className="mt-5 block rounded-full bg-green-600 px-6 py-3 text-center font-semibold text-white hover:bg-green-700"
          >
            Proceed to Checkout
          </Link>
          <Link
            href="/"
            className="mt-2 block rounded-full border-2 border-green-600 px-6 py-2.5 text-center font-semibold text-green-700 hover:bg-green-50"
          >
            Continue Shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
