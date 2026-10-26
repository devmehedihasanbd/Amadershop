import OfferBanners from "@/components/OfferBanners";
import FlashSale from "@/components/FlashSale";
import { getFlashSaleProducts } from "@/lib/catalog";

// Always render fresh from the live DB: admin changes must show
// immediately, with no build-time static cache in the way.
export const dynamic = "force-dynamic";

/**
 * Offers — the home page's offer cards and flash sale live here now.
 * Reached from the bottom tab bar's "Offer" tab and the header menu.
 */
export default async function OffersPage() {
  const flashSale = await getFlashSaleProducts(8);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
        Offers
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Deals, discounts and free-delivery offers — all in one place.
      </p>

      {/* Current offers — managed from /admin/banners (placement = offer) */}
      <section id="deals" className="mt-8">
        <h2 className="sr-only">Current offers</h2>
        <OfferBanners />
      </section>

      {/* Flash sale */}
      <div className="mt-4">
        <FlashSale products={flashSale} />
      </div>
    </div>
  );
}
