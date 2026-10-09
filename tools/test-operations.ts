/**
 * Exercises the operations arithmetic against real records.
 *
 * Builds a buyer, an order with a size-wise breakdown, and payments, then
 * checks the derived figures. Everything created here is removed afterwards, so
 * running this leaves the database as it found it.
 *
 * This is the test that matters most in the whole app. If the balance maths is
 * wrong, the shop chases a customer for money they have already paid.
 *
 * Run with: node --import tsx tools/test-operations.ts
 */

import { getPayload } from "payload";
import config from "../payload.config";
import { formatPaise, sumPaise, toPaise } from "../src/lib/money";
import { getBuyerViews, getOrderViews, getStockLevels } from "../src/lib/operations";

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(
    `  [${ok ? "PASS" : "FAIL"}] ${label}${ok ? "" : ` — got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`}`,
  );
}

const payload = await getPayload({ config });

let buyerId: number | string | undefined;
let orderId: number | string | undefined;
const paymentIds: (number | string)[] = [];
const movementIds: (number | string)[] = [];

try {
  console.log("Building test data...\n");

  const buyer = await payload.create({
    collection: "buyers",
    draft: false,
    data: {
      businessName: "ZZ Test Buyer Ltd",
      contactName: "Test Contact",
      phone: "9000000000",
      city: "Surat",
      type: "wholesale",
      status: "active",
      paymentTerms: "half",
      creditLimitPaise: toPaise(50000),
    },
  });
  buyerId = buyer.id;

  const order = await payload.create({
    collection: "orders",
    data: {
      orderNumber: "ZZ-TEST-001",
      buyer: buyer.id,
      status: "confirmed",
      placedOn: new Date().toISOString(),
      promisedBy: new Date(Date.now() + 7 * 86400000).toISOString(),
      shippingPaise: toPaise(250),
      discountPercent: 0,
      lines: [
        {
          description: "Cotton kurti",
          fabric: "Pure Cotton",
          sizes: [
            { size: "M", quantity: 10 },
            { size: "L", quantity: 20 },
            { size: "XL", quantity: 10 },
          ],
          ratePerPiecePaise: toPaise(450),
        },
        {
          description: "Co-ord set",
          sizes: [{ size: "L", quantity: 5 }],
          ratePerPiecePaise: toPaise(800),
        },
      ],
    },
  });
  orderId = order.id;

  console.log("Order arithmetic:");
  // Line 1: 40 pieces x 450 = 18,000.  Line 2: 5 x 800 = 4,000.
  check("line 1 total", order.lines?.[0]?.lineTotalPaise, toPaise(18000));
  check("line 2 total", order.lines?.[1]?.lineTotalPaise, toPaise(4000));
  check("subtotal", order.subtotalPaise, toPaise(22000));
  check("shipping added", order.totalPaise, toPaise(22250));
  check("nothing paid yet, so balance equals total", order.balancePaise, toPaise(22250));

  // --- partial payment ---
  const p1 = await payload.create({
    collection: "payments",
    data: {
      buyer: buyer.id,
      order: order.id,
      amountPaise: toPaise(10000),
      paidOn: new Date().toISOString(),
      method: "upi",
      reference: "UTR-TEST-1",
    },
  });
  paymentIds.push(p1.id);

  let views = await getOrderViews();
  let view = views.find((o) => o.id === order.id);
  check("after 10,000 advance, balance is 12,250", view?.balancePaise, toPaise(12250));
  check("paid amount tracked", view?.paidPaise, toPaise(10000));
  check("piece count summed across sizes and lines", view?.pieceCount, 45);

  // --- discount ---
  await payload.update({
    collection: "orders",
    id: order.id,
    data: { discountPercent: 10 },
  });
  const reread = await payload.findByID({ collection: "orders", id: order.id, depth: 0 });
  // 22000 less 10% = 19800, plus 250 shipping = 20050
  check("10% discount applied to subtotal", reread.subtotalPaise, toPaise(22000));
  check("total after discount and shipping", reread.totalPaise, toPaise(20050));

  views = await getOrderViews();
  view = views.find((o) => o.id === order.id);
  // 20050 owed, 10000 received -> 10050 outstanding
  check("balance follows the discount", view?.balancePaise, toPaise(10050));

  // --- buyer outstanding ---
  const buyers = await getBuyerViews();
  const b = buyers.find((x) => x.id === buyer.id);
  check("buyer outstanding equals order balance", b?.outstandingPaise, toPaise(10050));
  check("buyer order count", b?.orderCount, 1);
  check("under credit limit", b?.overCreditLimit, false);

  // --- overpayment ---
  const p2 = await payload.create({
    collection: "payments",
    data: {
      buyer: buyer.id,
      order: order.id,
      amountPaise: toPaise(15000),
      paidOn: new Date().toISOString(),
      method: "bank",
    },
  });
  paymentIds.push(p2.id);

  views = await getOrderViews();
  view = views.find((o) => o.id === order.id);
  check("balance never goes negative on overpayment", view?.balancePaise, 0);

  // --- impossible discount ---
  // The field caps at 100%, so an over-large discount is refused outright rather
  // than silently clamped. A silently clamped figure would hide the typo that
  // caused it.
  let rejected = false;
  let badOrderId: number | string | undefined;
  try {
    const badOrder = await payload.create({
      collection: "orders",
      data: {
        orderNumber: "ZZ-TEST-002",
        buyer: buyer.id,
        status: "enquiry",
        discountPercent: 150,
        lines: [{ description: "Test", sizes: [{ size: "L", quantity: 10 }], ratePerPiecePaise: toPaise(100) }],
      },
    });
    badOrderId = badOrder.id;
  } catch {
    rejected = true;
  }
  check("a discount over 100% is rejected", rejected, true);
  if (badOrderId) await payload.delete({ collection: "orders", id: badOrderId });

  // --- stock ---
  console.log("\nStock arithmetic:");
  const m1 = await payload.create({
    collection: "stock-movements",
    data: {
      occurredOn: new Date().toISOString(),
      itemName: "ZZ Test Cotton",
      size: "L",
      quantityChange: 100,
      kind: "purchase",
      reference: "TEST-BILL",
    },
  });
  movementIds.push(m1.id);

  const m2 = await payload.create({
    collection: "stock-movements",
    data: {
      occurredOn: new Date().toISOString(),
      itemName: "ZZ Test Cotton",
      size: "L",
      quantityChange: -30,
      kind: "sale",
    },
  });
  movementIds.push(m2.id);

  const m3 = await payload.create({
    collection: "stock-movements",
    data: {
      occurredOn: new Date().toISOString(),
      itemName: "ZZ Test Cotton",
      size: "M",
      quantityChange: -5,
      kind: "sale",
    },
  });
  movementIds.push(m3.id);

  const stock = await getStockLevels();
  const l = stock.find((s) => s.label === "ZZ Test Cotton" && s.size === "L");
  const m = stock.find((s) => s.label === "ZZ Test Cotton" && s.size === "M");
  check("L: 100 in minus 30 out", l?.onHand, 70);
  check("M: 5 out leaves it negative, not clamped", m?.onHand, -5);
  check("negative stock flags as out of stock", m?.alert, "out");
  check("plenty in stock flags as none", l?.alert, "none");

  // --- rounding ---
  console.log("\nRounding:");
  const m4 = await payload.create({
    collection: "stock-movements",
    data: {
      occurredOn: new Date().toISOString(),
      itemName: "ZZ Test Cotton",
      size: "S",
      quantityChange: 10.6,
      kind: "purchase",
    },
  });
  movementIds.push(m4.id);
  const stock2 = await getStockLevels();
  const sRow = stock2.find((x) => x.label === "ZZ Test Cotton" && x.size === "S");
  check("fractional pieces round to whole", sRow?.onHand, 11);

  console.log("\nDisplay:");
  check("balance reads sensibly", formatPaise(toPaise(12250)), "₹12,250.00");
  check("empty sum is zero", sumPaise([]), 0);
} finally {
  console.log("\nCleaning up test records:");
  for (const id of paymentIds) await payload.delete({ collection: "payments", id });
  for (const id of movementIds) await payload.delete({ collection: "stock-movements", id });
  if (orderId) await payload.delete({ collection: "orders", id: orderId });
  if (buyerId) await payload.delete({ collection: "buyers", id: buyerId });
  console.log("  done");
}

console.log(failures === 0 ? "\nAll operations checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);