import type { CollectionConfig } from "payload";

/**
 * Wholesale buyers — the shops and traders who order in bulk.
 *
 * A buyer record exists so you stop having to remember, in a notebook or a
 * chat history, who Ramesh of Surat Fashions actually is and how much he owes.
 * It holds the commercial terms rather than any personal detail beyond a name
 * and a phone number, because that is all a supplier relationship needs.
 *
 * Credit limit and outstanding balance are stored in paise. See src/lib/money.ts
 * for why floats are never used.
 */
export const Buyers: CollectionConfig = {
  slug: "buyers",
  labels: {
    singular: "Buyer",
    plural: "Buyers",
  },
  access: {
    // Staff only. Nothing here is ever public: it is commercial information.
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  admin: {
    useAsTitle: "businessName",
    defaultColumns: ["businessName", "contactName", "city", "type", "status", "updatedAt"],
    group: "Orders",
    description: "Shops and traders you sell to in bulk. One record per customer.",
    listSearchableFields: ["businessName", "contactName", "phone", "city", "gstin"],
  },
  fields: [
    {
      name: "businessName",
      type: "text",
      required: true,
      admin: { description: "The shop or firm name." },
    },
    {
      name: "contactName",
      type: "text",
      admin: { description: "Who you speak to there." },
    },
    { name: "phone", type: "text", admin: { description: "Digits only, so it is callable." } },
    { name: "email", type: "email" },
    { name: "city", type: "text" },
    {
      name: "gstin",
      type: "text",
      admin: {
        description:
          "Their GST number, needed on a tax invoice. Ask for it before the first order.",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "type",
          type: "select",
          required: true,
          defaultValue: "wholesale",
          options: [
            { label: "Wholesale buyer", value: "wholesale" },
            { label: "Stockist", value: "stockist" },
            { label: "Retailer", value: "retailer" },
            { label: "Online reseller", value: "online" },
          ],
          admin: { description: "What kind of customer they are." },
        },
        {
          name: "status",
          type: "select",
          required: true,
          defaultValue: "active",
          options: [
            { label: "Active", value: "active" },
            { label: "On hold", value: "on-hold" },
            { label: "No longer buying", value: "inactive" },
          ],
        },
      ],
    },
    {
      name: "paymentTerms",
      type: "select",
      defaultValue: "advance",
      options: [
        { label: "Full advance before production", value: "advance" },
        { label: "50% advance, rest on dispatch", value: "half" },
        { label: "Payment on delivery", value: "delivery" },
        { label: "Credit — 30 days", value: "credit-30" },
        { label: "Credit — 60 days", value: "credit-60" },
      ],
      admin: { description: "How this buyer normally pays." },
    },
    {
      name: "creditLimitPaise",
      type: "number",
      defaultValue: 0,
      admin: {
        description:
          "The most you are willing to have outstanding with them, in rupees. 0 means no credit allowed.",
      },
    },
    {
      name: "address",
      type: "textarea",
      admin: { description: "Where to deliver. Used for packing slips." },
    },
    {
      name: "notes",
      type: "textarea",
      admin: {
        description: "Anything worth remembering: their preferences, who to call, past issues.",
      },
    },
  ],
};