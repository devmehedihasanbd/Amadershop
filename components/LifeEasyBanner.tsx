import Link from "next/link";
import { getSettings } from "@/lib/settings";

/**
 * Full-width CTA banner in the style of the organic storefront reference:
 * "We Make Your Daily Life More Easy" — drives to the shop + WhatsApp order.
 */
export default async function LifeEasyBanner() {
  const site = await getSettings().catch(() => null);
  const whatsapp = (site?.contactWhatsapp || "").replace(/[^\d]/g, "");
  const phone = site?.contactPhone || "";
  const name = site?.storeName || "Amader Shop";

  return (
    <section className="relative overflow-hidden bg-green-700">
      {/* decorative blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-green-600/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-lime-500/30 blur-3xl"
      />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-16 text-center sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-lime-200">
          Home delivery across Dhaka
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
          We Make Your Daily Life More Easy
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-green-100 sm:text-base">
          Order {name} groceries in minutes — source-checked, fairly priced,
          and at your doorstep the same day. Cash on delivery, no hassle.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/shop"
            className="rounded-full bg-white px-8 py-3.5 font-bold text-green-800 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            Shop Now
          </Link>
          {whatsapp ? (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border-2 border-white/70 px-8 py-3 font-bold text-white transition hover:bg-white/10"
            >
              Order on WhatsApp
            </a>
          ) : phone ? (
            <a
              href={`tel:${phone.replace(/[^\d+]/g, "")}`}
              className="rounded-full border-2 border-white/70 px-8 py-3 font-bold text-white transition hover:bg-white/10"
            >
              Call {phone}
            </a>
          ) : null}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-semibold text-green-100">
          <span>✓ 100% authentic products</span>
          <span>✓ Same-day delivery</span>
          <span>✓ Cash on delivery</span>
        </div>
      </div>
    </section>
  );
}
