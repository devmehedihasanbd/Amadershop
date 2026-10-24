"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

function Icon({ d, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const NAV = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    d: "M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z",
  },
  {
    href: "/admin/orders",
    label: "Orders",
    d: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  },
  {
    href: "/admin/products",
    label: "Products",
    d: "M20 7l-8-4-8 4v10l8 4 8-4zM12 3v8m0 0l8-4m-8 4L4 7m8 12v-8",
  },
  {
    href: "/admin/categories",
    label: "Categories",
    d: "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  },
  {
    href: "/admin/customers",
    label: "Customers",
    d: "M16 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1m18 0v-1a4 4 0 00-3-3.87M13 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    href: "/admin/promos",
    label: "Promos",
    d: "M3 9V7a2 2 0 012-2h14a2 2 0 012 2v2a2.5 2.5 0 000 5v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2.5 2.5 0 000-5zM13 5v2m0 3v2m0 3v2",
  },
  {
    href: "/admin/banners",
    label: "Banners",
    d: "M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm0 4l4 4 3-3 4 4 5-5",
  },
  {
    href: "/admin/payments",
    label: "Payments",
    d: "M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2zm0 3h18M7 14h4",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    d: "M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 01-.1 1.2l2 1.6-2 3.4-2.4-1a7 7 0 01-2 1.2L14 20h-4l-.5-2.6a7 7 0 01-2-1.2l-2.4 1-2-3.4 2-1.6A7 7 0 015 12a7 7 0 01.1-1.2l-2-1.6 2-3.4 2.4 1a7 7 0 012-1.2L10 4h4l.5 2.6a7 7 0 012 1.2l2.4-1 2 3.4-2 1.6c.06.4.1.8.1 1.2z",
  },
];

const TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/orders": "Orders",
  "/admin/products": "Products",
  "/admin/categories": "Categories",
  "/admin/customers": "Customers",
  "/admin/promos": "Promos",
  "/admin/settings": "Settings",
};

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    router.push("/admin/login");
    router.refresh();
  }

  const activeTitle =
    Object.entries(TITLES).find(
      ([href]) => pathname === href || pathname.startsWith(href + "/")
    )?.[1] ?? "Admin";

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <Link href="/admin/dashboard" className="flex items-center gap-2.5 px-5 pb-5 pt-6">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-600 text-sm font-extrabold text-amber-300">
          AS
        </span>
        {!collapsed && (
          <span className="leading-tight">
            <span className="block text-[15px] font-bold text-white">Amader Shop</span>
            <span className="block text-xs text-stone-400">Admin panel</span>
          </span>
        )}
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-green-600 text-white"
                  : "text-stone-300 hover:bg-white/10 hover:text-white"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon d={item.d} className="h-5 w-5 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: view store + admin identity */}
      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-300 transition hover:bg-white/10 hover:text-white ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? "View store" : undefined}
        >
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" />
          </svg>
          {!collapsed && "View store"}
        </Link>
        <div className={`mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 ${collapsed ? "justify-center" : ""}`}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-stone-900">
            A
          </span>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-white">Admin</p>
              <p className="truncate text-xs text-stone-400">Store owner</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden bg-stone-900 transition-all md:block ${
          collapsed ? "w-[76px]" : "w-64"
        }`}
      >
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-stone-900 shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className={collapsed ? "md:pl-[76px]" : "md:pl-64"}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-stone-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            className="rounded-lg p-2 text-stone-600 hover:bg-stone-100 md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            className="hidden rounded-lg p-2 text-stone-500 hover:bg-stone-100 md:block"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={collapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 5l-7 7 7 7M19 5l-7 7 7 7"} />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-stone-900">{activeTitle}</h1>
          <div className="ml-auto">
            <button
              onClick={handleLogout}
              className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
