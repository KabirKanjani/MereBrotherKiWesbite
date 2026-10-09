import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

/**
 * withPayload sets up what the CMS needs from Next: the admin panel is marked as
 * a server bundle, and Payload's dependencies are externalised so Turbopack
 * does not try to trace them. Next 16.3.8 satisfies both feature gates the
 * plugin checks for, so this works without falling back to webpack.
 */
/**
 * Uploaded photographs live in object storage in production, on its own
 * hostname. next/image will not touch an image on a host it does not know
 * about, so the storage host has to be declared here.
 *
 * `IMAGE_STORAGE_PUBLIC_HOST` is the host the bucket serves files from, for
 * example `pub-xxxx.r2.dev` or a custom domain. When it is not set the site
 * only ever renders local and CMS-relative images, which is the development
 * case.
 */
const storageHost = process.env.IMAGE_STORAGE_PUBLIC_HOST;

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      ...(storageHost
        ? [{ protocol: "https" as const, hostname: storageHost }]
        : []),
      // Instagram CDN images in the homepage social strip.
      { protocol: "https" as const, hostname: "*.cdninstagram.com" },
      { protocol: "https" as const, hostname: "*.fbcdn.net" },
    ],
  },
};

export default withPayload(nextConfig);