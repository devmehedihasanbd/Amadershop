"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/products";
import ProductImage from "@/components/ProductImage";
import { DELIVERY_CHARGE, FREE_DELIVERY_THRESHOLD } from "../cart/page";
import { applyPromo, normalizePromoCode } from "@/lib/promos";

const DHAKA_AREAS = [
  "Dhanmondi",
  "Mirpur",
  "Uttara",
  "Gulshan",
  "Banani",
  "Mohammadpur",
  "Wari",
  "Jatrabari",
  "Bashundhara",
  "Savar",
  "Narayanganj",
  "Keraniganj",
];

type PaymentMethod = "cod" | "bkash" | "nagad" | "rocket";

const PAYMENTS: { id: PaymentMethod; label: string; note: string }[] = [
  { id: "cod", label: "Cash on Delivery", note: "Pay when your order arrives" },
  { id: "bkash", label: "bKash", note: "Online payment (coming soon)" },
  { id: "nagad", label: "Nagad", note: "Online payment (coming soon)" },
  { id: "rocket", label: "Rocket", note: "Online payment (coming soon)" },
];

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100";

interface PlacedOrder {
  orderNumber: string;
  total: number;
  discount: number;
  promoCode: string | null;
  paymentMethod: string;
  requiresPayment: boolean;
  provider?: string;
  message?: string;
}

