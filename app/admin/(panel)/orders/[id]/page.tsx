import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import OrderActions from "@/components/admin/OrderActions";


const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PACKED: "bg-violet-100 text-violet-800",
  SHIPPED: "bg-cyan-100 text-cyan-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
};

const FLOW = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"];

function formatTk(n: number): string {
  return `৳${n.toLocaleString("en-US")}`;
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  if (!db) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="font-medium text-stone-700">Database not configured.</p>
      </div>
    );
  }

  const order = await db.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
    },
  });
  if (!order) notFound();

  const flowIndex = FLOW.indexOf(order.status);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders" className="text-sm font-medium text-green-700 hover:underline">
          ← Orders
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">{order.orderNumber}</h1>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[order.status] ?? "bg-stone-100 text-stone-600"}`}
        >
          {order.status}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Customer */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-stone-900">Customer</h2>
          <p className="font-medium">{order.customer.name}</p>
          <p className="text-sm text-stone-600">{order.customer.phone}</p>
          <p className="mt-2 text-sm text-stone-600">{order.customer.address}</p>
          <p className="text-sm text-stone-500">{order.customer.area}</p>
          {order.notes && (
            <p className="mt-3 rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-600">
              “{order.notes}”
            </p>
          )}
          <p className="mt-3 text-xs text-stone-400">
            Placed {new Date(order.createdAt).toLocaleString("en-GB")}
          </p>
        </div>

        {/* Items */}
        <div className="rounded-xl bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-3 font-semibold text-stone-900">Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-xs uppercase text-stone-500">
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3 text-right">Unit price</th>
                  <th className="py-2 pr-3 text-right">Qty</th>
                  <th className="py-2 text-right">Line total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((i) => (
                  <tr key={i.id} className="border-b border-stone-100 last:border-0">
                    <td className="py-2 pr-3">{i.productName}</td>
                    <td className="py-2 pr-3 text-right text-stone-500">{formatTk(i.unitPrice)}</td>
                    <td className="py-2 pr-3 text-right">{i.qty}</td>
                    <td className="py-2 text-right font-medium">{formatTk(i.unitPrice * i.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-1 border-t border-stone-200 pt-3 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>{formatTk(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>
                  Discount{order.promoCode ? ` (${order.promoCode})` : ""}
                </span>
                <span>−{formatTk(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-600">
              <span>Delivery</span>
              <span>{order.deliveryCharge === 0 ? "Free" : formatTk(order.deliveryCharge)}</span>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold text-stone-900">
              <span>Total</span>
              <span>{formatTk(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Payment */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-stone-900">Payment</h2>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-500">Method</span>
              <span className="font-medium">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Status</span>
              <span className="font-medium">{order.paymentStatus}</span>
            </div>
            {order.trackingCode && (
              <div className="flex justify-between">
                <span className="text-stone-500">Tracking</span>
                <span className="font-medium">{order.trackingCode}</span>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-xl bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-3 font-semibold text-stone-900">Status timeline</h2>
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {FLOW.map((s, i) => {
              const reached = flowIndex >= 0 && i <= flowIndex && order.status !== "CANCELLED";
              const current = FLOW[flowIndex] === s && order.status !== "CANCELLED";
              return (
                <div key={s} className="flex shrink-0 items-center gap-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        reached ? "bg-green-700 text-white" : "bg-stone-200 text-stone-500"
                      } ${current ? "ring-2 ring-green-700/40" : ""}`}
                    >
                      {reached ? "✓" : i + 1}
                    </div>
                    <span className="mt-1 text-[10px] font-medium text-stone-500">
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </span>
                  </div>
                  {i < FLOW.length - 1 && (
                    <div className={`mb-5 h-0.5 w-8 ${i < flowIndex ? "bg-green-700" : "bg-stone-200"}`} />
                  )}
                </div>
              );
            })}
            {order.status === "CANCELLED" && (
              <span className="ml-2 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                CANCELLED
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-stone-900">Actions</h2>
        <OrderActions
          orderId={order.id}
          status={order.status}
          paymentStatus={order.paymentStatus}
        />
      </div>
    </div>
  );
}
