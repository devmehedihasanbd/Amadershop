"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FLOW = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const;

const NEXT_LABEL: Record<string, string> = {
  PENDING: "Confirm order",
  CONFIRMED: "Mark as packed",
  PACKED: "Mark as shipped",
  SHIPPED: "Mark as delivered",
};

export default function OrderActions({
  orderId,
  status,
  paymentStatus,
}: {
  orderId: string;
  status: string;
  paymentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(data: Record<string, string>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error ?? "Update failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  const nextStatus = FLOW[FLOW.indexOf(status as (typeof FLOW)[number]) + 1];
  const isCancelled = status === "CANCELLED";
  const isDelivered = status === "DELIVERED";

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {!isCancelled && !isDelivered && nextStatus && (
          <button
            disabled={loading}
            onClick={() => patch({ status: nextStatus })}
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {NEXT_LABEL[status] ?? `Move to ${nextStatus}`}
          </button>
        )}
        {!isCancelled && !isDelivered && (
          <button
            disabled={loading}
            onClick={() => {
              if (confirm("Cancel this order?")) patch({ status: "CANCELLED" });
            }}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Cancel order
          </button>
        )}
        {paymentStatus !== "PAID" && (
          <button
            disabled={loading}
            onClick={() => patch({ paymentStatus: "PAID" })}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50"
          >
            Mark payment as paid
          </button>
        )}
        {paymentStatus === "PAID" && (
          <button
            disabled={loading}
            onClick={() => patch({ paymentStatus: "PENDING" })}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50"
          >
            Mark payment as pending
          </button>
        )}
      </div>
    </div>
  );
}
