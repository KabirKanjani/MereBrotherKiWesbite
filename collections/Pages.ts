import type { CollectionConfig } from "payload";
import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  LinkFeature,
  OrderedListFeature,
  UnorderedListFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";

/**
 * Page copy, so wording can be changed without touching code.
 *
 * The layout is a fixed set of sections rather than a free-form builder, because
 * the pages are editorial one-pagers: a lead paragraph, then a sequence of
 * sections each with a heading and some prose. That covers the About, Craft,
 * Bulk Orders, Size Guide and Visit pages without letting the structure drift
 * away from the design.
 */
export const Pages: CollectionConfig = {
  slug: "pages",
  labels: {
    singular: "Page",
    plural: "Pages",
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
    group: "Settings",
    description: "The wording on the About, Craft, Bulk Orders, Size Guide and Visit pages.",
  },
  versions: {
    drafts: { autosave: { interval: 800 }, schedulePublish: true },
    maxPerDoc: 20,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
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
      name: "eyebrow",
      type: "text",
      admin: {
        description: "Small label above the title, e.g. 'Our Workshop'.",
      },
    },
    {
      name: "lead",
      type: "textarea",
      maxLength: 320,
      admin: {
        description: "The sentence under the title. One or two lines.",
      },
    },
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "body",
      type: "richText",
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          FixedToolbarFeature(),
          HeadingFeature({ enabledHeadingSizes: ["h2", "h3"] }),
          BlocksFeature({
            blocks: [
              {
                slug: "callout",
                labels: { singular: "Callout", plural: "Callouts" },
                fields: [
                  {
                    name: "text",
                    type: "textarea",
                    required: true,
                  },
                ],
              },
            ],
          }),
          LinkFeature(),
          UnorderedListFeature(),
          OrderedListFeature(),
        ],
      }),
    },
    {
      name: "seoTitle",
      type: "text",
      admin: {
        description: "Leave blank to use the page title.",
      },
    },
    {
      name: "seoDescription",
      type: "textarea",
      maxLength: 180,
    },
  ],
};