export default function CheckoutPage() {
  const { lines, subtotal, clear, resolveProduct } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState(DHAKA_AREAS[0]);
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  // Live estimate — the server re-validates and is the source of truth.
  const promoEstimate = promoApplied
    ? applyPromo(promoInput, subtotal)
    : null;
  const discount = promoEstimate?.discount ?? 0;
  const delivery =
    lines.length === 0
      ? 0
      : subtotal >= FREE_DELIVERY_THRESHOLD
        ? 0
        : DELIVERY_CHARGE;
  const total = subtotal - discount + delivery;

  const paymentLabel = useMemo(
    () => PAYMENTS.find((p) => p.id === payment)?.label ?? "",
    [payment]
  );

  const submitOrder = async (method: PaymentMethod): Promise<void> => {
    setError("");
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError("Please fill in your name, phone number and full address.");
      return;
    }
    if (!/^01[3-9]\d{8}$/.test(phone.replace(/[\s-]/g, ""))) {
      setError("Please enter a valid 11-digit mobile number (e.g. 01712345678).");
      return;
    }
    if (lines.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: name.trim(),
            phone: phone.replace(/[\s-]/g, ""),
            address: address.trim(),
            area,
          },
          items: lines.map((l) => ({ slug: l.slug, qty: l.qty })),
          paymentMethod: method.toUpperCase(),
          ...(promoApplied ? { promoCode: normalizePromoCode(promoInput) } : {}),
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        orderNumber?: string;
        total?: number;
        discount?: number;
        promoCode?: string | null;
        paymentMethod?: string;
        requiresPayment?: boolean;
        provider?: string;
        message?: string;
        error?: string;
        details?: string[];
      } | null;

      if (!res.ok || !data?.orderNumber) {
        const msg =
          data?.details?.join(" ") || data?.error || "Could not place the order. Please try again.";
        setError(msg);
        return;
      }

      setPlaced({
        orderNumber: data.orderNumber,
        total: typeof data.total === "number" ? data.total : total,
        discount: typeof data.discount === "number" ? data.discount : 0,
        promoCode: data.promoCode ?? null,
        paymentMethod: data.paymentMethod ?? method.toUpperCase(),
        requiresPayment: Boolean(data.requiresPayment),
        provider: data.provider,
        message: data.message,
      });
      clear();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setPlacing(false);
    }
  };

  const placeOrder = (e: FormEvent) => {
    e.preventDefault();
    void submitOrder(payment);
  };

  if (placed) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-green-700" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
        <h1 className="mt-6 text-3xl font-extrabold text-stone-800">
          Order Placed!
        </h1>
        <p className="mt-2 text-stone-500">
          Thank you, {name.split(" ")[0] || "friend"}. Your order is confirmed
          and will be delivered soon.
        </p>

        {placed.requiresPayment && (
          <div className="mt-6 w-full rounded-2xl border border-amber-300 bg-amber-50 p-5 text-left">
            <p className="text-sm font-bold text-amber-800">
              Online payment coming soon
            </p>
            <p className="mt-1 text-sm text-amber-700">
              {placed.message ??
                "Online payment is not live yet. You can complete this order as Cash on Delivery for now."}
            </p>
            <button
              type="button"
              onClick={() => {
                setPlaced(null);
                setPayment("cod");
              }}
              className="mt-3 rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Place as Cash on Delivery instead
            </button>
          </div>
        )}

        <div className="mt-6 w-full rounded-2xl border border-green-200 bg-green-50 p-6 text-left">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-500">Order ID</dt>
              <dd className="font-bold text-stone-800">{placed.orderNumber}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Payment</dt>
              <dd className="font-semibold">{paymentLabel}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Deliver to</dt>
              <dd className="text-right font-semibold">
                {area}
                <br />
                <span className="font-normal text-stone-500">{phone}</span>
              </dd>
            </div>
            {placed.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-stone-500">
                  Discount{placed.promoCode ? ` (${placed.promoCode})` : ""}
                </dt>
                <dd className="font-semibold text-green-600">
                  −{formatPrice(placed.discount)}
                </dd>
              </div>
            )}
            <div className="flex justify-between border-t border-green-200 pt-2">
              <dt className="font-bold">Total</dt>
              <dd className="font-extrabold text-green-700">
                {formatPrice(placed.total)}
              </dd>
            </div>
          </dl>
        </div>
        <Link
          href="/"
          className="mt-8 rounded-full bg-green-600 px-8 py-3 font-semibold text-white hover:bg-green-700"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold text-stone-800">
          Your cart is empty
        </h1>
        <p className="mt-2 text-stone-500">
          Add some products before checking out.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-green-600 px-7 py-3 font-semibold text-white hover:bg-green-700"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-stone-800">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <form
          onSubmit={placeOrder}
          className="space-y-5 lg:col-span-2"
          noValidate
        >
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-stone-800">Delivery details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-stone-600">
                  Full name *
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mehedi Hasan"
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-stone-600">
                  Phone number *
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01712345678"
                  inputMode="tel"
                  className={inputCls}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-stone-600">
                  Full address *
                </span>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House, road, area…"
                  rows={3}
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-stone-600">
                  Area
                </span>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className={inputCls}
                >
                  {DHAKA_AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-stone-800">Payment method</h2>
            <div className="mt-4 space-y-3">
              {PAYMENTS.map((p) => (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition ${
                    payment === p.id
                      ? "border-green-600 bg-green-50"
                      : "border-stone-200 hover:border-green-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={payment === p.id}
                    onChange={() => setPayment(p.id)}
                    className="h-4 w-4 accent-green-600"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-stone-800">
                      {p.label}
                    </span>
                    <span className="block text-xs text-stone-500">{p.note}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={placing}
            className="w-full rounded-full bg-green-600 px-6 py-4 text-lg font-bold text-white shadow transition hover:bg-green-700 active:scale-[0.99] disabled:opacity-60"
          >
            {placing ? "Placing your order…" : `Place Order · ${formatPrice(total)}`}
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-stone-800">Order Summary</h2>
          <ul className="mt-4 space-y-3">
            {lines.map((line) => {
              const p = resolveProduct(line.slug);
              if (!p) return null;
              return (
                <li key={line.slug} className="flex items-center gap-3">
                  <ProductImage
                    category={p.category}
                    name={p.name}
                    images={p.images}
                    className="h-12 w-12 shrink-0 rounded-xl"
                  />
                  <div className="flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-stone-800">
                      {p.name}
                    </p>
                    <p className="text-xs text-stone-500">Qty {line.qty}</p>
                  </div>
                  <p className="text-sm font-bold">
                    {formatPrice(p.price * line.qty)}
                  </p>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 border-t border-stone-200 pt-4">
            {promoApplied && promoEstimate ? (
              <div className="flex items-center justify-between rounded-xl bg-green-50 px-3 py-2.5">
                <p className="text-sm font-semibold text-green-800">
                  {promoEstimate.code}{" "}
                  <span className="font-normal text-green-600">
                    (−{formatPrice(promoEstimate.discount)})
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPromoApplied(false);
                    setPromoInput("");
                  }}
                  className="text-xs font-medium text-stone-500 underline-offset-2 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Promo code (try AMADER10)"
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm uppercase outline-none placeholder:normal-case focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  aria-label="Promo code"
                />
                <button
                  type="button"
                  onClick={() => {
                    const code = normalizePromoCode(promoInput);
                    if (!code) return;
                    const res = applyPromo(code, subtotal);
                    if (res) {
                      setPromoInput(code);
                      setPromoApplied(true);
                      setError("");
                    } else {
                      setError(
                        "That code didn't apply — check the code or the ৳500 minimum order."
                      );
                    }
                  }}
                  className="shrink-0 rounded-xl bg-stone-800 px-4 text-sm font-semibold text-white transition hover:bg-stone-900 active:scale-95"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
          <dl className="mt-4 space-y-2 border-t border-stone-200 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-500">Subtotal</dt>
              <dd className="font-semibold">{formatPrice(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-stone-500">Discount</dt>
                <dd className="font-semibold text-green-600">
                  −{formatPrice(discount)}
                </dd>
              </div>
            )}
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
            <div className="flex justify-between border-t border-stone-200 pt-3 text-base">
              <dt className="font-bold">Total</dt>
              <dd className="font-extrabold text-green-700">
                {formatPrice(total)}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
