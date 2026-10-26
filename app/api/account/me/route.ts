import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import {
  CUSTOMER_COOKIE_NAME,
  getSessionSecret,
  verifyCustomerSessionToken,
} from "@/lib/customer-auth";

/** Current customer + recent orders, or 401 when not logged in. */
export async function GET() {
  const db = getDb();
  if (!db) {
    return NextResponse.json({ customer: null }, { status: 401 });
  }

  const token = (await cookies()).get(CUSTOMER_COOKIE_NAME)?.value ?? "";
  if (!token) {
    return NextResponse.json({ customer: null }, { status: 401 });
  }

  const secret = await getSessionSecret(db);
  const customerId = verifyCustomerSessionToken(token, secret);
  if (!customerId) {
    return NextResponse.json({ customer: null }, { status: 401 });
  }

  const customer = await db.customer.findUnique({
    where: { id: customerId },
    select: { id: true, name: true, phone: true, email: true },
  });
  if (!customer) {
    return NextResponse.json({ customer: null }, { status: 401 });
  }

  const orders = await db.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      items: { select: { productName: true, qty: true, unitPrice: true } },
    },
  });

  return NextResponse.json({
    customer: {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
    },
    orders: orders.map((o) => ({
      orderNumber: o.orderNumber,
      status: o.status,
      paymentMethod: o.paymentMethod,
      total: o.total,
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((i) => ({
        name: i.productName,
        qty: i.qty,
        price: i.unitPrice,
      })),
    })),
  });
}
