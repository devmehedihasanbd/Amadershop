"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type MenuCategory = {
  slug: string;
  name: string;
  image?: string;
};

const MENU_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/offers", label: "Offers" },
  { href: "/search", label: "Search" },
  { href: "/cart", label: "Cart" },
  { href: "/track-order", label: "Track Order" },
  { href: "/account", label: "Account" },
];

/**
 * Three-dot menu in the header's top-right corner. Holds the full menu
 * plus every live category (fetched from /api/categories when opened),
 * replacing the old top category nav line and the header cart button.
 * The cart itself stays reachable from the bottom tab bar and from here.
 */
export default function HeaderMenu() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [catsState, setCatsState] = useState<"idle" | "loading" | "done">("idle");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  async function toggle() {
    if (!open && catsState === "idle") {
      setCatsState("loading");
      try {
        const res = await fetch("/api/categories");
        const json = await res.json().catch(() => null);
        const cats = json?.categories;
        if (Array.isArray(cats)) setCategories(cats);
      } catch {
        // Menu stays usable even if categories fail to load.
      } finally {
        setCatsState("done");
      }
    }
    setOpen((v) => !v);
  }

  return (
    <div ref={ref} className="relative ml-auto md:ml-0">
      <button
        type="button"
        onClick={toggle}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-green-600 text-white shadow transition hover:bg-green-700"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 max-h-[70vh] w-64 overflow-y-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-xl">
          {MENU_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-800 hover:bg-green-50 hover:text-green-700"
            >
              {l.label}
            </Link>
          ))}

          <div className="my-1 border-t border-stone-100" />
          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
            Categories
          </p>
          {catsState !== "done" ? (
            <p className="px-3 py-2 text-sm text-stone-500">Loading…</p>
          ) : categories.length === 0 ? (
            <p className="px-3 py-2 text-sm text-stone-500">No categories yet.</p>
          ) : (
            categories.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-stone-700 hover:bg-green-50 hover:text-green-700"
              >
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.image}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50 text-sm font-bold text-green-700">
                    {c.name.charAt(0)}
                  </span>
                )}
                {c.name}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
