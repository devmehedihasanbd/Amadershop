import { NextResponse } from "next/server";
import { getProducts, type SortKey } from "@/lib/catalog";

const SORTS: SortKey[] = ["popular", "price-asc", "price-desc"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sortParam = url.searchParams.get("sort");
  const sort: SortKey = SORTS.includes(sortParam as SortKey)
    ? (sortParam as SortKey)
    : "popular";

  const products = await getProducts({
    categorySlug: url.searchParams.get("category") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    sort,
  });
  return NextResponse.json({ products });
}
