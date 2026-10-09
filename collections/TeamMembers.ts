import type { CollectionConfig } from "payload";

/**
 * Who works on the work: designers, cutters, machinists, finishers.
 *
 * Separate from staff accounts on purpose. Most of your floor should not need a
 * login, a password or an email address — that only creates accounts to leak
 * and passwords to forget. A person is a record here; only the office staff who
 * need the system get one.
 *
 * If someone does need to log in, create them an account and put their name
 * here too, so an assignment points at a person rather than an account.
 */
export const TeamMembers: CollectionConfig = {
  slug: "team",
  labels: {
    singular: "Person",
    plural: "People",
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "role", "phone", "active"],
    group: "Stock & factory",
    description:
      "Designers, cutters, machinists and finishers. Add a person here before assigning work to them.",
    listSearchableFields: ["name", "role", "phone"],
  },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "machinist",
      options: [
        { label: "Designer", value: "designer" },
        { label: "Pattern cutter", value: "cutter" },
        { label: "Embroidery / surface work", value: "embroidery" },
        { label: "Machinist", value: "machinist" },
        { label: "Finisher / ironing", value: "finisher" },
        { label: "Quality check", value: "qc" },
        { label: "Packing", value: "packing" },
        { label: "Office", value: "office" },
      ],
    },
    {
      name: "phone",
      type: "text",
      admin: { description: "Useful on the factory floor when a stage is stuck." },
    },
    {
      name: "ratePerPiecePaise",
      type: "number",
      admin: {
        description:
          "What you pay them per piece, in rupees, if you pay by the piece. Helps cost an order.",
      },
    },
    {
      name: "active",
      type: "checkbox",
      defaultValue: true,
      admin: { position: "sidebar", description: "Untick when someone leaves." },
    },
    { name: "notes", type: "textarea" },
  ],
};