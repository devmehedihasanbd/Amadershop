"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { categories } from "@/lib/products";
import { useSiteSettings } from "@/lib/use-site-settings";

function AddressLines({ address }: { address: string }) {
  const lines = address.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  return (
    <p className="mt-4 text-sm leading-relaxed text-green-200">
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </p>
  );
}

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const site = useSiteSettings();

  const name = site?.storeName || "Amader Shop";
  const tagline = site?.storeTagline || "খাঁটি দেশি পণ্য, ঘরে বসে";
  const phone = site?.contactPhone || "";
  const whatsapp = (site?.contactWhatsapp || "").replace(/[^\d]/g, "");
  const emailAddr = site?.contactEmail || "";
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : undefined;

  const subscribe = (e: FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubscribed(true);
  };

  return (
    <footer className="bg-green-950 text-green-100">
      <div className="mx-auto max-w-7xl px-4 pb-2 pt-12">
        <p className="text-2xl font-extrabold text-white">
          {name} <span className="text-green-400">·</span>{" "}
          <span className="text-base font-medium text-green-300">
            {tagline}
          </span>
        </p>
        {site?.footerAbout && (
          <p className="mt-2 max-w-2xl text-sm text-green-200">{site.footerAbout}</p>
        )}
        {(site?.facebookUrl || site?.instagramUrl) && (
          <div className="mt-4 flex gap-3">
            {site.facebookUrl && (
              <a
                href={site.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-green-900 text-green-200 transition hover:bg-green-800 hover:text-white"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                  <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5V11H8.5v3H11v7h2.5z" />
                </svg>
              </a>
            )}
            {site.instagramUrl && (
              <a
                href={site.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-green-900 text-green-200 transition hover:bg-green-800 hover:text-white"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden="true">
                  <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" stroke="none" />
                </svg>
              </a>
            )}
          </div>
        )}
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
        {/* shop */}
        <nav aria-label="Shop">
          <p className="font-semibold text-white">Shop</p>
          <ul className="mt-4 space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/category/${c.slug}`}
                  className="text-green-200 transition hover:text-white"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* help */}
        <nav aria-label="Help">
          <p className="font-semibold text-white">Help</p>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              { label: "Track Your Order", href: "/track-order" },
              { label: "Shop All", href: "/shop" },
              { label: "About Us", href: "/about" },
              { label: "Contact", href: "/contact" },
              { label: "FAQs", href: "#" },
              { label: "Privacy Policy", href: "#" },
              { label: "Terms of Service", href: "#" },
            ].map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-green-200 transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* contact */}
        <div>
          <p className="font-semibold text-white">Contact</p>
          {site?.storeAddress && <AddressLines address={site.storeAddress} />}
          <p className="mt-3 text-sm">
            {phone && telHref && (
              <>
                <a href={telHref} className="transition hover:text-white">
                  {phone}
                </a>
                <br />
              </>
            )}
            {emailAddr && (
              <a
                href={`mailto:${emailAddr}`}
                className="transition hover:text-white"
              >
                {emailAddr}
              </a>
            )}
          </p>
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.3-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4 0-.5.1-.7l.4-.5c.1-.2.1-.4 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.2-.7.6-.9 2.1.7 4.6 2.4 6.3 1.9 1.9 3.4 2.5 4.4 2.7.7.2 1.1.1 1.5-.1.4-.2 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.1-.4-.2z" />
              </svg>
              WhatsApp
            </a>
          )}
          {site?.openHours && (
            <p className="mt-3 text-xs text-green-300">{site.openHours}</p>
          )}
        </div>

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
          <p>© 2026 {name}. All rights reserved.</p>
          <p>Made with care in Dhaka, Bangladesh</p>
        </div>
      </div>
    </footer>
  );
}
