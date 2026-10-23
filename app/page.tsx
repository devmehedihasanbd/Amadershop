import Link from "next/link";
import Hero from "@/components/Hero";
import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import Testimonials from "@/components/Testimonials";
import { getCategories, getProducts } from "@/lib/catalog";

const FEATURES = [
  {
    title: "100% Authentic",
    text: "Every batch is source-checked. No mixing, no artificial colour, no shortcuts.",
    icon: (
      <>
        <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
  },
  {
    title: "Fast Dhaka Delivery",
    text: "Order today, cook tomorrow. Same-week delivery across all of Dhaka.",
    icon: (
      <>
        <path d="M3 7h11v9H3z" />
        <path d="M14 10h4l3 3v3h-7z" />
        <circle cx="7" cy="18.5" r="1.6" />
        <circle cx="17" cy="18.5" r="1.6" />
      </>
    ),
  },
  {
    title: "Honest Prices",
    text: "Fair rates in taka, weekly deals, and free delivery on orders over ৳2000.",
    icon: (
      <>
        <path d="M3 12V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" />
        <path d="M3 12h18v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z" />
        <path d="M7 15h4" />
      </>
    ),
  },
  {
    title: "Easy Returns",
    text: "Something off? Tell us within 7 days and we will make it right.",
    icon: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
      </>
    ),
  },
];

export default async function Home() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ sort: "popular" }),
  ]);
  const bestSellers = products.filter((p) => p.badge === "best-selling");
  const newArrivals = products.filter((p) => p.badge === "new");

  return (
    <>
      <Hero />

      {/* Featured categories */}
      <section
        id="categories"
        className="mx-auto max-w-7xl scroll-mt-32 px-4 py-14"
        aria-labelledby="categories-heading"
      >
        <div className="flex items-end justify-between">
          <div>
            <h2
              id="categories-heading"
              className="text-2xl font-extrabold text-stone-800 md:text-3xl"
            >
              Featured Categories
            </h2>
            <p className="mt-1 text-stone-500">
              Seven shelves, one honest bazaar.
            </p>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {categories.map((c) => (
            <CategoryCard key={c.slug} category={c} />
          ))}
        </div>
      </section>

      {/* Top selling */}
      <section
        className="bg-white py-14"
        aria-labelledby="bestsellers-heading"
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-end justify-between">
            <div>
              <h2
                id="bestsellers-heading"
                className="text-2xl font-extrabold text-stone-800 md:text-3xl"
              >
                Top Selling Products
              </h2>
              <p className="mt-1 text-stone-500">
                The items Dhaka keeps reordering.
              </p>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {bestSellers.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Offer banners */}
      <section
        id="deals"
        className="mx-auto max-w-7xl scroll-mt-32 px-4 py-14"
        aria-labelledby="deals-heading"
      >
        <h2 id="deals-heading" className="sr-only">
          Current offers
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Link
            href="/category/dates"
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-orange-700 p-8 text-white shadow-lg"
          >
            <div aria-hidden="true" className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/15" />
            <p className="text-xs font-bold uppercase tracking-widest text-amber-100">
              This week only
            </p>
            <p className="mt-2 text-3xl font-extrabold">
              Up to 15% off
              <br />
              Premium Dates
            </p>
            <p className="mt-2 text-amber-100">
              Stock up for the month — Medjool, Ajwa, Sukkari &amp; more.
            </p>
            <span className="mt-5 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-bold text-orange-700 transition group-hover:bg-amber-100">
              Shop Dates →
            </span>
          </Link>
          <Link
            href="/category/honey"
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 to-emerald-800 p-8 text-white shadow-lg"
          >
            <div aria-hidden="true" className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/10" />
            <p className="text-xs font-bold uppercase tracking-widest text-green-200">
              Free delivery
            </p>
            <p className="mt-2 text-3xl font-extrabold">
              On orders over
              <br />
              ৳2000
            </p>
            <p className="mt-2 text-green-100">
              Fill your cart with raw honey, ghee and spices — delivery is on us.
            </p>
            <span className="mt-5 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-bold text-green-800 transition group-hover:bg-green-100">
              Shop Honey →
            </span>
          </Link>
        </div>
      </section>

      {/* New arrivals strip */}
      <section className="mx-auto max-w-7xl px-4 pb-14" aria-labelledby="new-heading">
        <h2
          id="new-heading"
          className="text-2xl font-extrabold text-stone-800 md:text-3xl"
        >
          New Arrivals
        </h2>
        <p className="mt-1 text-stone-500">Fresh off the shelf this month.</p>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {newArrivals.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* Why shop with us */}
      <section className="bg-green-50 py-14" aria-labelledby="why-heading">
        <div className="mx-auto max-w-7xl px-4">
          <h2
            id="why-heading"
            className="text-center text-2xl font-extrabold text-stone-800 md:text-3xl"
          >
            Why Shop With BazarGhor?
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-green-700"
                    aria-hidden="true"
                  >
                    {f.icon}
                  </svg>
                </span>
                <p className="mt-4 font-bold text-stone-800">{f.title}</p>
                <p className="mt-1 text-sm text-stone-500">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />
    </>
  );
}
