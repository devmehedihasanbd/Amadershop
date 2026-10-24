"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/products";
import ProductImage from "@/components/ProductImage";
import { DELIVERY_CHARGE, FREE_DELIVERY_THRESHOLD } from "../cart/page";
import { applyPromo, normalizePromoCode } from "@/lib/promos";
import {
  DISTRICTS,
  AREAS_BY_DISTRICT,
  ALL_UPAZILAS,
  CITY_THANAS,
  BN_DISTRICTS,
  BN_UPAZILAS,
  BN_CITY_THANAS,
} from "@/lib/bd-locations";

/* ------------------- district / upazila auto-detect ------------------- */
/* The customer types their full address once — in English or Bangla —   */
/* and the District + Upazila/Thana selects below fill themselves, so    */
/* they never have to type or pick the same place twice.                  */
/* Priority: upazila/thana match (sets district + area) beats a plain    */
/* district match (sets district only). Ambiguous matches with no        */
/* district hint in the text are left for manual selection.              */

function normalizeLatin(s: string): string {
  return s
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeBangla(s: string): string {
  return s
    .replace(/[।,;:!?()\[\]{}"'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* Common spelling variants customers actually type. */
const DISTRICT_ALIASES: Record<string, string> = {
  "cox bazar": "Cox's Bazar",
  "chapai nawabganj": "Chapainawabganj",
  "chapai nababganj": "Chapainawabganj",
};

function phraseIn(hay: string, needle: string): boolean {
  return needle.length >= 3 && hay.includes(` ${needle} `);
}

interface DetectedLocation {
  district: string;
  area?: string;
}

/* City thanas are stored as "Mirpur Model", "Uttara East" etc., but
   customers type "Mirpur" / "Uttara" — so those base names also match. */
function thanaMatchNames(name: string): string[] {
  const out = [name];
  for (const suffix of [" Model", " East", " West", " Industrial"]) {
    if (name.endsWith(suffix)) out.push(name.slice(0, -suffix.length));
  }
  return out;
}

function bnThanaMatchNames(bn: string): string[] {
  const out = [bn];
  for (const suffix of [" মডেল", " পূর্ব", " পশ্চিম"]) {
    if (bn.endsWith(suffix)) out.push(bn.slice(0, -suffix.length));
  }
  return out;
}

function resolvePool(
  pool: DetectedLocation[],
  distCands: Set<string>
): DetectedLocation | null | undefined {
  if (pool.length === 0) return undefined;
  if (pool.length === 1) return pool[0];
  const withDist = pool.filter((c) => distCands.has(c.district));
  if (withDist.length === 1) return withDist[0];
  if (withDist.length > 1) {
    // A single longest match wins (most specific); a tie means the
    // input is still ambiguous, so only the district is certain.
    const maxLen = Math.max(...withDist.map((c) => c.area?.length ?? 0));
    const longest = withDist.filter((c) => (c.area?.length ?? 0) === maxLen);
    if (longest.length === 1) return longest[0];
    const districts = new Set(withDist.map((c) => c.district));
    if (districts.size === 1) return { district: [...districts][0] };
    return null;
  }
  const districts = new Set(pool.map((c) => c.district));
  if (districts.size === 1) return { district: [...districts][0] };
  return null;
}

function detectLocation(text: string): DetectedLocation | null {
  const latin = ` ${normalizeLatin(text)} `;
  const bangla = ` ${normalizeBangla(text)} `;
  if (latin.trim().length < 3 && bangla.trim().length < 3) return null;

  const exact: DetectedLocation[] = [];
  const stripped: DetectedLocation[] = [];
  const pushUnique = (
    pool: DetectedLocation[],
    district: string,
    area: string
  ) => {
    if (!pool.some((c) => c.district === district && c.area === area)) {
      pool.push({ district, area });
    }
  };

  for (const u of ALL_UPAZILAS) {
    if (phraseIn(latin, normalizeLatin(u.upazila))) {
      pushUnique(exact, u.district, u.upazila);
    }
  }
  for (const u of BN_UPAZILAS) {
    if (phraseIn(bangla, normalizeBangla(u.bn))) {
      pushUnique(exact, u.district, u.upazila);
    }
  }
  for (const t of CITY_THANAS) {
    const names = thanaMatchNames(t.thana);
    if (phraseIn(latin, normalizeLatin(names[0]))) {
      pushUnique(exact, t.district, t.thana);
    } else if (
      names.length > 1 &&
      phraseIn(latin, normalizeLatin(names[1]))
    ) {
      pushUnique(stripped, t.district, t.thana);
    }
  }
  for (const t of BN_CITY_THANAS) {
    const names = bnThanaMatchNames(t.bn);
    if (phraseIn(bangla, normalizeBangla(names[0]))) {
      pushUnique(exact, t.district, t.thana);
    } else if (
      names.length > 1 &&
      phraseIn(bangla, normalizeBangla(names[1]))
    ) {
      pushUnique(stripped, t.district, t.thana);
    }
  }

  const distCands = new Set<string>();
  for (const d of DISTRICTS) {
    if (phraseIn(latin, normalizeLatin(d))) distCands.add(d);
  }
  for (const [alias, district] of Object.entries(DISTRICT_ALIASES)) {
    if (phraseIn(latin, alias)) distCands.add(district);
  }
  for (const [en, bn] of Object.entries(BN_DISTRICTS)) {
    if (phraseIn(bangla, normalizeBangla(bn))) distCands.add(en);
  }

  if (exact.length > 0) {
    if (stripped.length === 0) {
      return resolvePool(exact, distCands) ?? null;
    }
    if (
      exact.length === 1 &&
      stripped.every((c) => c.district === exact[0].district)
    ) {
      return exact[0];
    }
    return resolvePool([...exact, ...stripped], distCands) ?? null;
  }
  if (stripped.length > 0) {
    return resolvePool(stripped, distCands) ?? null;
  }
  if (distCands.size === 1) {
    return { district: [...distCands][0] };
  }
  return null;
}

type PaymentMethod = "cod" | "bkash" | "nagad" | "rocket";

interface PayMethod {
  id: PaymentMethod;
  label: string;
  enabled: boolean;
  configured: boolean;
}

const PAYMENT_NOTES: Record<PaymentMethod, string> = {
  cod: "Pay when your order arrives",
  bkash: "Pay securely with bKash",
  nagad: "Pay securely with Nagad",
  rocket: "Pay with Rocket",
};

const FALLBACK_METHODS: PayMethod[] = [
  { id: "cod", label: "Cash on Delivery", enabled: true, configured: true },
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
  const [district, setDistrict] = useState("Dhaka");
  const [upazila, setUpazila] = useState("");
  const [locationTouched, setLocationTouched] = useState(false);

  const areas = AREAS_BY_DISTRICT[district] ?? [];

  /* Auto-detect district + upazila from the typed address, until the
     customer manually picks from the dropdowns. */
  function handleAddressChange(value: string) {
    setAddress(value);
    if (!locationTouched) {
      const found = detectLocation(value);
      if (found) {
        setDistrict(found.district);
        // District-only match (e.g. just "Thakurgaon") clears the area
        // so the customer picks the right upazila/thana for it.
        setUpazila(found.area ?? "");
      }
    }
  }

  function handleDistrictChange(value: string) {
    setDistrict(value);
    setUpazila("");
    setLocationTouched(true);
  }

  function handleUpazilaChange(value: string) {
    setUpazila(value);
    setLocationTouched(true);
  }
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [payMethods, setPayMethods] = useState<PayMethod[]>(FALLBACK_METHODS);
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  // Payment methods are controlled from the admin panel (/admin/payments).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/payments/methods")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json || !Array.isArray(json.methods)) return;
        const methods = (json.methods as PayMethod[]).filter((m) => m.enabled);
        if (methods.length === 0) return;
        setPayMethods(methods);
        setPayment((current) => {
          const stillThere = methods.some(
            (m) => m.id === current && (m.id === "cod" || m.configured)
          );
          if (stillThere) return current;
          const firstUsable = methods.find((m) => m.id === "cod" || m.configured);
          return firstUsable ? firstUsable.id : current;
        });
      })
      .catch(() => {
        /* keep COD fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    () => payMethods.find((p) => p.id === payment)?.label ?? "",
    [payment, payMethods]
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
    if (!upazila) {
      setError("Please select your upazila / thana.");
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
            area: upazila ? `${upazila}, ${district}` : district,
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
                {upazila ? `${upazila}, ${district}` : district}
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
                  onChange={(e) => handleAddressChange(e.target.value)}
                  placeholder="House, road, area… (type your upazila/thana name in English or Bangla and it will auto-select below)"
                  rows={3}
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-stone-600">
                  District *
                </span>
                <select
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className={inputCls}
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-stone-600">
                  Upazila / Thana *
                </span>
                <select
                  value={upazila}
                  onChange={(e) => handleUpazilaChange(e.target.value)}
                  className={inputCls}
                >
                  <option value="" disabled>
                    Select upazila / thana
                  </option>
                  {areas.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-stone-800">Payment method</h2>
            <div className="mt-4 space-y-3">
              {payMethods.map((p) => {
                const usable = p.id === "cod" || p.configured;
                const selected = payment === p.id;
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 rounded-xl border-2 p-4 transition ${
                      !usable
                        ? "cursor-not-allowed border-stone-200 opacity-60"
                        : selected
                          ? "cursor-pointer border-green-600 bg-green-50"
                          : "cursor-pointer border-stone-200 hover:border-green-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={selected}
                      disabled={!usable}
                      onChange={() => setPayment(p.id)}
                      className="h-4 w-4 accent-green-600"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-stone-800">
                        {p.label}
                      </span>
                      <span className="block text-xs text-stone-500">
                        {usable ? PAYMENT_NOTES[p.id] : "Coming soon"}
                      </span>
                    </span>
                  </label>
                );
              })}
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
