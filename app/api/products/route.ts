import { NextResponse } from "next/server";
import { getProducts, type SortKey } from "@/lib/catalog";

const SORTS: SortKey[] = ["popular", "price-asc", "price-desc"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sortParam = url.searchParams.get("sort");
  const sort: SortKey = SORTS.includes(sortParam as SortKey)
    ? (sortParam as SortKey)
    : "popular";

  // Optional comma-separated slug list — the cart uses this to resolve
  // exactly the products it holds (DB-first, includes photos).
  const slugsParam = (url.searchParams.get("slugs") ?? "").trim();
  const slugs = slugsParam
    ? slugsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 100)
    : undefined;

  const products = await getProducts({
    categorySlug: url.searchParams.get("category") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    sort,
    slugs,
  });
  return NextResponse.json({ products });
}
