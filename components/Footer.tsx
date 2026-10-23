"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { categories } from "@/lib/products";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = (e: FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubscribed(true);
  };

  return (
    <footer className="bg-green-950 text-green-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4">
        {/* brand */}
        <div>
          <p className="text-xl font-extrabold text-white">BazarGhor</p>
          <p className="mt-1 text-sm text-green-300">খাঁটি দেশি পণ্য, ঘরে বসে</p>
          <p className="mt-4 text-sm leading-relaxed text-green-200">
            House 12, Road 5, Dhanmondi,
            <br />
            Dhaka 1205, Bangladesh
          </p>
          <p className="mt-2 text-sm">
            <a href="tel:+8809600000000" className="hover:text-white">
              +880 9600-000000
            </a>
            <br />
            <a href="mailto:hello@bazarghor.example" className="hover:text-white">
              hello@bazarghor.example
            </a>
          </p>
        </div>

        {/* shop */}
        <nav aria-label="Shop">
          <p className="font-semibold text-white">Shop</p>
          <ul className="mt-4 space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/category/${c.slug}`}
                  className="text-green-200 hover:text-white"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* company */}
        <nav aria-label="Company">
          <p className="font-semibold text-white">Company</p>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              "About Us",
              "Contact Us",
              "FAQs",
              "Shipping Policy",
              "Return Policy",
              "Privacy Policy",
            ].map((label) => (
              <li key={label}>
                <Link href="#" className="text-green-200 hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* newsletter */}
        <div>
          <p className="font-semibold text-white">Stay in the loop</p>
          <p className="mt-4 text-sm text-green-200">
            Weekly deals and new arrivals, straight to your inbox.
          </p>
          {subscribed ? (
            <p className="mt-4 rounded-xl bg-green-800 px-4 py-3 text-sm text-green-100">
              Thanks for subscribing! Watch your inbox for fresh deals.
            </p>
          ) : (
            <form onSubmit={subscribe} className="mt-4 flex overflow-hidden rounded-full bg-white">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full bg-transparent px-4 py-2.5 text-sm text-stone-800 outline-none"
                aria-label="Email address"
              />
              <button
                type="submit"
                className="shrink-0 bg-amber-500 px-5 text-sm font-semibold text-white transition hover:bg-amber-600"
              >
                Join
              </button>
            </form>
          )}
          <p className="mt-4 text-xs text-green-300">
            Cash on Delivery · bKash · Nagad accepted
          </p>
        </div>
      </div>

      <div className="border-t border-green-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-green-300 sm:flex-row">
          <p>© 2026 BazarGhor. All rights reserved.</p>
          <p>Made with care in Dhaka, Bangladesh</p>
        </div>
      </div>
    </footer>
  );
}
