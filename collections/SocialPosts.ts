import type { CollectionConfig } from "payload";

/**
 * Recent Instagram posts, shown on the homepage.
 *
 * Deliberately not scraped live. Instagram's API needs a linked business
 * account and a token that expires, and scraping breaks whenever the markup
 * moves. So the posts are entered here instead, which means they can never break
 * the site and staff control exactly what a first-time visitor sees.
 *
 * The existing 12 harvested posts can be imported with tools/seed-social.ts.
 */
export const SocialPosts: CollectionConfig = {
  slug: "social-posts",
  labels: {
    singular: "Instagram post",
    plural: "Instagram posts",
  },
  access: {
    // Visitors need to see the feed on the homepage.
    read: ({ req: { user } }) => {
      if (user) return true;
      return { published: { equals: true } };
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  admin: {
    useAsTitle: "caption",
    defaultColumns: ["image", "caption", "published", "postedAt"],
    group: "The Shop",
    description:
      "Recent posts from Instagram. Drag a photo into the box below to add one.",
    listSearchableFields: ["caption", "permalink"],
  },
  fields: [
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: { description: "The post photo. Portrait works best in the strip." },
    },
    {
      name: "caption",
      type: "textarea",
      maxLength: 200,
      admin: { description: "A short line shown under the photo, or on hover." },
    },
    {
      name: "permalink",
      type: "text",
      required: true,
      admin: { description: "Link to the post on Instagram." },
    },
    {
      name: "postedAt",
      type: "date",
      admin: { description: "When it was posted. Used to order the strip." },
    },
    {
      name: "published",
      type: "checkbox",
      defaultValue: true,
      admin: {
        position: "sidebar",
        description: "Untick to hide it from the website without deleting it.",
      },
    },
    {
      name: "sortOrder",
      type: "number",
      defaultValue: 0,
      index: true,
      admin: {
        position: "sidebar",
        description: "Lower numbers appear first.",
      },
    },
  ],
};