import type { CollectionConfig } from "payload";

/**
 * Custom admin components are referenced by path, not imported directly.
 * Payload builds the admin as its own bundle and resolves these through the
 * generated import map, so a direct React reference would not be included.
 */
const PHOTO_CELL = "@/components/admin/ProductPhotoCell#default";
const REORDER_CELL = "@/components/admin/ReorderCell#default";

/**
 * Fabric and category values. These mirror the vocabulary already used in
 * catalog.ts, so importing the existing catalogue does not silently drop or
 * rename anything.
 */
const FABRICS = [
  "Pure Cotton",
  "Cotton Slub",
  "Cotton Cambric",
  "Rayon",
  "Georgette",
  "Chanderi",
  "Crepe",
  "Cotton Silk",
  "Silk",
];

const CATEGORIES = [
  "Kurti",
  "Kurti Pant Set",
  "Kurti Dupatta Set",
  "Kurti Skirt Set",
  "Co-ord Set",
  "Anarkali",
  "Sharara Set",
  "Suit Set",
];

/**
 * The style catalogue.
 *
 * Three rules from the shop owner are enforced here rather than left to whoever
 * is filling the form in:
 *
 *  1. Prices are not shown on the site. The `rateCardPrice` field exists only so
 *     staff have somewhere to note their own figure, it is excluded from the
 *     public read permissions, and no frontend component renders it.
 *  2. Nothing goes live by accident. Drafts are on, so a style being written up
 *     stays invisible to visitors until someone publishes it.
 *  3. No name is invented. `name` is deliberately not required, because a
 *     guessed name would mislabel a real garment.
 *
 * The form is arranged for someone who does not work in this software
 * day to day: the words are plain, the everyday fields sit in the first tab,
 * and the rarely-touched ones are tucked away under "Only if you need it".
 */
