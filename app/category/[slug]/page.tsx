import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategories, getCategory, getProducts } from "@/lib/catalog";
import CategoryView from "./CategoryView";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  return {
    title: category ? `${category.name} — BazarGhor` : "Category — BazarGhor",
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  const products = await getProducts({ categorySlug: slug, sort: "popular" });
  return <CategoryView category={category} products={products} />;
}
