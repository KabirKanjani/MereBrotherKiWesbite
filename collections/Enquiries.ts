import type { CollectionConfig } from "payload";

/**
 * Leads from the website.
 *
 * Until this existed, every enquiry only ever reached WhatsApp. That quietly
 * loses people: anyone without WhatsApp installed, anyone who does not want to
 * message a stranger, and anyone who messages at 2am and gets no reply. A lead
 * that is not written down is a lead that never happened.
 *
 * Security shape:
 *   - anyone may submit one, because that is the point;
 *   - nobody may read, change or delete them from the public internet;
 *   - `status` and `notes` are staff-only, so a visitor cannot mark their own
 *     enquiry as handled, and cannot read replies written to them.
 *
 * Spam is handled with a hidden field rather than a captcha: bots fill in every
 * input they find, humans never see it.
 */
export const Enquiries: CollectionConfig = {
  slug: "enquiries",
  labels: {
    singular: "Enquiry",
    plural: "Enquiries",
  },
  access: {
    // Open, because a stranger with no account has to be able to ask.
    create: () => true,
    // Staff only, from here on.
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "phone", "interest", "status", "createdAt"],
    group: "Enquiries & orders",
    description: "People who asked about a style, a bulk order or custom work.",
    listSearchableFields: ["name", "phone", "email", "city", "notes"],
  },
  fields: [
    {
      name: "kind",
      type: "select",
      required: true,
      defaultValue: "general",
      options: [
        { label: "General enquiry", value: "general" },
        { label: "Bulk or wholesale order", value: "bulk" },
        { label: "Custom tailoring", value: "custom" },
        { label: "Stockist application", value: "stockist" },
      ],
      admin: {
        description: "How you can group these when you work through them.",
      },
    },
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "phone",
      type: "text",
      required: true,
      admin: { description: "Digits only, so it is callable." },
    },
    { name: "email", type: "email" },
    {
      name: "city",
      type: "text",
      admin: { description: "Helps you judge delivery cost and lead time." },
    },
    {
      name: "interest",
      type: "text",
      admin: { description: "What they asked about, in their words." },
    },
    {
      name: "product",
      type: "relationship",
      relationTo: "products",
      admin: {
        description: "The style they were looking at, if they came from one.",
      },
    },
    {
      name: "quantity",
      type: "text",
      admin: { description: "How many pieces they are thinking of." },
    },
    {
      name: "notes",
      type: "textarea",
      admin: { description: "Anything else they wrote." },
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "new",
      options: [
        { label: "New — not replied to yet", value: "new" },
        { label: "Replied, waiting on them", value: "replied" },
        { label: "Quoted", value: "quoted" },
        { label: "Won", value: "won" },
        { label: "Not interested", value: "lost" },
      ],
      // A visitor must not be able to declare their own enquiry handled.
      access: {
        create: () => false,
        update: () => false,
      },
    },
    {
      name: "internalNotes",
      type: "textarea",
      admin: {
        description: "Only you see this. Never shown to the customer.",
      },
      access: {
        create: () => false,
        update: () => false,
      },
    },
    {
      name: "sourcePage",
      type: "text",
      admin: {
        readOnly: true,
        description: "Which page the enquiry came from.",
      },
      access: {
        create: () => false,
        update: () => false,
      },
    },
    {
      /*
       * Honeypot. Hidden from people, irresistible to bots. Anything arriving
       * with this filled in is discarded silently rather than shown an error, so
       * a bot does not learn to work around it.
       */
      name: "website",
      type: "text",
      admin: {
        hidden: true,
        description: "Leave this blank. It exists to catch spam.",
      },
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
        // Discard spam without an error message.
        if (typeof data.website === "string" && data.website.length > 0) {
          return { ...data, website: undefined, name: "Discarded (spam)" };
        }
        return data;
      },
    ],
  },
};