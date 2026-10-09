import type { CollectionConfig } from "payload";

/**
 * Money received from buyers.
 *
 * Kept as its own collection rather than a field on the order so there is a
 * record of every transaction: who paid, when, how much, and by which method.
 * That is what makes the outstanding figure trustworthy, and it is the thing
 * that has to exist before a payment can be said to have landed.
 *
 * Payments can be recorded against an order, or against the buyer alone for an
 * advance that predates the order.
 *
 * Amounts are whole paise. See src/lib/money.ts.
 */
export const Payments: CollectionConfig = {
  slug: "payments",
  labels: {
    singular: "Payment",
    plural: "Payments",
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  admin: {
    useAsTitle: "reference",
    defaultColumns: ["paidOn", "buyer", "order", "amountPaise", "method"],
    group: "Enquiries & orders",
    description: "Every payment received, so the outstanding figure is trustworthy.",
    listSearchableFields: ["reference", "notes"],
  },
  fields: [
    {
      name: "paidOn",
      type: "date",
      required: true,
      index: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        date: {
          pickerAppearance: "dayOnly",
        },
        description: "The date the money actually arrived, which is not always today.",
      },
    },
    {
      name: "buyer",
      type: "relationship",
      relationTo: "buyers",
      required: true,
      index: true,
    },
    {
      name: "order",
      type: "relationship",
      relationTo: "orders",
      admin: {
        description: "Leave blank for an advance received before the order was placed.",
      },
    },
    {
      name: "amountPaise",
      type: "number",
      required: true,
      admin: { description: "How much was received, in rupees. Stored as paise." },
    },
    {
      name: "method",
      type: "select",
      required: true,
      defaultValue: "upi",
      options: [
        { label: "UPI", value: "upi" },
        { label: "Bank transfer / NEFT", value: "bank" },
        { label: "Cheque", value: "cheque" },
        { label: "Cash", value: "cash" },
        { label: "Card", value: "card" },
        { label: "Adjusting note or credit", value: "credit-note" },
      ],
    },
    {
      name: "reference",
      type: "text",
      admin: {
        description:
          "UTR, cheque number or transaction id. Without this you cannot trace the money later.",
      },
    },
    {
      name: "notes",
      type: "textarea",
      admin: { description: "Anything unusual about this payment." },
    },
  ],
};