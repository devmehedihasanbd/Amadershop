"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "./Reveal";

interface ApiBanner {
  id: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  image: string | null;
  link: string;
  linkLabel: string | null;
}

const GRADIENTS = [
  "from-amber-500 to-orange-700",
  "from-green-600 to-emerald-800",
  "from-rose-500 to-red-700",
  "from-sky-500 to-blue-700",
];

function TitleLines({ title }: { title: string }) {
  const lines = title.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

function OfferCard({ banner, index }: { banner: ApiBanner; index: number }) {
  const gradient = GRADIENTS[index % GRADIENTS.length];
  return (
    <Reveal delay={index === 0 ? 0 : 120}>
      <Link
        href={banner.link || "/"}
        className={`group relative block overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-8 text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl`}
      >
        {banner.image && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={banner.image}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
          </>
        )}
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/15 transition duration-500 group-hover:scale-125"
        />
        <div className="relative">
          {banner.eyebrow && (
            <p className="text-xs font-bold uppercase tracking-widest text-white/85">
              {banner.eyebrow}
            </p>
          )}
          <p className="mt-2 text-3xl font-extrabold">
            <TitleLines title={banner.title} />
          </p>
          {banner.subtitle && (
            <p className="mt-2 text-white/85">{banner.subtitle}</p>
          )}
          <span className="mt-5 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-bold text-stone-800 transition group-hover:scale-105">
            {banner.linkLabel || "Shop Now"} →
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

/** Built-in offer cards, shown until the admin creates their own. */
function DefaultOffers() {
  const defaults: ApiBanner[] = [
    {
      id: "default-dates",
      eyebrow: "This week only",
      title: "Up to 15% off\nPremium Dates",
      subtitle: "Stock up for the month — Medjool, Ajwa, Sukkari & more.",
      image: null,
      link: "/category/dates",
      linkLabel: "Shop Dates",
    },
    {
      id: "default-delivery",
      eyebrow: "Free delivery",
      title: "On orders over\n৳2000",
      subtitle: "Fill your cart with raw honey, ghee and spices — delivery is on us.",
      image: null,
      link: "/category/honey",
      linkLabel: "Shop Honey",
    },
  ];
  return (
    <>
      {defaults.map((b, i) => (
        <OfferCard key={b.id} banner={b} index={i} />
      ))}
    </>
  );
}

/**
 * "Current offers" cards on the homepage.
 * Managed from the admin panel (/admin/banners, placement = offer).
 */
export default function OfferBanners() {
  const [banners, setBanners] = useState<ApiBanner[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/banners?placement=offer")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json || !Array.isArray(json.banners)) return;
        setBanners(json.banners as ApiBanner[]);
      })
      .catch(() => {
        /* keep defaults */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const list = banners && banners.length > 0 ? banners : null;

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {list ? (
        list.map((b, i) => <OfferCard key={b.id} banner={b} index={i} />)
      ) : (
        <DefaultOffers />
      )}
    </div>
  );
}
