import Link from "next/link";

const STATS = [
  { value: "24+", label: "Curated products" },
  { value: "7", label: "Fresh categories" },
  { value: "4.8", label: "Average rating" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-800 to-emerald-900">
      {/* decorative circles */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-green-600/40" />
        <div className="absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-amber-400/20" />
        <div className="absolute right-1/3 top-1/2 h-40 w-40 rounded-full bg-emerald-400/20" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 py-16 md:flex-row md:items-center md:justify-between md:py-24">
        <div className="max-w-xl">
          <span className="inline-block rounded-full bg-amber-400 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-green-950">
            Farm fresh · Dhaka delivery
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white md:text-5xl">
            Deshi Groceries,
            <br />
            Honest Prices.
          </h1>
          <p className="mt-4 text-lg text-green-100">
            Raw honey, premium dates, freshly ground spices, pure ghee and
            everyday staples — sourced from trusted farms across Bangladesh
            and delivered to your doorstep.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="#categories"
              className="rounded-full bg-amber-400 px-7 py-3 font-semibold text-green-950 shadow-lg transition hover:bg-amber-300"
            >
              Shop Categories
            </Link>
            <Link
              href="#deals"
              className="rounded-full border-2 border-white/70 px-7 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Today&apos;s Deals
            </Link>
          </div>
          <dl className="mt-10 flex gap-8">
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-3xl font-extrabold text-white">{s.value}</dd>
                <dd className="text-sm text-green-200">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* floating basket card */}
        <div className="hidden w-full max-w-sm md:block">
          <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">
            <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-xl">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8" aria-hidden="true">
                  <path d="M8 8h8v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8z" />
                  <path d="M8 8c0-1.5 1.8-1.5 1.8-3h4.4c0 1.5 1.8 1.5 1.8 3" />
                  <path d="M9.5 5h5" />
                </svg>
              </span>
              <div>
                <p className="text-sm text-stone-500">This week&apos;s best seller</p>
                <p className="font-bold text-stone-800">Sundarban Wild Forest Honey</p>
                <p className="text-sm font-bold text-green-700">৳850 <span className="font-normal text-stone-400 line-through">৳950</span></p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-xl">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-600 to-amber-900">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8" aria-hidden="true">
                  <ellipse cx="12" cy="13" rx="5" ry="7" />
                  <path d="M12 6c0-2 1-3.5 3-4.5" />
                </svg>
              </span>
              <div>
                <p className="text-sm text-stone-500">Customer favourite</p>
                <p className="font-bold text-stone-800">Medjool Premium Dates</p>
                <p className="text-sm font-bold text-green-700">৳1150 <span className="font-normal text-stone-400 line-through">৳1350</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
