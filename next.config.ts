import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

/**
 * withPayload sets up what the CMS needs from Next: the admin panel is marked as
 * a server bundle, and Payload's dependencies are externalised so Turbopack
 * does not try to trace them. Next 16.3.8 satisfies both feature gates the
 * plugin checks for, so this works without falling back to webpack.
 */
const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default withPayload(nextConfig);