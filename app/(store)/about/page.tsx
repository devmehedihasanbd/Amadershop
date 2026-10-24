"use client";

import Link from "next/link";
import { useSiteSettings } from "@/lib/use-site-settings";

export default function AboutPage() {
  const site = useSiteSettings();
  const name = site?.storeName || "Amader Shop";
  const tagline = site?.storeTagline || "খাঁটি দেশি পণ্য, ঘরে বসে";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs font-bold uppercase tracking-widest text-green-700">
        About us
      </p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-stone-900">
        {name}
      </h1>
      <p className="mt-2 text-lg text-green-700">{tagline}</p>

      {site?.footerAbout ? (
        <p className="mt-6 leading-relaxed text-stone-600">{site.footerAbout}</p>
      ) : (
        <div className="mt-6 space-y-4 leading-relaxed text-stone-600">
          <p>
            We started {name} with a simple frustration: grocery shopping in
            Dhaka meant either overpaying at a superstore or gambling on quality
            at the local bazaar. We wanted a third option — honest, source-checked
            groceries delivered to your door.
          </p>
          <p>
            Every batch we sell is checked at the source. No mixing, no artificial
            colour, no shortcuts. If it isn't good enough for our own families,
            it doesn't go on the shelf.
          </p>
        </div>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { title: "100% Authentic", text: "Source-checked batches" },
          { title: "Fair Prices", text: "No middleman markups" },
          { title: "Fast Delivery", text: "Same-day inside Dhaka" },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-green-100 bg-green-50 p-5 text-center"
          >
            <p className="font-bold text-stone-900">{f.title}</p>
            <p className="mt-1 text-sm text-stone-500">{f.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/shop"
          className="inline-block rounded-full bg-green-600 px-8 py-3 font-bold text-white shadow transition hover:bg-green-700"
        >
          Start Shopping
        </Link>
      </div>
    </div>
  );
}
