/**
 * Reads the operations data and turns it into the numbers people actually ask
 * for: who owes what, what is overdue, and how much stock is really left.
 *
 * All of this is derived on read rather than stored. A stored running total is
 * one more thing that can go stale, and stock counts that disagree with the
 * movements that produced them are worse than no stock count at all.
 */

import { cache } from "react";
import { getPayload } from "payload";
import config from "@payload-config";

import { sumPaise } from "@/lib/money";

/*
 * Server-side by construction: this reads the database through Payload, which
 * cannot run in a browser bundle. The `server-only` guard is deliberately not
 * used here because it throws when imported from a plain Node script, which is
 * how the arithmetic in tools/test-operations.ts is exercised.
 */

export type OrderView = {
  id: number;
  orderNumber: string;
  buyerId: number;
  buyerName: string;
  buyerCity: string;
  status: string;
  statusLabel: string;
  totalPaise: number;
  paidPaise: number;
  balancePaise: number;
  placedOn: string | null;
  promisedBy: string | null;
  dispatchedOn: string | null;
  pieceCount: number;
  lineCount: number;
  isOverdue: boolean;
  daysUntilDue: number | null;
};

export type BuyerView = {
  id: number;
  businessName: string;
  contactName: string;
  phone: string;
  city: string;
  type: string;
  status: string;
  paymentTerms: string;
  creditLimitPaise: number;
  outstandingPaise: number;
  orderCount: number;
  overCreditLimit: boolean;
};

export type StockLevel = {
  key: string;
  productId: number | null;
  label: string;
  size: string;
  onHand: number;
  incoming: number;
  alert: "none" | "low" | "out";
};

export type ProductionJob = {
  id: number;
  orderNumber: string;
  orderId: number;
  stage: string;
  stageLabel: string;
  assignedTo: string | null;
  piecesDone: number;
  piecesTarget: number;
  status: string;
  dueDate: string | null;
  isLate: boolean;
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  enquiry: "Enquiry",
  quoted: "Quoted",
  confirmed: "Confirmed",
  production: "In production",
  qc: "Quality check",
  packed: "Packed",
  dispatched: "Dispatched",
  delivered: "Delivered",
  paid: "Paid",
  cancelled: "Cancelled",
};

const STAGE_LABELS: Record<string, string> = {
  cutting: "Cutting",
  stitching: "Stitching",
  embroidery: "Embroidery",
  finishing: "Finishing",
  qc: "Quality check",
  packing: "Packing",
};

/** Orders that are finished with but not yet settled. */
const OPEN_STATUSES = ["enquiry", "quoted", "confirmed", "production", "qc", "packed", "dispatched", "delivered"];

const getDB = cache(async () => getPayload({ config }));

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Every order with its payment position worked out.
 *
 * The balance comes from summing the payments that point at each order, not from
 * the stored balancePaise, so a stale stored figure cannot mislead anyone.
 */
export const getOrderViews = cache(async (): Promise<OrderView[]> => {
  const payload = await getDB();

  const [ordersRes, paymentsRes, buyersRes] = await Promise.all([
    payload.find({
      collection: "orders",
      limit: 500,
      depth: 1,
      sort: "-createdAt",
    }),
    payload.find({ collection: "payments", limit: 1000, depth: 0 }),
    payload.find({ collection: "buyers", limit: 500, depth: 0 }),
  ]);

  const buyerName = new Map<number, string>();
  for (const b of buyersRes.docs) buyerName.set(b.id, b.businessName);

  const paidByOrder = new Map<number, number>();
  for (const p of paymentsRes.docs) {
    if (p.order == null) continue;
    const orderId = typeof p.order === "object" && p.order ? p.order.id : Number(p.order);
    if (!Number.isFinite(orderId)) continue;
    paidByOrder.set(orderId, (paidByOrder.get(orderId) ?? 0) + (p.amountPaise ?? 0));
  }

  const today = startOfToday();

  return ordersRes.docs.map((o) => {
    const lines = o.lines ?? [];
    const pieceCount = lines.reduce(
      (total, line) =>
        total + (line.sizes ?? []).reduce((t, s) => t + (s.quantity ?? 0), 0),
      0,
    );

    const paid = paidByOrder.get(o.id) ?? 0;
    const total = o.totalPaise ?? 0;
    const balance = Math.max(0, total - paid);

    const promised = o.promisedBy ? new Date(o.promisedBy) : null;
    const settled = o.status === "paid" || o.status === "cancelled";

    const daysUntilDue = promised ? daysBetween(today, promised) : null;
    const isOverdue = !settled && promised !== null && promised.getTime() < today.getTime();

    const buyerId =
      typeof o.buyer === "object" && o.buyer ? o.buyer.id : Number(o.buyer ?? 0);

    return {
      id: o.id,
      orderNumber: o.orderNumber ?? `#${o.id}`,
      buyerId,
      buyerName: buyerName.get(buyerId) ?? "Unknown buyer",
      buyerCity: "",
      status: o.status ?? "enquiry",
      statusLabel: ORDER_STATUS_LABELS[o.status ?? "enquiry"] ?? o.status ?? "Enquiry",
      totalPaise: total,
      paidPaise: paid,
      balancePaise: balance,
      placedOn: o.placedOn ?? null,
      promisedBy: o.promisedBy ?? null,
      dispatchedOn: o.dispatchedOn ?? null,
      pieceCount,
      lineCount: lines.length,
      isOverdue,
      daysUntilDue,
    };
  });
});

