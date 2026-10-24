import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import OrderActions from "@/components/admin/OrderActions";
import {
  EmptyState,
  Panel,
  StatusPill,
  formatTk,
} from "@/components/admin/ui";

const FLOW = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"];

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  if (!db) {
    return <EmptyState message="Database not configured." />;
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:underline"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 19l-7-7 7-7" />
          </svg>
          Orders
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-stone-900">
          {order.orderNumber}
        </h1>
        <StatusPill status={order.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Customer */}
        <Panel title="Customer">
          <p className="font-semibold text-stone-900">{order.customer.name}</p>
          <p className="text-sm text-stone-600">{order.customer.phone}</p>
          <p className="mt-2 text-sm text-stone-600">{order.customer.address}</p>
          <p className="text-sm text-stone-500">{order.customer.area}</p>
          {order.notes && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-stone-600 ring-1 ring-inset ring-amber-200">
              “{order.notes}”
            </p>
          )}
          <p className="mt-3 text-xs text-stone-400">
            Placed {new Date(order.createdAt).toLocaleString("en-GB")}
          </p>
        </Panel>

        {/* Items */}
        <Panel title={`Items (${order.items.length})`} className="lg:col-span-2">
          <ul className="divide-y divide-stone-100">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate font-medium text-stone-900">{i.productName}</p>
                  <p className="text-xs text-stone-500">
                    {formatTk(i.unitPrice)} × {i.qty}
                  </p>
                </div>
                <p className="shrink-0 font-semibold text-stone-900">
                  {formatTk(i.unitPrice * i.qty)}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1.5 border-t border-stone-200 pt-4 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>{formatTk(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between font-medium text-green-700">
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
            <div className="flex justify-between border-t border-stone-200 pt-2.5 text-base font-bold text-stone-900">
              <span>Total</span>
              <span>{formatTk(order.total)}</span>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Payment */}
        <Panel title="Payment">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-500">Method</dt>
              <dd className="font-semibold text-stone-900">{order.paymentMethod}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Status</dt>
              <dd className="font-semibold text-stone-900">{order.paymentStatus}</dd>
            </div>
            {order.trackingCode && (
              <div className="flex justify-between gap-2">
                <dt className="text-stone-500">Tracking</dt>
                <dd className="truncate font-semibold text-stone-900">{order.trackingCode}</dd>
              </div>
            )}
          </dl>
        </Panel>

        {/* Timeline */}
        <Panel title="Status timeline" className="lg:col-span-2">
          <div className="flex items-start gap-0.5 overflow-x-auto py-2 sm:gap-1">
            {FLOW.map((s, i) => {
              const reached = flowIndex >= 0 && i <= flowIndex && order.status !== "CANCELLED";
              const current = FLOW[flowIndex] === s && order.status !== "CANCELLED";
              return (
                <div key={s} className="flex shrink-0 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition ${
                        reached ? "bg-green-700 text-white" : "bg-stone-200 text-stone-500"
                      } ${current ? "ring-2 ring-green-700/40 ring-offset-2" : ""}`}
                    >
                      {reached ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span className={`mt-1.5 text-[10px] font-semibold ${reached ? "text-stone-700" : "text-stone-400"}`}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </span>
                  </div>
                  {i < FLOW.length - 1 && (
                    <div className={`mb-6 h-0.5 w-6 sm:w-10 ${i < flowIndex && order.status !== "CANCELLED" ? "bg-green-700" : "bg-stone-200"}`} />
                  )}
                </div>
              );
            })}
            {order.status === "CANCELLED" && (
              <span className="ml-2 shrink-0 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-200">
                Cancelled
              </span>
            )}
          </div>
        </Panel>
      </div>

      {/* Actions */}
      <Panel title="Actions">
        <OrderActions
          orderId={order.id}
          status={order.status}
          paymentStatus={order.paymentStatus}
        />
      </Panel>
    </div>
  );
}
