import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct, getProducts, getRelatedProducts } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";
import ProductDetail from "./ProductDetail";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  return {
    title: product ? `${product.name} — Amader Shop` : "Product — Amader Shop",
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 md:pb-0">
      <ProductDetail product={product} />

      <section className="mt-14" aria-labelledby="related-heading">
        <h2
          id="related-heading"
          className="text-2xl font-extrabold text-stone-800"
        >
          You may also like
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {related.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
