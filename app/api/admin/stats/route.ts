import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { requireDb } from "@/lib/admin-db";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const result = requireDb();
  if ("response" in result) return result.response;
  const { db } = result;

  const [revenue, orders, pending, products, customers, lowStock] = await Promise.all([
    db.order.aggregate({
      _sum: { total: true },
      where: { status: { not: "CANCELLED" } },
    }),
    db.order.count(),
    db.order.count({ where: { status: "PENDING" } }),
    db.product.count(),
    db.customer.count(),
    db.product.count({ where: { stock: { lt: 10 } } }),
  ]);

  return NextResponse.json({
    revenue: revenue._sum.total ?? 0,
    orders,
    pending,
    products,
    customers,
    lowStock,
  });
}
