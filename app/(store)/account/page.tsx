"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OrderItem = { name: string; qty: number; price: number };
type Order = {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
};
type Customer = { name: string; phone: string; email: string | null };

const inputCls =
  "w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-green-600";
const labelCls =
  "mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500";
const primaryCls =
  "w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50";

/**
 * Customer account — fully optional. Guests can keep ordering without
 * any account; whoever wants one can sign up with a phone number and
 * password, then see their profile and order history here.
 * Google / Facebook login needs OAuth apps (see the note below) and
 * is not wired up yet.
 */
export default function AccountPage() {
  const [status, setStatus] = useState<"loading" | "in" | "out">("loading");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/account/me");
    const json = await res.json().catch(() => null);
    if (res.ok && json?.customer) {
      setCustomer(json.customer as Customer);
      setOrders(Array.isArray(json.orders) ? (json.orders as Order[]) : []);
      setStatus("in");
    } else {
      setCustomer(null);
      setOrders([]);
      setStatus("out");
    }
  }

  useEffect(() => {
    refresh().catch(() => setStatus("out"));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(
        mode === "login" ? "/api/account/login" : "/api/account/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "login"
              ? { phone, password }
              : { name, phone, password }
          ),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setPassword("");
      await refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/account/logout", { method: "POST" }).catch(() => {});
    setStatus("out");
    setCustomer(null);
    setOrders([]);
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-sm text-stone-500">Loading…</p>
      </div>
    );
  }

  if (status === "in" && customer) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
          My Account
        </h1>
        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-lg font-bold text-stone-900">{customer.name}</p>
          <p className="mt-1 text-sm text-stone-500">{customer.phone}</p>
          {customer.email && (
            <p className="text-sm text-stone-500">{customer.email}</p>
          )}
          <button
            type="button"
            onClick={logout}
            className="mt-4 rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
          >
            Log out
          </button>
        </div>

        <h2 className="mt-10 text-xl font-bold text-stone-900">My Orders</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">
            No orders yet. Your orders will show up here after checkout.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((o) => (
              <div
                key={o.orderNumber}
                className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-stone-900">{o.orderNumber}</p>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                    {o.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  {new Date(o.createdAt).toLocaleDateString()} · {o.paymentMethod} · ৳
                  {o.total}
                </p>
                <p className="mt-2 text-sm text-stone-600">
                  {o.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}
                </p>
                <Link
                  href={`/track-order?order=${encodeURIComponent(o.orderNumber)}`}
                  className="mt-2 inline-block text-sm font-semibold text-green-700 hover:underline"
                >
                  Track order →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
        {mode === "login" ? "Log in" : "Create account"}
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Optional — you can always order as a guest, no account needed.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded-xl py-2 text-sm font-semibold transition ${
              mode === m ? "bg-white text-green-700 shadow" : "text-stone-500"
            }`}
          >
            {m === "login" ? "Log in" : "Sign up"}
          </button>
        ))}
      </div>

      <form
        onSubmit={submit}
        className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
      >
        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-200">
            {error}
          </p>
        )}
        {mode === "signup" && (
          <label className="block">
            <span className={labelCls}>Full name</span>
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </label>
        )}
        <label className={`block ${mode === "signup" ? "mt-3" : ""}`}>
          <span className={labelCls}>Mobile number</span>
          <input
            className={inputCls}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01712345678"
            inputMode="tel"
            required
          />
        </label>
        <label className="mt-3 block">
          <span className={labelCls}>Password</span>
          <input
            type="password"
            className={inputCls}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
          />
        </label>
        <button type="submit" disabled={busy} className={`${primaryCls} mt-4`}>
          {busy
            ? "Please wait…"
            : mode === "login"
              ? "Log in"
              : "Create account"}
        </button>
      </form>

      <div className="mt-4 space-y-2">
        <button
          type="button"
          disabled
          className="w-full cursor-not-allowed rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-400"
        >
          Continue with Google — coming soon
        </button>
        <button
          type="button"
          disabled
          className="w-full cursor-not-allowed rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-400"
        >
          Continue with Facebook — coming soon
        </button>
        <p className="pt-1 text-center text-xs text-stone-400">
          Google and Facebook login need the store&apos;s own Google and Meta
          apps connected first — phone login works today.
        </p>
      </div>
    </div>
  );
}
