"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "amadershop-promo-seen";
const SHOW_AFTER_MS = 1500;

export default function PromoPopup() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      /* storage unavailable — show once anyway */
    }
    timer = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setLeaving(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setTimeout(() => setVisible(false), 200);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="First order discount"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* backdrop */}
      <button
        type="button"
        aria-label="Close promotion"
        onClick={dismiss}
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
      />
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-200 ${
          leaving ? "scale-95" : "scale-100"
        }`}
      >
        <div className="bg-gradient-to-br from-green-700 to-emerald-900 px-6 pb-7 pt-9 text-center sm:px-8 sm:pb-8 sm:pt-10">
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/30"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
            Welcome offer
          </p>
          <p className="mt-3 text-4xl font-extrabold text-white sm:text-5xl">
            10% OFF
          </p>
          <p className="mt-2 text-green-100">your first order</p>
          <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-amber-300/70 bg-white/10 px-5 py-2.5">
            <span className="text-lg font-extrabold tracking-widest text-amber-300">
              AMADER10
            </span>
          </div>
        </div>
        <div className="px-6 py-5 text-center sm:px-8 sm:py-6">
          <p className="text-xs text-stone-500">
            Min. order ৳500 · Max discount ৳500 · Apply the code at checkout
          </p>
          <Link
            href="/#categories"
            onClick={dismiss}
            className="mt-5 block rounded-full bg-green-600 px-6 py-3 font-bold text-white shadow transition hover:scale-[1.02] hover:bg-green-700 active:scale-95"
          >
            Shop Now
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="mt-3 text-sm text-stone-500 underline-offset-2 hover:underline"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