/** Buyers with their total outstanding and credit position. */
export const getBuyerViews = cache(async (): Promise<BuyerView[]> => {
  const payload = await getDB();

  const [buyersRes, ordersRes, paymentsRes] = await Promise.all([
    payload.find({ collection: "buyers", limit: 500, depth: 0, sort: "businessName" }),
    payload.find({ collection: "orders", limit: 500, depth: 0 }),
    payload.find({ collection: "payments", limit: 1000, depth: 0 }),
  ]);

  // Payments not attached to an order are still money owed against that buyer.
  const paidByBuyer = new Map<number, number>();
  const paidWithOrder = new Map<number, number>();

  const orderBuyer = new Map<number, number>();
  const orderTotal = new Map<number, number>();
  for (const o of ordersRes.docs) {
    const buyerId = typeof o.buyer === "object" && o.buyer ? o.buyer.id : Number(o.buyer ?? 0);
    orderBuyer.set(o.id, buyerId);
    orderTotal.set(o.id, o.totalPaise ?? 0);
  }

  for (const p of paymentsRes.docs) {
    const buyerId = typeof p.buyer === "object" && p.buyer ? p.buyer.id : Number(p.buyer ?? 0);
    const amount = p.amountPaise ?? 0;
    paidByBuyer.set(buyerId, (paidByBuyer.get(buyerId) ?? 0) + amount);

    const orderId = typeof p.order === "object" && p.order ? p.order.id : Number(p.order ?? NaN);
    if (Number.isFinite(orderId)) {
      paidWithOrder.set(orderId, (paidWithOrder.get(orderId) ?? 0) + amount);
    }
  }

  const openByBuyer = new Map<number, number>();
  const countByBuyer = new Map<number, number>();
  for (const o of ordersRes.docs) {
    const buyerId = typeof o.buyer === "object" && o.buyer ? o.buyer.id : Number(o.buyer ?? 0);
    countByBuyer.set(buyerId, (countByBuyer.get(buyerId) ?? 0) + 1);
    if (o.status === "cancelled" || o.status === "paid") continue;

    const total = orderTotal.get(o.id) ?? 0;
    const paid = paidWithOrder.get(o.id) ?? 0;
    openByBuyer.set(buyerId, (openByBuyer.get(buyerId) ?? 0) + Math.max(0, total - paid));
  }

  // Advances that are not tied to an order reduce the outstanding balance.
  const unassignedByBuyer = new Map<number, number>();
  for (const p of paymentsRes.docs) {
    const hasOrder =
      p.order != null &&
      (typeof p.order === "object" ? !!p.order : Number.isFinite(Number(p.order)));
    if (hasOrder) continue;
    const buyerId = typeof p.buyer === "object" && p.buyer ? p.buyer.id : Number(p.buyer ?? 0);
    unassignedByBuyer.set(buyerId, (unassignedByBuyer.get(buyerId) ?? 0) + (p.amountPaise ?? 0));
  }

  return buyersRes.docs.map((b) => {
    const open = openByBuyer.get(b.id) ?? 0;
    const unassigned = unassignedByBuyer.get(b.id) ?? 0;
    const outstanding = Math.max(0, open - unassigned);
    const limit = b.creditLimitPaise ?? 0;

    return {
      id: b.id,
      businessName: b.businessName,
      contactName: b.contactName ?? "",
      phone: b.phone ?? "",
      city: b.city ?? "",
      type: b.type ?? "wholesale",
      status: b.status ?? "active",
      paymentTerms: b.paymentTerms ?? "advance",
      creditLimitPaise: limit,
      outstandingPaise: outstanding,
      orderCount: countByBuyer.get(b.id) ?? 0,
      overCreditLimit: limit > 0 && outstanding > limit,
    };
  });
});

/**
 * Stock on hand per style and size, from the sum of every movement.
 *
 * A low-stock threshold of 10 pieces is deliberately a constant rather than a
 * field: it is a judgement about how much warning is enough, not something that
 * changes style to style, and one fewer field to fill in for every style.
 */