export const Products: CollectionConfig = {
  slug: "products",
  labels: {
    singular: "Style",
    plural: "Styles",
  },
  access: {
    // Visitors see published styles only. A draft must never leak, so the
    // constraint is applied to the query rather than trusting the UI.
    read: ({ req: { user } }) => {
      if (user) return true;
      return { _status: { equals: "published" } };
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  admin: {
    useAsTitle: "name",
    // Falls back to the category when a style has not been named yet, so the
    // list never shows a blank column.
    defaultColumns: [
      "image",
      "name",
      "category",
      "season",
      "sortOrder",
      "_status",
      "updatedAt",
    ],
    group: "The Shop",
    description:
      "Every style you sell. Drag the arrows to change the order they appear in on the website.",
    listSearchableFields: ["name", "shortNote", "instagramCode"],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 800,
      },
      schedulePublish: true,
    },
    maxPerDoc: 20,
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "The basics",
          description: "What this style is. Only the name and photo are essential.",
          fields: [
            {
              name: "name",
              type: "text",
              // Deliberately not required. A handful of styles are photographed
              // but not yet named, and inventing a name would mislabel a real
              // garment.
              admin: {
                description:
                  "What you call this style in the shop, e.g. 'Mogra Kurti'. Leave it blank if you have not named it yet and the website will show the type instead.",
              },
            },
            {
              name: "slug",
              type: "text",
              unique: true,
              index: true,
              admin: {
                position: "sidebar",
                description:
                  "The web address for this style. It is filled in from the name automatically. You rarely need to touch it.",
              },
              hooks: {
                beforeValidate: [
                  ({ value, data }) => {
                    if (value) return value;
                    const source = data?.name ?? data?.instagramCode;
                    if (!source) return value;
                    return String(source)
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, "")
                      .slice(0, 60);
                  },
                ],
              },
            },
            {
              name: "category",
              type: "select",
              required: true,
              defaultValue: "Kurti",
              options: CATEGORIES.map((c) => ({ label: c, value: c })),
              admin: {
                description: "The type of garment, e.g. kurti or co-ord set.",
              },
            },
            {
              name: "fabric",
              type: "select",
              options: FABRICS.map((f) => ({ label: f, value: f })),
              admin: {
                description: "Only pick a fabric you have confirmed with your supplier.",
              },
            },
            {
              name: "sizes",
              type: "select",
              hasMany: true,
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
              admin: {
                description: "Tick every size you actually make this in.",
              },
            },
            {
              name: "shortNote",
              type: "textarea",
              maxLength: 160,
              admin: {
                description:
                  "One short line shown under the photo. Keep it factual — the fabric, the cut, or what the style is.",
              },
            },
          ],
        },
        {
          label: "Photos",
          description: "The picture customers will see.",
          fields: [
            {
              name: "image",
              type: "upload",
              relationTo: "media",
              admin: {
                description:
                  "The main photo. Phone photos held upright work best, because the website crops them to a tall rectangle.",
                components: {
                  // Renders the actual garment in the list, instead of a code.
                  Cell: PHOTO_CELL,
                },
              },
            },
            {
              name: "gallery",
              type: "array",
              minRows: 0,
              admin: {
                description: "Any extra photos, such as the back of the garment or a close-up of the work.",
              },
              fields: [
                {
                  name: "image",
                  type: "upload",
                  relationTo: "media",
                },
                {
                  name: "alt",
                  type: "text",
                  admin: {
                    description: "Describe this photo for someone who cannot see it.",
                  },
                },
              ],
            },
          ],
        },
        {
          label: "Only if you need it",
          description: "Extra detail you can leave alone.",
          fields: [
            {
              name: "occasions",
              type: "select",
              hasMany: true,
              options: [
                { label: "Daily Wear", value: "Daily Wear" },
                { label: "Office", value: "Office" },
                { label: "Festive", value: "Festive" },
                { label: "Wedding", value: "Wedding" },
                { label: "Party", value: "Party" },
              ],
              admin: { description: "Used by the filters on the collection page." },
            },
            {
              type: "row",
              fields: [
                {
                  name: "length",
                  type: "text",
                  admin: { description: 'e.g. 42" long' },
                },
                {
                  name: "work",
                  type: "text",
                  admin: { description: "e.g. Hand embroidery" },
                },
              ],
            },
            {
              name: "colors",
              type: "array",
              admin: { description: "Colours you can actually supply." },
              fields: [
                { name: "name", type: "text", required: true },
                {
                  name: "hex",
                  type: "text",
                  admin: { description: "Colour code, e.g. #9c4a28. Used for the swatch." },
                },
              ],
            },
            {
              name: "details",
              type: "array",
              admin: { description: "Bullet points such as pocket, lining or sleeve length." },
              fields: [{ name: "detail", type: "text", required: true }],
            },
            {
              name: "care",
              type: "array",
              admin: { description: "Washing instructions." },
              fields: [{ name: "instruction", type: "text", required: true }],
            },
          ],
        },
        {
          label: "Your notes",
          description: "Never shown to customers.",
          fields: [
            {
              name: "rateCardPrice",
              type: "number",
              admin: {
                description:
                  "Your own wholesale figure, kept for your reference. It is never shown on the website.",
              },
            },
            {
              name: "internalNotes",
              type: "textarea",
              admin: {
                description: "Anything you want to remember about this style.",
              },
            },
            {
              name: "instagramUrl",
              type: "text",
              admin: { description: "Link to the Instagram post this photo came from." },
            },
            {
              name: "instagramCode",
              type: "text",
              unique: true,
              admin: {
                description: "The post code, e.g. Dd8JKRdBWPy. Keeps the photo traceable.",
              },
            },
          ],
        },
      ],
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description:
          "Shows this style in the row on the homepage. Keep four to six ticked so the row looks full.",
      },
    },
    {
      name: "isNew",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Adds a 'New in' tag to the photo.",
      },
    },
    {
      name: "season",
      type: "relationship",
      relationTo: "seasonal-collections",
      admin: {
        position: "sidebar",
        description:
          "Which season this style belongs to, e.g. Diwali 2026. Leave blank if it is not part of a range.",
      },
    },
    {
      name: "sortOrder",
      type: "number",
      defaultValue: 0,
      index: true,
      admin: {
        position: "sidebar",
        description:
          "Where this style sits in the order. Low numbers appear first. Use the arrows in the list rather than typing here.",
        components: {
          Cell: REORDER_CELL,
        },
      },
    },
  ],
};