import { NextResponse } from "next/server";
import { getOrderInternal, saveSteadfastBooking } from "@/lib/orders";
import { bookSteadfastConsignment } from "@/lib/courier/steadfast";
import { NotConfiguredError } from "@/lib/payments/types";

/**
 * Book a Steadfast consignment for an existing order.
 * Body: { orderNumber: string }
 *
 * Manual step for the shop owner — never called automatically.
 * COD orders pass the order total as the collection amount;
 * prepaid orders book with cod_amount = 0.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const orderNumber = String((body as { orderNumber?: unknown })?.orderNumber ?? "").trim();
  if (!orderNumber) {
    return NextResponse.json({ error: "orderNumber is required." }, { status: 400 });
  }

  const order = await getOrderInternal(orderNumber);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  try {
    const booking = await bookSteadfastConsignment({
      invoice: order.orderNumber,
      recipientName: order.customer.name,
      recipientPhone: order.customer.phone,
      recipientAddress: `${order.customer.address}, ${order.customer.area}`,
      codAmount: order.paymentMethod === "COD" ? order.total : 0,
      note: order.notes ?? `Amader Shop order ${order.orderNumber}`,
    });

    const saved = await saveSteadfastBooking(
      order.orderNumber,
      booking.consignmentId,
      booking.trackingCode
    );
    if (!saved) {
      return NextResponse.json(
        { error: "Booked with Steadfast but could not save the consignment." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderNumber: booking.invoice,
      consignmentId: booking.consignmentId,
      trackingCode: booking.trackingCode,
    });
  } catch (err) {
    if (err instanceof NotConfiguredError) {
      return NextResponse.json(
        {
          error: "STEADFAST_NOT_CONFIGURED",
          message: err.message,
        },
        { status: 501 }
      );
    }
    console.error("POST /api/courier/steadfast/book failed:", err);
    return NextResponse.json(
      { error: "Steadfast booking failed. Please try again." },
      { status: 502 }
    );
  }
}
