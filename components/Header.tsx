"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { categories } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { useSiteSettings } from "@/lib/use-site-settings";

function Logo() {
  const site = useSiteSettings();
  const name = site?.storeName || "Amader Shop";
  const tagline = site?.storeTagline || "খাঁটি দেশি পণ্য, ঘরে বসে";
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5">
      {site?.logoImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={site.logoImage}
          alt={name}
          className="h-10 w-10 rounded-xl object-cover shadow"
        />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 shadow">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="M5 9l2.5 11a1 1 0 0 0 1 .8h7a1 1 0 0 0 1-.8L19.5 9" />
            <path d="M3.5 9h17" />
            <path d="M9 9l3-6 3 6" />
            <path d="M9.5 13.5h5" />
          </svg>
        </span>
      )}
      <span className="leading-tight">
        <span className="block text-xl font-extrabold tracking-tight text-green-800">
          {name}
        </span>
        {tagline && (
          <span className="block text-[11px] font-medium text-stone-500">
            {tagline}
          </span>
        )}
      </span>
    </Link>
  );
}

export default function Header() {
  const { count, setOpen } = useCart();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const searchBox = (
    <form
      onSubmit={submitSearch}
      className="flex w-full overflow-hidden rounded-full border-2 border-green-600 bg-white focus-within:ring-2 focus-within:ring-green-200"
      role="search"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search honey, dates, spices…"
        className="w-full bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-stone-400"
        aria-label="Search products"
      />
      <button
        type="submit"
        className="shrink-0 bg-green-600 px-5 text-sm font-semibold text-white transition hover:bg-green-700"
      >
        Search
      </button>
    </form>
  );

  return (
    <header
      className={`sticky top-0 z-40 transition-shadow duration-300 ${
        scrolled ? "shadow-lg" : "shadow-sm"
      }`}
    >
      {/* utility bar */}
      <div className="bg-green-900 text-green-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs">
          <a href="tel:+8809600000000" className="flex items-center gap-1.5 hover:underline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5" aria-hidden="true">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.45c.9.34 1.84.57 2.8.7A2 2 0 0 1 22 16.9z" />
            </svg>
            +880 9600-000000
          </a>
          <div className="flex items-center gap-4">
            <Link href="/cart" className="hover:underline">Track Order</Link>
            <span className="hidden sm:inline text-green-200">Free delivery over ৳2000</span>
          </div>
        </div>
      </div>

      {/* main bar */}
      <div className="bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Logo />
          <div className="hidden flex-1 md:block">{searchBox}</div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative ml-auto flex items-center gap-2 rounded-full bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-green-700 md:ml-0"
            aria-label={`Open cart, ${count} items`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <circle cx="9" cy="20" r="1.5" />
              <circle cx="17" cy="20" r="1.5" />
              <path d="M2 3h3l2.6 12.4a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L20.5 7H6" />
            </svg>
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
        <div className="px-4 pb-3 md:hidden">{searchBox}</div>

        {/* nav */}
        <nav className="border-t border-stone-100" aria-label="Categories">
          <div className="no-scrollbar mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4">
            <Link
              href="/"
              className="whitespace-nowrap px-3 py-3 text-sm font-medium text-stone-600 hover:text-green-700"
            >
              Home
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="whitespace-nowrap px-3 py-3 text-sm font-medium text-stone-600 hover:text-green-700"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
