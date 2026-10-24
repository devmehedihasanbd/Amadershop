"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/products";
import ProductImage from "./ProductImage";

export default function CartDrawer() {
  const { isOpen, setOpen, lines, setQty, removeItem, subtotal, resolveProduct } =
    useCart();

  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!isOpen}
    >
      {/* overlay */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />
      {/* panel */}
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="text-lg font-bold text-stone-800">Your Cart</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full p-2 text-stone-500 hover:bg-stone-100"
            aria-label="Close cart"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-stone-400">Your cart is empty.</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {lines.map((line) => {
                const p = resolveProduct(line.slug);
                if (!p) return null;
                return (
                  <li key={line.slug} className="flex gap-3">
                    <ProductImage
                      category={p.category}
                      name={p.name}
                      images={p.images}
                      className="h-16 w-16 shrink-0 rounded-xl"
                    />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-snug text-stone-800">
                          {p.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeItem(line.slug)}
                          className="text-stone-400 hover:text-red-500"
                          aria-label={`Remove ${p.name}`}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                            <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-stone-500">
                        {formatPrice(p.price)} · {p.unit}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-full border border-stone-200">
                          <button
                            type="button"
                            onClick={() => setQty(line.slug, line.qty - 1)}
                            className="flex min-h-[40px] min-w-[40px] items-center justify-center text-lg text-stone-600 hover:text-green-700"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">
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
                        <p className="text-sm font-bold text-green-700">
                          {formatPrice(p.price * line.qty)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-stone-200 px-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-500">Subtotal</span>
              <span className="text-lg font-extrabold text-stone-800">
                {formatPrice(subtotal)}
              </span>
            </div>
            <p className="mt-1 text-xs text-stone-500">
              Delivery calculated at checkout · Free over ৳2000
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href="/cart"
                onClick={() => setOpen(false)}
                className="rounded-full border-2 border-green-600 px-4 py-2.5 text-center text-sm font-semibold text-green-700 hover:bg-green-50"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="rounded-full bg-green-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-green-700"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
