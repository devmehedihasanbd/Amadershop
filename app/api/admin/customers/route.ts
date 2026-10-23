import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireAdminApi } from "@/lib/admin-auth";
import { requireDb } from "@/lib/admin-db";

export async function GET(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const result = requireDb();
  if ("response" in result) return result.response;
  const { db } = result;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  const where: Prisma.CustomerWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q.replace(/\D/g, "") || q } },
    ];
  }

  const customers = await db.customer.findMany({
    where,
    include: {
      _count: { select: { orders: true } },
      orders: { select: { total: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json({
    customers: customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address,
      area: c.area,
      createdAt: c.createdAt.toISOString(),
      orderCount: c._count.orders,
      totalSpent: c.orders
        .filter((o) => o.status !== "CANCELLED")
        .reduce((s, o) => s + o.total, 0),
    })),
  });
}
