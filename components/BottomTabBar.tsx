"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";

const TABS = [
  {
    href: "/",
    label: "Home",
    match: (p: string) => p === "/",
    icon: (
      <>
        <path d="M3 10.5L12 3l9 7.5" />
        <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
      </>
    ),
  },
  {
    href: "/categories",
    label: "Shop",
    match: (p: string) => p === "/categories" || p.startsWith("/category/"),
    icon: (
      <>
        <path d="M5 9l2.5 11a1 1 0 0 0 1 .8h7a1 1 0 0 0 1-.8L19.5 9" />
        <path d="M3.5 9h17" />
        <path d="M9 9l3-6 3 6" />
      </>
    ),
  },
  {
    href: "/search",
    label: "Search",
    match: (p: string) => p.startsWith("/search"),
    icon: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </>
    ),
  },
] as const;

export default function BottomTabBar() {
  const pathname = usePathname();
  const { count, setOpen } = useCart();

  const tabCls = (active: boolean) =>
    `flex min-h-[56px] min-w-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-xl transition active:scale-95 ${
      active ? "text-green-700" : "text-stone-400 hover:text-stone-600"
    }`;

  const iconCls = (active: boolean) =>
    `h-6 w-6 ${active ? "[&_path]:stroke-[2.2] [&_circle]:stroke-[2.2]" : ""}`;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
    >
      <div className="flex items-stretch px-2 pt-1">
        {TABS.map((t) => {
          const active = t.match(pathname);
          return (
            <Link key={t.href} href={t.href} className={tabCls(active)} aria-current={active ? "page" : undefined}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={iconCls(active)}
                aria-hidden="true"
              >
                {t.icon}
              </svg>
              <span className={`text-[11px] font-semibold ${active ? "" : "font-medium"}`}>
                {t.label}
              </span>
              {active && (
                <span className="h-1 w-8 rounded-full bg-amber-400" aria-hidden="true" />
              )}
            </Link>
          );
        })}

        {/* Cart opens the drawer instead of navigating */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`${tabCls(false)} relative`}
          aria-label={`Open cart, ${count} items`}
        >
          <span className="relative">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <circle cx="9" cy="20" r="1.5" />
              <circle cx="17" cy="20" r="1.5" />
              <path d="M2 3h3l2.6 12.4a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L20.5 7H6" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-white">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </span>
          <span className="text-[11px] font-medium">Cart</span>
        </button>
      </div>
    </nav>
  );
}
