/* ------------------------------------------------------------------ */
/*  Order placement.                                                   */
/*                                                                     */
/*  Uses PostgreSQL (Prisma) when DATABASE_URL is set; otherwise falls */
/*  back to an EPHEMERAL in-memory store (dev only — orders vanish on  */
/*  restart). Prices always come from the server-side catalog, never   */
/*  from the client.                                                   */
/* ------------------------------------------------------------------ */

import { getDb } from "./db";
import { getProduct } from "./catalog";
import { applyPromoAsync } from "./promos";
import { getSettings } from "./settings";

export type PaymentMethodId = "COD" | "BKASH" | "NAGAD" | "ROCKET";

export const PAYMENT_METHODS: PaymentMethodId[] = ["COD", "BKASH", "NAGAD", "ROCKET"];

export const FREE_DELIVERY_THRESHOLD = 2000;
export const DELIVERY_CHARGE = 60;

const BD_MOBILE_RE = /^01[3-9]\d{8}$/;

export interface OrderItemInput {
  slug: string;
  qty: number;
}

export interface CustomerInput {
  name: string;
  phone: string;
  address: string;
  area: string;
}

export interface CreateOrderInput {
  customer: CustomerInput;
  items: OrderItemInput[];
  paymentMethod: PaymentMethodId;
  promoCode?: string;
  notes?: string;
}

export class ValidationError extends Error {
  readonly errors: string[];
  constructor(errors: string[]) {
    super(errors.join(" "));
    this.name = "ValidationError";
    this.errors = errors;
  }
}

export function validateOrderInput(input: CreateOrderInput): string[] {
  const errors: string[] = [];
  const c = input.customer ?? ({} as CustomerInput);

  if (!c.name?.trim()) errors.push("Customer name is required.");
  const phone = (c.phone ?? "").replace(/[\s-]/g, "");
  if (!BD_MOBILE_RE.test(phone)) {
    errors.push("Enter a valid 11-digit mobile number (e.g. 01712345678).");
  }
  if (!c.address?.trim()) errors.push("Delivery address is required.");
  if (!c.area?.trim()) errors.push("Delivery area is required.");

  if (!Array.isArray(input.items) || input.items.length === 0) {
    errors.push("Order must contain at least one item.");
  } else {
    for (const [i, item] of input.items.entries()) {
      if (!item?.slug || typeof item.slug !== "string") {
        errors.push(`Item ${i + 1}: product is required.`);
      }
      if (!Number.isInteger(item?.qty) || item.qty < 1 || item.qty > 20) {
        errors.push(`Item ${i + 1}: quantity must be between 1 and 20.`);
      }
    }
  }

  if (!PAYMENT_METHODS.includes(input.paymentMethod)) {
    errors.push("Payment method must be one of: COD, BKASH, NAGAD, ROCKET.");
  }
  return errors;
}

function makeOrderNumber(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `AS-${ymd}-${rand}`;
}

export interface ResolvedItem {
  productId: string | null; // null in mock mode
  slug: string;
  name: string;
  unitPrice: number;
  qty: number;
}

export interface CreatedOrder {
  orderNumber: string;
  subtotal: number;
  discount: number;
  promoCode: string | null;
  deliveryCharge: number;
  total: number;
  paymentMethod: PaymentMethodId;
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  status: string;
  requiresPayment: boolean;
}

export interface OrderStatusView {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  promoCode: string | null;
  deliveryCharge: number;
  total: number;
  items: { name: string; qty: number; unitPrice: number }[];
  trackingCode: string | null;
  createdAt: string;
}

/* ------------------------- ephemeral mock store ------------------------ */
/* Dev-only: used when DATABASE_URL is not configured.                   */

interface MockOrderRecord {
  orderNumber: string;
  customer: { name: string; phone: string; address: string; area: string };
  items: ResolvedItem[];
  paymentMethod: PaymentMethodId;
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  status: string;
  subtotal: number;
  discount: number;
  promoCode: string | null;
  deliveryCharge: number;
  total: number;
  notes?: string;
  trackingCode: string | null;
  steadfastConsignmentId: string | null;
  createdAt: string;
}

const mockOrders = new Map<string, MockOrderRecord>();

/* --------------------------------- API --------------------------------- */

