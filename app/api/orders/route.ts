import { NextResponse } from "next/server";
import {
  createOrder,
  ValidationError,
  type CreateOrderInput,
  type PaymentMethodId,
} from "@/lib/orders";
import { getPaymentMethods } from "@/lib/site-config";

const PROVIDER_LABEL: Record<PaymentMethodId, string> = {
  COD: "Cash on Delivery",
  BKASH: "bKash",
  NAGAD: "Nagad",
  ROCKET: "Rocket",
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const b = body as Partial<CreateOrderInput> | null;
  const input: CreateOrderInput = {
    customer: {
      name: String(b?.customer?.name ?? ""),
      phone: String(b?.customer?.phone ?? ""),
      address: String(b?.customer?.address ?? ""),
      area: String(b?.customer?.area ?? ""),
    },
    items: Array.isArray(b?.items)
      ? b.items.map((i) => ({
          slug: String((i as { slug?: unknown })?.slug ?? ""),
          qty: Number((i as { qty?: unknown })?.qty),
        }))
      : [],
    paymentMethod: String(b?.paymentMethod ?? "COD").toUpperCase() as PaymentMethodId,
    promoCode: typeof b?.promoCode === "string" ? b.promoCode : undefined,
    notes: typeof b?.notes === "string" ? b.notes : undefined,
  };

  // Honor the admin panel's payment toggles (/admin/payments).
  const methods = await getPaymentMethods();
  const chosen = methods.find((m) => m.id === input.paymentMethod.toLowerCase());
  if (!chosen?.enabled) {
    return NextResponse.json(
      { error: "Invalid order.", details: ["This payment method is not available right now."] },
      { status: 400 }
    );
  }

  try {
    const order = await createOrder(input);
    return NextResponse.json(
      {
        orderNumber: order.orderNumber,
        subtotal: order.subtotal,
        discount: order.discount,
        promoCode: order.promoCode,
        deliveryCharge: order.deliveryCharge,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        status: order.status,
        requiresPayment: order.requiresPayment,
        ...(order.requiresPayment
          ? {
              provider: order.paymentMethod.toLowerCase(),
              message: `${PROVIDER_LABEL[order.paymentMethod]} online payment is not live yet. Your order is saved — pay on the provider app, or place it as Cash on Delivery.`,
            }
          : {}),
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json(
        { error: "Invalid order.", details: err.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/orders failed:", err);
    return NextResponse.json(
      { error: "Could not place the order. Please try again." },
      { status: 500 }
    );
  }
}
