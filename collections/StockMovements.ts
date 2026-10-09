import type { CollectionConfig } from "payload";

/**
 * Every movement of stock, in and out.
 *
 * Stock is not a number that gets overwritten. It is the running total of every
 * movement ever recorded, which means the figure can always be explained: if the
 * on-hand for a style is wrong, you can find the movement that caused it.
 *
 * Quantities are whole pieces and are signed — positive means stock came in,
 * negative means it went out. That removes a whole class of bug where a
 * separate "type" field disagrees with a negative number.
 *
 * Tracked per size, because a kurti factory cannot use a size XL where the
 * buyer ordered a size L.
 */
export const StockMovements: CollectionConfig = {
  slug: "stock-movements",
  labels: {
    singular: "Stock movement",
    plural: "Stock movements",
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  admin: {
    useAsTitle: "kind",
    defaultColumns: ["occurredOn", "product", "size", "quantityChange", "kind", "order"],
    group: "Stock",
    description:
      "Every piece that came in or went out. Stock on hand is the sum of these — nothing is overwritten.",
    listSearchableFields: ["reference", "notes", "kind"],
  },
  fields: [
    {
      name: "occurredOn",
      type: "date",
      required: true,
      index: true,
      defaultValue: () => new Date().toISOString(),
      admin: { description: "When it actually happened, not when it was typed in." },
    },
    {
      name: "product",
      type: "relationship",
      relationTo: "products",
      index: true,
      admin: { description: "Which style. Leave blank for loose fabric and trims." },
    },
    {
      name: "itemName",
      type: "text",
      admin: {
        description:
          "Use this for anything that is not a catalogue style, such as 'Cotton fabric — cream'.",
      },
    },
    {
      name: "size",
      type: "select",
      index: true,
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
        "Not size specific",
      ],
      admin: { description: "Which size this movement applies to." },
    },
    {
      name: "quantityChange",
      type: "number",
      required: true,
      admin: {
        description:
          "Positive number for stock coming in, negative for stock going out. For example 40 to add, -12 to remove.",
      },
    },
    {
      name: "kind",
      type: "select",
      required: true,
      defaultValue: "adjustment",
      index: true,
      options: [
        { label: "Bought in from supplier", value: "purchase" },
        { label: "Finished in-house", value: "production" },
        { label: "Sent to a buyer", value: "sale" },
        { label: "Returned by buyer", value: "return-in" },
        { label: "Returned to supplier", value: "return-out" },
        { label: "Stock count correction", value: "adjustment" },
        { label: "Spoiled or rejected", value: "wastage" },
      ],
    },
    {
      name: "order",
      type: "relationship",
      relationTo: "orders",
      admin: { description: "Which order caused it, if it was an order." },
    },
    {
      name: "reference",
      type: "text",
      admin: { description: "Invoice number, bill number or receipt number, so it can be traced." },
    },
    {
      name: "notes",
      type: "textarea",
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data) return data;
        // Integer pieces only. A fractional garment is always a typo.
        const qty = Math.round(Number(data.quantityChange) || 0);
        return { ...data, quantityChange: qty };
      },
    ],
  },
};