"use client";

import { useSiteSettings } from "@/lib/use-site-settings";

export default function ContactPage() {
  const site = useSiteSettings();
  const name = site?.storeName || "Amader Shop";
  const phone = site?.contactPhone || "";
  const whatsapp = (site?.contactWhatsapp || "").replace(/[^\d]/g, "");
  const email = site?.contactEmail || "";
  const address = (site?.storeAddress || "").split("\n").map((l) => l.trim()).filter(Boolean);

  const cards = [
    phone && {
      title: "Phone",
      value: phone,
      href: `tel:${phone.replace(/[^\d+]/g, "")}`,
      icon: "M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.13.96.36 1.9.7 2.8a2 2 0 01-.45 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.45c.9.34 1.84.57 2.8.7A2 2 0 0122 16.9z",
    },
    whatsapp && {
      title: "WhatsApp",
      value: "Chat with us",
      href: `https://wa.me/${whatsapp}`,
      external: true,
      icon: "M21 12a9 9 0 11-16.6 4.8L3 21l4.3-1.3A9 9 0 0121 12zM9 9.5c.5 2.5 3 5 5.5 5.5l1-1.5 2.5 1.5c-.5 1.5-1.5 2-3 1.5-3.5-1-6.5-4-7.5-7.5-.5-1.5 0-2.5 1.5-3L10.5 8 9 9.5z",
    },
    email && {
      title: "Email",
      value: email,
      href: `mailto:${email}`,
      icon: "M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm18 3l-10 6L2 7",
    },
  ].filter(Boolean) as { title: string; value: string; href: string; external?: boolean; icon: string }[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs font-bold uppercase tracking-widest text-green-700">
        Get in touch
      </p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-stone-900">
        Contact {name}
      </h1>
      <p className="mt-2 text-stone-500">
        Questions about an order, a product, or delivery? We reply fast.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <a
            key={c.title}
            href={c.href}
            {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="group rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md"
          >
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700 transition group-hover:bg-green-600 group-hover:text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
                <path d={c.icon} />
              </svg>
            </span>
            <p className="mt-3 font-bold text-stone-900">{c.title}</p>
            <p className="mt-1 break-words text-sm text-stone-500">{c.value}</p>
          </a>
        ))}
      </div>

      {(address.length > 0 || site?.openHours) && (
        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          {address.length > 0 && (
            <div>
              <p className="font-bold text-stone-900">Visit us</p>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">
                {address.map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < address.length - 1 && <br />}
                  </span>
                ))}
              </p>
            </div>
          )}
          {site?.openHours && (
            <p className="mt-3 text-sm text-stone-500">🕘 {site.openHours}</p>
          )}
        </div>
      )}
    </div>
  );
}
