import type { CollectionConfig } from "payload";

/**
 * Applications from shops wanting to stock Kivia Designs.
 *
 * Kept apart from general enquiries because the questions are different and the
 * qualification matters: a stockist is a repeat business relationship, so it is
 * worth knowing their monthly volume and what they already sell before replying.
 *
 * Written by visitors, read by staff, and the same honeypot guard as enquiries.
 */
export const StockistApplications: CollectionConfig = {
  slug: "stockist-applications",
  labels: {
    singular: "Stockist application",
    plural: "Stockist applications",
  },
  access: {
    create: () => true,
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  admin: {
    useAsTitle: "businessName",
    defaultColumns: ["businessName", "ownerName", "city", "monthlyPieces", "status", "createdAt"],
    group: "Enquiries & orders",
    description: "Shops that want to sell Kivia Designs in their area.",
    listSearchableFields: [
      "businessName",
      "ownerName",
      "phone",
      "email",
      "city",
      "brandsCarried",
    ],
  },
  fields: [
    {
      name: "businessName",
      type: "text",
      required: true,
    },
    {
      name: "ownerName",
      type: "text",
      required: true,
    },
    {
      name: "phone",
      type: "text",
      required: true,
    },
    { name: "email", type: "email" },
    {
      name: "city",
      type: "text",
      required: true,
      admin: { description: "Which city or area they would sell in." },
    },
    {
      name: "websiteOrInstagram",
      type: "text",
    },
    {
      name: "yearsTrading",
      type: "select",
      options: [
        { label: "Just starting", value: "new" },
        { label: "1 to 3 years", value: "1-3" },
        { label: "3 to 10 years", value: "3-10" },
        { label: "More than 10 years", value: "10+" },
      ],
    },
    {
      name: "monthlyPieces",
      type: "select",
      options: [
        { label: "Under 50", value: "under-50" },
        { label: "50 to 200", value: "50-200" },
        { label: "200 to 500", value: "200-500" },
        { label: "500 to 1000", value: "500-1000" },
        { label: "More than 1000", value: "1000+" },
      ],
    },
    {
      name: "brandsCarried",
      type: "textarea",
    },
    {
      name: "message",
      type: "textarea",
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "new",
      options: [
        { label: "New application", value: "new" },
        { label: "Contacted", value: "contacted" },
        { label: "Rate card sent", value: "quoted" },
        { label: "First order placed", value: "won" },
        { label: "Not this time", value: "lost" },
      ],
      access: {
        create: () => false,
        update: () => false,
      },
    },
    {
      name: "internalNotes",
      type: "textarea",
      admin: { description: "Only you see this." },
      access: {
        create: () => false,
        update: () => false,
      },
    },
    {
      name: "website",
      type: "text",
      admin: { hidden: true },
      access: {
        read: () => false,
        update: () => false,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation !== "create" || !data) return data;
        if (typeof data.website === "string" && data.website.length > 0) {
          return { ...data, website: undefined, businessName: "Discarded (spam)" };
        }
        return data;
      },
    ],
  },
};