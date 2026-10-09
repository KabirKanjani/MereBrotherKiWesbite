import path from "node:path";
import type { CollectionConfig } from "payload";

/**
 * Every image on the site. Uploading through here means one photo can be reused
 * across products, and the admin panel gets a browsable media library.
 *
 * Storage is local disk in development. On Render the filesystem is wiped on
 * every deploy, so production needs this pointed at object storage instead —
 * see tools/README-deploy.md before the first production upload.
 */
export const Media: CollectionConfig = {
  slug: "media",
  labels: {
    singular: "Photo",
    plural: "Photos",
  },
  access: {
    // Photographs are the point of the site, so anyone may read them.
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  admin: {
    useAsTitle: "filename",
    group: "The Shop",
    description: "Every photo used on the website. Upload new ones here, then attach them to a style.",
  },
  upload: {
    // Product photography is tall and narrow, 9:16 from a phone reel.
    staticDir: path.join(process.cwd(), "media"),
    mimeTypes: ["image/*"],
    imageSizes: [
      { name: "thumbnail", width: 400, height: 400, position: "centre" },
      { name: "card", width: 800, height: 1200, position: "centre" },
      { name: "hero", width: 1600, height: 1600, position: "centre" },
    ],
    adminThumbnail: "thumbnail",
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      admin: {
        description:
          "Describe the garment for anyone who cannot see the photo, and for when it fails to load. Do not start it with 'image of'.",
      },
    },
    {
      name: "caption",
      type: "textarea",
      admin: {
        description: "Optional. A short line shown if this photo is ever used as a banner.",
      },
    },
  ],
};