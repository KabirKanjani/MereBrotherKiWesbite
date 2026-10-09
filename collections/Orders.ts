import type { CollectionConfig } from "payload";

/**
 * Wholesale orders.
 *
 * Replaces the notebook where an order, its sizes and its agreed rate were
 * written down. The shape is deliberately close to how a garment order is
 * actually talked about: a buyer, a set of styles, and for each style a
 * size-wise breakdown, because "30 kurtis" is useless to a factory floor and
 * "10 L, 12 XL, 8 2XL" is a cutting instruction.
 *
 * A line can point at a catalogue style, or carry only a description, because a
 * lot of wholesale work is a design that has not been photographed or named yet.
 *
 * All money fields are whole paise. See src/lib/money.ts.
 *
 * `status` is the pipeline the shop actually thinks in, ordered from first
 * contact to paid. Progress is visible by filtering on it rather than by
 * maintaining a second "is it late" field that can disagree with the status.
 */
export const Orders: CollectionConfig = {
  slug: "orders",
  labels: {
    singular: "Order",
    plural: "Orders",
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  admin: {
    useAsTitle: "orderNumber",
    defaultColumns: [
      "orderNumber",
      "buyer",
      "status",
      "totalPaise",
      "balancePaise",
      "promisedBy",
    ],
    group: "Enquiries & orders",
    description: "Every bulk order, from first quote to paid.",
    listSearchableFields: ["orderNumber", "buyerNote", "poNumber", "lines.description"],
  },
  fields: [
    {
      name: "orderNumber",
      type: "text",
      unique: true,
      index: true,
      admin: {
        description:
          "Your reference for this order, e.g. KD-2026-014. Filled in automatically if you leave it blank.",
        position: "sidebar",
      },
      hooks: {
        beforeValidate: [
          async ({ value, req, operation }) => {
            if (value) return value;
            if (operation !== "create") return value;

            const existing = await req.payload.count({ collection: "orders" });
            const year = new Date().getFullYear();
            return `KD-${year}-${String(existing.totalDocs + 1).padStart(3, "0")}`;
          },
        ],
      },
    },
    {
      name: "buyer",
      type: "relationship",
      relationTo: "buyers",
      required: true,
      index: true,
      admin: { description: "Who placed it." },
    },
    {
      name: "poNumber",
      type: "text",
      admin: { description: "Their purchase order number, if they use one." },
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "enquiry",
      index: true,
      options: [
        { label: "1. Enquiry — asked us to quote", value: "enquiry" },
        { label: "2. Quoted — rate card sent", value: "quoted" },
        { label: "3. Confirmed — order accepted", value: "confirmed" },
        { label: "4. In production", value: "production" },
        { label: "5. Quality check", value: "qc" },
        { label: "6. Packed", value: "packed" },
        { label: "7. Dispatched", value: "dispatched" },
        { label: "8. Delivered", value: "delivered" },
        { label: "9. Paid in full", value: "paid" },
        { label: "Cancelled", value: "cancelled" },
      ],
      admin: {
        description: "Where this order has got to. The shop's own order book used this.",
      },
    },
    {
      name: "lines",
      type: "array",
      minRows: 1,
      admin: {
        description: "What they ordered. Give the size breakdown so the floor can cut it.",
      },
      fields: [
        {
          name: "product",
          type: "relationship",
          relationTo: "products",
          admin: { description: "Leave blank for a design we have not photographed." },
        },
        {
          name: "description",
          type: "text",
          required: true,
          admin: { description: "What to call this line in the cutting room." },
        },
        {
          name: "fabric",
          type: "text",
          admin: { description: "Fabric, if agreed." },
        },
        {
          name: "sizes",
          type: "array",
          label: "Sizes",
          admin: {
            description: "How many of each size. This is what the factory works from.",
          },
          fields: [
            {
              name: "size",
              type: "select",
              required: true,
              options: [
                "Free Size",
                "XS",
                "S",
                "M",
                "L",
                "XL",
                "XXL",
                "2XL",
                "3XL",
                "4XL",
                "5XL",
              ],
            },
            {
              name: "quantity",
              type: "number",
              required: true,
              min: 0,
              admin: { description: "Pieces of this size." },
            },
          ],
        },
        {
          name: "ratePerPiecePaise",
          type: "number",
          required: true,
          admin: {
            description: "The agreed rate for one piece, in rupees. Stored as paise.",
          },
        },
        {
          name: "lineTotalPaise",
          type: "number",
          access: { create: () => false, update: () => false },
          admin: {
            readOnly: true,
            description: "Calculated. Pieces across all sizes times the rate.",
          },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "subtotalPaise",
          type: "number",
          // Denied at field level rather than made read-only in the form, so a
          // hand-crafted API request cannot post a total that contradicts the
          // lines.
          access: { create: () => false, update: () => false },
          admin: { readOnly: true, description: "Sum of all lines. Calculated." },
        },
        {
          name: "discountPercent",
          type: "number",
          min: 0,
          max: 100,
          defaultValue: 0,
          admin: { description: "Discount on the whole order, as a percentage." },
        },
      ],
    },
    {
      name: "shippingPaise",
      type: "number",
      defaultValue: 0,
      admin: { description: "Freight or courier charge, in rupees." },
    },
    {
      name: "totalPaise",
      type: "number",
      access: { create: () => false, update: () => false },
      admin: { readOnly: true, description: "What they owe in total. Calculated." },
    },
    {
      name: "balancePaise",
      type: "number",
      access: { create: () => false, update: () => false },
      admin: {
        readOnly: true,
        description:
          "Total minus everything received. This is the figure that matters when chasing payment.",
      },
    },
    {
      type: "row",
      fields: [
        { name: "placedOn", type: "date", admin: { description: "When they confirmed." } },
        {
          name: "promisedBy",
          type: "date",
          index: true,
          admin: { description: "When you said it would be ready. Used to spot slippage." },
        },
      ],
    },
    { name: "dispatchedOn", type: "date" },
    {
      name: "buyerNote",
      type: "textarea",
      admin: { description: "Anything the buyer asked for. Read by whoever packs the order." },
    },
    {
      name: "internalNotes",
      type: "textarea",
      admin: { description: "Your own notes. Never shown to the buyer." },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        if (!data) return data;
        return computeOrderTotals(data, originalDoc);
      },
    ],
    beforeValidate: [
      ({ data }) => {
        if (!data) return data;
        return computeOrderTotals(data, null);
      },
    ],
  },
};