export const getStockLevels = cache(async (lowThreshold = 10): Promise<StockLevel[]> => {
  const payload = await getDB();

  const [movementsRes, productsRes, ordersRes] = await Promise.all([
    payload.find({ collection: "stock-movements", limit: 5000, depth: 1 }),
    payload.find({ collection: "products", limit: 500, depth: 0 }),
    payload.find({ collection: "orders", limit: 500, depth: 0 }),
  ]);

  const productName = new Map<number, string>();
  for (const p of productsRes.docs) productName.set(p.id, p.name || p.category);

  // Confirmed orders that have not been dispatched are stock already promised.
  const promised = new Map<string, number>();
  for (const o of ordersRes.docs) {
    if (o.status === "dispatched" || o.status === "delivered" || o.status === "cancelled") continue;
    for (const line of o.lines ?? []) {
      const productId =
        typeof line.product === "object" && line.product ? line.product.id : Number(line.product ?? 0);
      if (!productId) continue;
      for (const size of line.sizes ?? []) {
        const key = `${productId}::${size.size}`;
        promised.set(key, (promised.get(key) ?? 0) + (size.quantity ?? 0));
      }
    }
  }

  const levels = new Map<string, StockLevel>();

  for (const m of movementsRes.docs) {
    const productId =
      typeof m.product === "object" && m.product ? m.product.id : Number(m.product ?? 0);
    const size = m.size ?? "Not size specific";
    const key = productId ? `${productId}::${size}` : `loose::${size}::${m.itemName ?? ""}`;

    const existing = levels.get(key) ?? {
      key,
      productId: productId || null,
      label: productId ? (productName.get(productId) ?? `Style #${productId}`) : (m.itemName ?? "Unnamed item"),
      size,
      onHand: 0,
      incoming: 0,
      alert: "none" as StockLevel["alert"],
    };

    existing.onHand += m.quantityChange ?? 0;
    levels.set(key, existing);
  }

  const result = [...levels.values()];

  for (const [key, qty] of promised) {
    const level = result.find((l) => l.key === key);
    if (level) level.incoming += qty;
  }

  for (const level of result) {
    if (level.onHand <= 0) level.alert = "out";
    else if (level.onHand < lowThreshold) level.alert = "low";
    else level.alert = "none";
  }

  return result.sort((a, b) => {
    const rank = { out: 0, low: 1, none: 2 } as const;
    if (rank[a.alert] !== rank[b.alert]) return rank[a.alert] - rank[b.alert];
    return a.onHand - b.onHand;
  });
});

/** Factory-floor view: what is being worked on, and what is late. */
export const getProductionJobs = cache(async (): Promise<ProductionJob[]> => {
  const payload = await getDB();

  const [tasksRes, ordersRes] = await Promise.all([
    payload.find({ collection: "production-tasks", limit: 1000, depth: 1, sort: "dueDate" }),
    payload.find({ collection: "orders", limit: 500, depth: 0 }),
  ]);

  const orderNumber = new Map<number, string>();
  for (const o of ordersRes.docs) orderNumber.set(o.id, o.orderNumber ?? `#${o.id}`);

  const today = startOfToday();

  return tasksRes.docs.map((t) => {
    const orderId = typeof t.order === "object" && t.order ? t.order.id : Number(t.order ?? 0);
    const assigned = t.assignedTo && typeof t.assignedTo === "object" ? t.assignedTo : null;
    const due = t.dueDate ? new Date(t.dueDate) : null;

    return {
      id: t.id,
      orderNumber: orderNumber.get(orderId) ?? `#${orderId}`,
      orderId,
      stage: t.stage ?? "cutting",
      stageLabel: STAGE_LABELS[t.stage ?? "cutting"] ?? t.stage ?? "Cutting",
      assignedTo: assigned ? (assigned.name as string) : null,
      piecesDone: t.piecesDone ?? 0,
      piecesTarget: t.piecesTarget ?? 0,
      status: t.status ?? "pending",
      dueDate: t.dueDate ?? null,
      isLate: t.status !== "done" && due !== null && due.getTime() < today.getTime(),
    };
  });
});

/** The handful of figures worth seeing on one screen. */
export const getOpsSummary = cache(async () => {
  const [orders, buyers, stock, jobs] = await Promise.all([
    getOrderViews(),
    getBuyerViews(),
    getStockLevels(),
    getProductionJobs(),
  ]);

  const live = orders.filter((o) => OPEN_STATUSES.includes(o.status));

  return {
    liveOrderCount: live.length,
    outstandingPaise: sumPaise(buyers.map((b) => b.outstandingPaise)),
    overdueCount: live.filter((o) => o.isOverdue).length,
    overdueValuePaise: sumPaise(live.filter((o) => o.isOverdue).map((o) => o.balancePaise)),
    buyerCount: buyers.filter((b) => b.status === "active").length,
    outOfStock: stock.filter((s) => s.alert === "out").length,
    lowStock: stock.filter((s) => s.alert === "low").length,
    jobsInProgress: jobs.filter((j) => j.status === "in-progress").length,
    jobsBlocked: jobs.filter((j) => j.status === "blocked").length,
    jobsLate: jobs.filter((j) => j.isLate).length,
  };
});

export { ORDER_STATUS_LABELS, STAGE_LABELS, OPEN_STATUSES };