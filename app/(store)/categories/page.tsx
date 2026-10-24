import type { Metadata } from "next";
import CategoryCard from "@/components/CategoryCard";
import SectionHeader from "@/components/SectionHeader";
import Reveal from "@/components/Reveal";
import { getCategories } from "@/lib/catalog";


export const metadata: Metadata = {
  title: "Shop by Category — Amader Shop",
  description:
    "Browse all grocery categories at Amader Shop: honey, dates, spices, oils & ghee, rice & lentils, nuts and organic specials.",
};

// Always render fresh from the live DB: admin changes must show
// immediately, with no build-time static cache in the way.
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Reveal>
        <SectionHeader
          eyebrow="Browse the shelves"
          title="Shop by Category"
          subtitle="Seven shelves, one honest bazaar."
        />
      </Reveal>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c, i) => (
          <Reveal key={c.slug} delay={Math.min(i, 6) * 60}>
            <CategoryCard category={c} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
