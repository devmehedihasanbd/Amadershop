"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Slide {
  image: string;
  alt: string;
  eyebrow: string;
  headline: string;
  sub: string;
  ctaHref: string;
  ctaLabel: string;
}

const SLIDES: Slide[] = [
  {
    image: "/hero-1.jpg",
    alt: "Raw honey jars with golden honeycomb",
    eyebrow: "Raw & Unfiltered",
    headline: "Pure Sundarban Honey",
    sub: "Thick, dark and fragrant — harvested from the mangrove forests and delivered to your door.",
    ctaHref: "/category/honey",
    ctaLabel: "Shop Honey",
  },
  {
    image: "/hero-2.jpg",
    alt: "Premium dates and mixed nuts arranged elegantly",
    eyebrow: "Premium & Fresh",
    headline: "Dates & Nuts, Handpicked",
    sub: "Medjool, Ajwa and Sukkari dates plus crunchy almonds and cashews for every day.",
    ctaHref: "/category/dates",
    ctaLabel: "Shop Dates",
  },
  {
    image: "/hero-3.jpg",
    alt: "Colorful Bangladeshi spices in bowls",
    eyebrow: "Freshly Ground",
    headline: "Spices With Soul",
    sub: "Turmeric, dried chili and cardamom — ground fresh every week for real deshi flavour.",
    ctaHref: "/category/spices",
    ctaLabel: "Shop Spices",
  },
];

const AUTOPLAY_MS = 5000;

interface ApiBanner {
  id: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  image: string | null;
  link: string;
  linkLabel: string | null;
}

function toSlide(b: ApiBanner): Slide | null {
  if (!b.image) return null;
  return {
    image: b.image,
    alt: b.title,
    eyebrow: b.eyebrow ?? "",
    headline: b.title,
    sub: b.subtitle ?? "",
    ctaHref: b.link || "/",
    ctaLabel: b.linkLabel || "Shop Now",
  };
}

export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [dbSlides, setDbSlides] = useState<Slide[] | null>(null);
  const touchX = useRef<number | null>(null);

  // Banners managed from the admin panel (/admin/banners). Falls back to
  // the built-in slides until at least one active hero banner exists.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/banners?placement=hero")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json || !Array.isArray(json.banners)) return;
        const slides = (json.banners as ApiBanner[])
          .map(toSlide)
          .filter((s): s is Slide => s !== null);
        if (slides.length > 0) setDbSlides(slides);
      })
      .catch(() => {
        /* keep built-in slides */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const slides = dbSlides ?? SLIDES;
  useEffect(() => {
    setIndex(0);
  }, [dbSlides]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + slides.length) % slides.length),
    []
  );

  useEffect(() => {
    if (paused || reducedMotion) return;
    const t = setInterval(() => go(1), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, reducedMotion, go, index]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  return (
    <section
      aria-label="Featured collections"
      className="relative overflow-hidden bg-stone-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative h-[430px] md:h-[560px]">
        {slides.map((s, i) => (
          <div
            key={s.image.slice(0, 64) + i}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {s.image.startsWith("/") ? (
              <Image
                src={s.image}
                alt={s.alt}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.image}
                alt={s.alt}
                loading={i === 0 ? "eager" : "lazy"}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            {/* dark gradient overlay for legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        ))}

        {/* copy */}
        <div className="relative mx-auto flex h-full max-w-7xl items-center px-4">
          <div key={index} className="max-w-xl animate-hero-copy">
            {slides[index].eyebrow && (
              <span className="inline-block rounded-full bg-amber-400 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-stone-950">
                {slides[index].eyebrow}
              </span>
            )}
            <h1 className="mt-4 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:mt-5 md:text-6xl">
              {slides[index].headline}
            </h1>
            <p className="mt-3 max-w-md text-base text-stone-200 md:mt-4 md:text-lg">
              {slides[index].sub}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 md:mt-8">
              <Link
                href={slides[index].ctaHref}
                className="rounded-full bg-amber-400 px-7 py-3 font-semibold text-stone-950 shadow-lg transition hover:scale-105 hover:bg-amber-300 active:scale-95"
              >
                {slides[index].ctaLabel}
              </Link>
              <a
                href="#deals"
                className="rounded-full border-2 border-white/70 px-7 py-3 font-semibold text-white transition hover:scale-105 hover:bg-white/10 active:scale-95"
              >
                View Offers
              </a>
            </div>
          </div>
        </div>

        {/* prev / next */}
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/40 p-3 text-white backdrop-blur transition hover:bg-black/60 md:block"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/40 p-3 text-white backdrop-blur transition hover:bg-black/60 md:block"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>

        {/* dots */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 md:bottom-5">
          {slides.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="flex min-h-[32px] min-w-[32px] items-center justify-center"
            >
              <span
                aria-hidden="true"
                className={`block h-2.5 rounded-full transition-all ${
                  i === index ? "w-8 bg-amber-400" : "w-2.5 bg-white/50"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
