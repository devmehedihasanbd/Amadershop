import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { requireDb } from "@/lib/admin-db";

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED"] as const;

function serialize(order: {
  id: string;
  orderNumber: string;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  promoCode: string | null;
  deliveryCharge: number;
  total: number;
  notes: string | null;
  trackingCode: string | null;
  steadfastConsignmentId: string | null;
  customer: { name: string; phone: string; address: string; area: string };
  items: Array<{
    id: string;
    productName: string;
    unitPrice: number;
    qty: number;
  }>;
}) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    discount: order.discount,
    promoCode: order.promoCode,
    deliveryCharge: order.deliveryCharge,
    total: order.total,
    notes: order.notes,
    trackingCode: order.trackingCode,
    steadfastConsignmentId: order.steadfastConsignmentId,
    customer: order.customer,
    items: order.items,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const result = requireDb();
  if ("response" in result) return result.response;
  const { db } = result;
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      customer: {
        select: { name: true, phone: true, address: true, area: true },
      },
      items: {
        select: { id: true, productName: true, unitPrice: true, qty: true },
      },
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  return NextResponse.json({ order: serialize(order) });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const result = requireDb();
  if ("response" in result) return result.response;
  const { db } = result;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const b = body as { status?: unknown; paymentStatus?: unknown };
  const data: { status?: (typeof ORDER_STATUSES)[number]; paymentStatus?: (typeof PAYMENT_STATUSES)[number] } = {};

  if (b.status !== undefined) {
    const s = String(b.status).toUpperCase();
    if (!(ORDER_STATUSES as readonly string[]).includes(s)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    data.status = s as (typeof ORDER_STATUSES)[number];
  }
  if (b.paymentStatus !== undefined) {
    const s = String(b.paymentStatus).toUpperCase();
    if (!(PAYMENT_STATUSES as readonly string[]).includes(s)) {
      return NextResponse.json({ error: "Invalid payment status." }, { status: 400 });
    }
    data.paymentStatus = s as (typeof PAYMENT_STATUSES)[number];
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const order = await db.order.update({
      where: { id },
      data,
      include: {
        customer: {
          select: { name: true, phone: true, address: true, area: true },
        },
        items: {
          select: { id: true, productName: true, unitPrice: true, qty: true },
        },
      },
    });
    return NextResponse.json({ order: serialize(order) });
  } catch {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
}
