import Link from "next/link";
import HeroSlider from "@/components/HeroSlider";
import OfferBanners from "@/components/OfferBanners";
import PromoPopup from "@/components/PromoPopup";
import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import Testimonials from "@/components/Testimonials";
import SectionHeader from "@/components/SectionHeader";
import Reveal from "@/components/Reveal";
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

const MARQUEE_ITEMS = [
  "Free delivery on orders over ৳2000",
  "100% authentic products",
  "Cash on Delivery available",
  "Flat 10% off your first order — code AMADER10",
  "Fresh stock every week",
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
      <PromoPopup />
      <HeroSlider />

      {/* trust marquee */}
      <div
        aria-hidden="true"
        className="overflow-hidden border-y border-amber-200 bg-amber-50 py-2.5"
      >
        <div className="animate-marquee flex w-max items-center gap-10 whitespace-nowrap">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-10 text-sm font-semibold text-amber-900"
            >
              {item}
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3 w-3 text-amber-500"
              >
                <path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2-6.3-4.5-6.3 4.5L8 13.8 2 9.2h7.6z" />
              </svg>
            </span>
          ))}
        </div>
      </div>

      {/* Featured categories */}
      <section
        id="categories"
        className="mx-auto max-w-7xl scroll-mt-32 px-4 py-14"
      >
        <Reveal>
          <SectionHeader
            id="categories-heading"
            eyebrow="Browse the shelves"
            title="Featured Categories"
            subtitle="Seven shelves, one honest bazaar."
          />
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {categories.map((c, i) => (
            <Reveal key={c.slug} delay={Math.min(i, 6) * 60}>
              <CategoryCard category={c} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Top selling */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal>
            <SectionHeader
              id="bestsellers-heading"
              eyebrow="Customer favourites"
              title="Top Selling Products"
              subtitle="The items Dhaka keeps reordering."
            />
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {bestSellers.map((p, i) => (
              <Reveal key={p.slug} delay={Math.min(i, 3) * 70}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Offer banners — managed from /admin/banners */}
      <section
        id="deals"
        className="mx-auto max-w-7xl scroll-mt-32 px-4 py-14"
      >
        <h2 id="deals-heading" className="sr-only">
          Current offers
        </h2>
        <OfferBanners />
      </section>

      {/* New arrivals strip */}
      <section className="mx-auto max-w-7xl px-4 pb-14">
        <Reveal>
          <SectionHeader
            id="new-heading"
            eyebrow="Just landed"
            title="New Arrivals"
            subtitle="Fresh off the shelf this month."
          />
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {newArrivals.map((p, i) => (
            <Reveal key={p.slug} delay={Math.min(i, 3) * 70}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Why shop with us */}
      <section className="bg-green-50 py-14">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal>
            <SectionHeader
              id="why-heading"
              align="center"
              eyebrow="Our promise"
              title="Why Shop With Amader Shop?"
            />
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={Math.min(i, 3) * 80}>
                <div className="h-full rounded-2xl border border-green-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
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
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />
    </>
  );
}