/**
 * Fills in the calculated money fields.
 *
 * Runs on both validate and change because the admin form needs the totals
 * visible while typing, and the stored document must not be trusted to have
 * them. Recomputing here means the figures cannot drift from the lines.
 */
function computeOrderTotals<
  T extends {
    lines?: { sizes?: { quantity?: number | null }[] | null; ratePerPiecePaise?: number | null }[] | null;
    discountPercent?: number | null;
    shippingPaise?: number | null;
    [key: string]: unknown;
  },
>(data: T, originalDoc: unknown): T {
  const lines = data.lines ?? [];

  const withLineTotals = lines.map((line) => {
    const pieces = (line.sizes ?? []).reduce<number>(
      (total, size) => total + (Number(size.quantity) || 0),
      0,
    );
    const rate = Number(line.ratePerPiecePaise) || 0;
    return { ...line, lineTotalPaise: Math.round(pieces * rate) };
  });

  const subtotal = withLineTotals.reduce<number>(
    (total, line) => total + (line.lineTotalPaise ?? 0),
    0,
  );

  const discountPercent = Number(data.discountPercent) || 0;
  const discount = Math.round((subtotal * discountPercent) / 100);
  const shipping = Math.max(0, Math.round(Number(data.shippingPaise) || 0));

  const total = Math.max(0, subtotal - discount) + shipping;

  /*
   * What has already been received, worked out from the document as it stands
   * before this save: its total minus its balance is what was paid.
   *
   * On a brand new order there is no previous document, so nothing has been paid
   * and the balance is the full total. Reading a missing balance as zero and
   * subtracting it here would instead report the order as already settled, which
   * is the opposite of what a fresh order is.
   */
  const original = originalDoc as { totalPaise?: number; balancePaise?: number } | null;
  const originalTotal = Number(original?.totalPaise ?? 0);
  const originalBalance = Number(original?.balancePaise ?? 0);
  const previouslyPaid = originalTotal > 0 ? originalTotal - originalBalance : 0;

  const balance = Math.max(0, total - previouslyPaid);

  return {
    ...data,
    lines: withLineTotals,
    subtotalPaise: subtotal,
    totalPaise: total,
    balancePaise: balance,
  } as T;
}