import { NextResponse } from "next/server";
import { getProduct, getRelatedProducts } from "@/lib/catalog";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
  const related = await getRelatedProducts(product, 4);
  return NextResponse.json({ product, related });
}
