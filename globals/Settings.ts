import type { GlobalConfig } from "payload";

/**
 * Shop-wide details, in one place.
 *
 * The store address lived as a "Replace with your shop name and street"
 * placeholder in code, which meant the one detail most likely to change was the
 * one hardest to change. It is now a form field.
 */
export const Settings: GlobalConfig = {
  slug: "settings",
  // Globals take a single label, not a plural pair.
  label: "Shop details",
  access: {
    read: () => true,
    update: ({ req: { user } }) => Boolean(user),
  },
  admin: {
    group: "Settings",
    description:
      "Your phone number, WhatsApp, address and opening hours. These appear all over the website.",
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Identity",
          fields: [
            {
              name: "siteName",
              type: "text",
              required: true,
              defaultValue: "Kivia Designs",
            },
            {
              name: "tagline",
              type: "text",
              defaultValue: "Kurti manufacture, Ahmedabad",
            },
            {
              name: "description",
              type: "textarea",
              maxLength: 200,
              admin: {
                description: "Used for search results and link previews.",
              },
            },
            {
              name: "siteUrl",
              type: "text",
              admin: {
                description: "The live address, e.g. https://kiviadesigns.in",
              },
            },
          ],
        },
        {
          label: "Contact",
          fields: [
            {
              name: "phone",
              type: "text",
              admin: { description: "Shown on the contact page. Digits only." },
            },
            {
              name: "whatsapp",
              type: "text",
              admin: {
                description:
                  "WhatsApp number in international format with no +, for example 919727815381.",
              },
            },
            { name: "email", type: "email" },
            {
              name: "instagramHandle",
              type: "text",
              admin: { description: "Without the @, e.g. kiviakurtis" },
            },
          ],
        },
        {
          label: "Address",
          fields: [
            { name: "shopNameLine", type: "text" },
            {
              name: "addressLines",
              type: "array",
              fields: [{ name: "line", type: "text", required: true }],
              admin: {
                description: "One line per row, as it should appear on the printed label.",
              },
            },
            { name: "city", type: "text", defaultValue: "Ahmedabad" },
            { name: "region", type: "text", defaultValue: "Gujarat" },
            { name: "pincode", type: "text" },
            {
              name: "mapQuery",
              type: "text",
              admin: { description: "What to search for on the map, e.g. 'Kulia Textile Market'." },
            },
          ],
        },
        {
          label: "Opening hours",
          fields: [
            {
              name: "hours",
              type: "array",
              fields: [
                { name: "days", type: "text", required: true },
                { name: "time", type: "text", required: true },
              ],
            },
          ],
        },
        {
          label: "Trading",
          fields: [
            {
              name: "minimumOrderQuantity",
              type: "number",
              defaultValue: 20,
              admin: {
                description:
                  "Stated across the site as the minimum bulk order. Changing this updates every mention.",
              },
            },
            {
              name: "whatsappGreeting",
              type: "textarea",
              maxLength: 300,
              admin: {
                description:
                  "Prefilled message when a customer taps WhatsApp. Plain words only.",
              },
            },
            {
              name: "announcement",
              type: "text",
              admin: {
                description:
                  "Optional strip across the top of every page. Leave blank to hide it.",
              },
            },
          ],
        },
      ],
    },
  ],
};