export async function createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  const errors = validateOrderInput(input);
  if (errors.length > 0) throw new ValidationError(errors);

  const phone = input.customer.phone.replace(/[\s-]/g, "");

  // Resolve every item against the server-side catalog (never trust client prices).
  const resolved: ResolvedItem[] = [];
  for (const item of input.items) {
    const product = await getProduct(item.slug);
    if (!product) {
      throw new ValidationError([`Unknown product: ${item.slug}.`]);
    }
    resolved.push({
      productId: null,
      slug: product.slug,
      name: product.name,
      unitPrice: product.price,
      qty: item.qty,
    });
  }

  const subtotal = resolved.reduce((s, r) => s + r.unitPrice * r.qty, 0);
  // Promo code is validated server-side against live DB rules;
  // unknown/ineligible codes are ignored.
  const promo = await applyPromoAsync(input.promoCode, subtotal);
  const discount = promo?.discount ?? 0;
  const promoCode = promo?.code ?? null;
  // Delivery charges come from storefront settings (DB) with defaults.
  const settings = await getSettings();
  const deliveryCharge =
    subtotal >= settings.freeDeliveryThreshold ? 0 : settings.deliveryCharge;
  const total = subtotal - discount + deliveryCharge;
  const requiresPayment = input.paymentMethod !== "COD";

  const db = getDb();
  if (db) {
    // Unique order number with collision retry.
    let orderNumber = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = makeOrderNumber();
      const exists = await db.order.findUnique({
        where: { orderNumber: candidate },
        select: { id: true },
      });
      if (!exists) {
        orderNumber = candidate;
        break;
      }
    }
    if (!orderNumber) throw new Error("Could not generate a unique order number.");

    // Look up product IDs for the FK (catalog already validated slugs).
    const withIds: ResolvedItem[] = [];
    for (const r of resolved) {
      const row = await db.product.findUnique({
        where: { slug: r.slug },
        select: { id: true },
      });
      withIds.push({ ...r, productId: row?.id ?? null });
    }

    const order = await db.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { phone },
        update: {
          name: input.customer.name.trim(),
          address: input.customer.address.trim(),
          area: input.customer.area.trim(),
        },
        create: {
          name: input.customer.name.trim(),
          phone,
          address: input.customer.address.trim(),
          area: input.customer.area.trim(),
        },
      });
      return tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          paymentMethod: input.paymentMethod,
          subtotal,
          discount,
          promoCode,
          deliveryCharge,
          total,
          notes: input.notes?.trim() || null,
          items: {
            create: withIds
              .filter((r) => r.productId)
              .map((r) => ({
                productId: r.productId as string,
                productName: r.name,
                unitPrice: r.unitPrice,
                qty: r.qty,
              })),
          },
        },
      });
    });

    return {
      orderNumber: order.orderNumber,
      subtotal: order.subtotal,
      discount: order.discount,
      promoCode: order.promoCode,
      deliveryCharge: order.deliveryCharge,
      total: order.total,
      paymentMethod: input.paymentMethod,
      paymentStatus: "PENDING",
      status: order.status,
      requiresPayment,
    };
  }

  // Mock fallback (no database configured).
  let orderNumber = makeOrderNumber();
  while (mockOrders.has(orderNumber)) orderNumber = makeOrderNumber();
  mockOrders.set(orderNumber, {
    orderNumber,
    customer: {
      name: input.customer.name.trim(),
      phone,
      address: input.customer.address.trim(),
      area: input.customer.area.trim(),
    },
    items: resolved,
    paymentMethod: input.paymentMethod,
    paymentStatus: "PENDING",
    status: "PENDING",
    subtotal,
    discount,
    promoCode,
    deliveryCharge,
    total,
    notes: input.notes?.trim(),
    trackingCode: null,
    steadfastConsignmentId: null,
    createdAt: new Date().toISOString(),
  });

  return {
    orderNumber,
    subtotal,
    discount,
    promoCode,
    deliveryCharge,
    total,
    paymentMethod: input.paymentMethod,
    paymentStatus: "PENDING",
    status: "PENDING",
    requiresPayment,
  };
}

export async function getOrderByNumber(orderNumber: string): Promise<OrderStatusView | null> {
  const db = getDb();
  if (db) {
    const order = await db.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });
    if (!order) return null;
    return {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      discount: order.discount,
      promoCode: order.promoCode,
      deliveryCharge: order.deliveryCharge,
      total: order.total,
      items: order.items.map((i) => ({
        name: i.productName,
        qty: i.qty,
        unitPrice: i.unitPrice,
      })),
      trackingCode: order.trackingCode,
      createdAt: order.createdAt.toISOString(),
    };
  }

  const rec = mockOrders.get(orderNumber);
  if (!rec) return null;
  return {
    orderNumber: rec.orderNumber,
    status: rec.status,
    paymentMethod: rec.paymentMethod,
    paymentStatus: rec.paymentStatus,
    subtotal: rec.subtotal,
    discount: rec.discount,
    promoCode: rec.promoCode,
    deliveryCharge: rec.deliveryCharge,
    total: rec.total,
    items: rec.items.map((i) => ({ name: i.name, qty: i.qty, unitPrice: i.unitPrice })),
    trackingCode: rec.trackingCode,
    createdAt: rec.createdAt,
  };
}

/** Full order record for internal use (courier booking). Not customer-safe. */
export async function getOrderInternal(orderNumber: string): Promise<{
  orderNumber: string;
  total: number;
  paymentMethod: PaymentMethodId;
  customer: { name: string; phone: string; address: string; area: string };
  notes: string | null;
} | null> {
  const db = getDb();
  if (db) {
    const order = await db.order.findUnique({
      where: { orderNumber },
      include: { customer: true },
    });
    if (!order) return null;
    return {
      orderNumber: order.orderNumber,
      total: order.total,
      paymentMethod: order.paymentMethod as PaymentMethodId,
      customer: {
        name: order.customer.name,
        phone: order.customer.phone,
        address: order.customer.address,
        area: order.customer.area,
      },
      notes: order.notes,
    };
  }
  const rec = mockOrders.get(orderNumber);
  if (!rec) return null;
  return {
    orderNumber: rec.orderNumber,
    total: rec.total,
    paymentMethod: rec.paymentMethod,
    customer: rec.customer,
    notes: rec.notes ?? null,
  };
}

export async function saveSteadfastBooking(
  orderNumber: string,
  consignmentId: string,
  trackingCode: string
): Promise<boolean> {
  const db = getDb();
  if (db) {
    const res = await db.order.updateMany({
      where: { orderNumber },
      data: { steadfastConsignmentId: consignmentId, trackingCode },
    });
    return res.count > 0;
  }
  const rec = mockOrders.get(orderNumber);
  if (!rec) return false;
  rec.steadfastConsignmentId = consignmentId;
  rec.trackingCode = trackingCode;
  return true;
}
