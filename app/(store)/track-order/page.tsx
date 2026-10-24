"use client";

import { useState } from "react";
import type { FormEvent } from "react";

interface TrackedItem {
  name: string;
  qty: number;
  unitPrice: number;
}

interface TrackedOrder {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  promoCode: string | null;
  deliveryCharge: number;
  total: number;
  items: TrackedItem[];
  trackingCode: string | null;
  createdAt: string;
}

const STEPS = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const;

const STEP_LABEL: Record<string, string> = {
  PENDING: "Order received",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

function StatusTimeline({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        This order was cancelled. Contact us if you need help.
      </div>
    );
  }
  const idx = STEPS.indexOf(status as (typeof STEPS)[number]);
  const current = idx === -1 ? 0 : idx;
  return (
    <ol className="flex items-center">
      {STEPS.map((s, i) => (
        <li key={s} className={`flex-1 ${i < STEPS.length - 1 ? "pr-1" : ""}`}>
          <div className="flex items-center">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                i < current
                  ? "bg-green-600 text-white"
                  : i === current
                    ? "bg-green-600 text-white ring-4 ring-green-100"
                    : "bg-stone-200 text-stone-500"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </span>
            {i < STEPS.length - 1 && (
              <span
                className={`mx-1 h-1 flex-1 rounded-full ${
                  i < current ? "bg-green-600" : "bg-stone-200"
                }`}
              />
            )}
          </div>
          <p
            className={`mt-1.5 text-[11px] font-semibold leading-tight ${
              i <= current ? "text-green-800" : "text-stone-400"
            }`}
          >
            {STEP_LABEL[s]}
          </p>
        </li>
      ))}
    </ol>
  );
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOrder(null);
    setLoading(true);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, phone }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.order) {
        setError(
          json?.error ?? "Could not find this order. Check the details and try again."
        );
        return;
      }
      setOrder(json.order as TrackedOrder);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
        Track Your Order
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Enter your order number and the phone number used at checkout.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-600">
              Order number
            </span>
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="AS-20251024-0001"
              required
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm uppercase outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-600">
              Phone number
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              required
              inputMode="tel"
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </label>
        </div>
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-full bg-green-600 px-6 py-3.5 font-bold text-white shadow transition hover:bg-green-700 disabled:opacity-60"
        >
          {loading ? "Looking up…" : "Track Order"}
        </button>
      </form>

      {order && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-extrabold text-stone-900">{order.orderNumber}</p>
              <p className="text-xs text-stone-400">
                Placed{" "}
                {new Date(order.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="mt-5">
              <StatusTimeline status={order.status} />
            </div>
            {order.trackingCode && (
              <p className="mt-4 text-sm text-stone-600">
                Courier tracking code:{" "}
                <span className="font-bold text-stone-900">{order.trackingCode}</span>
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-stone-800">Order summary</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {order.items.map((it, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="text-stone-600">
                    {it.name} × {it.qty}
                  </span>
                  <span className="font-semibold text-stone-900">
                    ৳{(it.unitPrice * it.qty).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-stone-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Subtotal</dt>
                <dd className="font-semibold">৳{order.subtotal.toLocaleString()}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <dt>Discount{order.promoCode ? ` (${order.promoCode})` : ""}</dt>
                  <dd className="font-semibold">−৳{order.discount.toLocaleString()}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-stone-500">Delivery</dt>
                <dd className="font-semibold">
                  {order.deliveryCharge === 0 ? "Free" : `৳${order.deliveryCharge.toLocaleString()}`}
                </dd>
              </div>
              <div className="flex justify-between border-t border-stone-100 pt-2 text-base">
                <dt className="font-bold">Total</dt>
                <dd className="font-extrabold">৳{order.total.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between text-xs text-stone-400">
                <dt>Payment</dt>
                <dd>
                  {order.paymentMethod} · {order.paymentStatus}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
