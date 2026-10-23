import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireAdminApi } from "@/lib/admin-auth";
import { requireDb } from "@/lib/admin-db";

const VALID_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export async function GET(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const result = requireDb();
  if ("response" in result) return result.response;
  const { db } = result;

  const { searchParams } = new URL(request.url);
  const status = (searchParams.get("status") ?? "").toUpperCase();
  const q = (searchParams.get("q") ?? "").trim();

  const where: Prisma.OrderWhereInput = {};
  if ((VALID_STATUSES as readonly string[]).includes(status)) {
    where.status = status as (typeof VALID_STATUSES)[number];
  }
  if (q) {
    const digits = q.replace(/\D/g, "");
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      ...(digits.length >= 6
        ? [{ customer: { phone: { contains: digits } } }]
        : []),
    ];
  }

  const orders = await db.order.findMany({
    where,
    include: {
      customer: { select: { name: true, phone: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt.toISOString(),
      customerName: o.customer.name,
      customerPhone: o.customer.phone,
      itemCount: o._count.items,
      subtotal: o.subtotal,
      discount: o.discount,
      promoCode: o.promoCode,
      deliveryCharge: o.deliveryCharge,
      total: o.total,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      status: o.status,
    })),
  });
}
