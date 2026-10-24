import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getProducts } from "@/lib/catalog";


export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await getProducts({ q: query }) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <p className="text-sm text-stone-500">
        Home / <span className="text-green-700">Search</span>
      </p>
      <h1 className="mt-1 text-3xl font-extrabold text-stone-800">
        {query ? (
          <>
            Results for <span className="text-green-700">“{query}”</span>
          </>
        ) : (
          "Search products"
        )}
      </h1>
      <p className="mt-1 text-stone-500">
        {query
          ? `${results.length} product${results.length === 1 ? "" : "s"} found`
          : "Type something in the search bar above to find products."}
      </p>

      {query && results.length === 0 && (
        <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-10 text-center">
          <p className="text-lg font-semibold text-stone-700">
            Nothing matched “{query}”.
          </p>
          <p className="mt-2 text-sm text-stone-500">
            Try “honey”, “dates”, “ghee” or “rice”.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
          >
            Browse Home
          </Link>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
