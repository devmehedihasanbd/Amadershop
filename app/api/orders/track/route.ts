import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getOrderByNumber } from "@/lib/orders";

function normalizePhone(raw: string): string {
  return raw.replace(/[\s-]/g, "");
}

/**
 * Public order tracking. The caller must supply the phone number used
 * for the order — the status is only returned when it matches.
 * The returned view contains no customer PII.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const orderNumber = String(b.orderNumber ?? "").trim().toUpperCase();
  const phone = normalizePhone(String(b.phone ?? ""));

  if (!orderNumber || !phone) {
    return NextResponse.json(
      { error: "Order number and phone number are required." },
      { status: 400 }
    );
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const order = await db.order.findUnique({
    where: { orderNumber },
    select: { customer: { select: { phone: true } } },
  });
  if (!order || normalizePhone(order.customer.phone) !== phone) {
    // Same response for unknown order vs. wrong phone (no enumeration).
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const view = await getOrderByNumber(orderNumber);
  if (!view) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  return NextResponse.json({ order: view });
}
