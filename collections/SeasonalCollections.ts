import type { CollectionConfig } from "payload";

/**
 * A named seasonal or thematic group of styles, e.g. "Diwali 2026" or
 * "Summer Linen".
 *
 * Groups give the shop somewhere to put a range while it is current, without
 * anyone having to rebuild the site each season. Each one gets its own page and
 * is listed on the homepage.
 */
export const SeasonalCollections: CollectionConfig = {
  slug: "seasonal-collections",
  labels: {
    singular: "Season",
    plural: "Seasons",
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return { _status: { equals: "published" } };
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status", "updatedAt"],
    group: "The Shop",
    description:
      "Group styles into named ranges. Each season gets its own page on the website.",
  },
  versions: {
    drafts: { autosave: { interval: 800 } },
    maxPerDoc: 20,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      admin: { description: "e.g. Diwali 2026, Summer Linen, Wedding Edit" },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { description: "The web address. Filled in from the title automatically." },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (value) return value;
            const source = data?.title;
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
      name: "seasonLabel",
      type: "text",
      admin: {
        description: "Small label above the title, e.g. 'Autumn Winter'.",
      },
    },
    {
      name: "summary",
      type: "textarea",
      maxLength: 300,
      admin: { description: "One or two sentences for the season page." },
    },
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
      admin: { description: "Optional banner for the season page." },
    },
    {
      name: "bannerText",
      type: "text",
      admin: { description: "e.g. Diwali 2026" },
    },
    {
      name: "sortOrder",
      type: "number",
      defaultValue: 0,
      index: true,
      admin: {
        position: "sidebar",
        description: "Lower numbers appear first on the collection page.",
      },
    },
    {
      name: "seoTitle",
      type: "text",
      admin: { description: "Leave blank to use the title." },
    },
    {
      name: "seoDescription",
      type: "textarea",
      maxLength: 180,
      admin: {},
    },
  ],
};