import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/cms";
import { logoSrc } from "@/lib/logo";

// The manifest icon type has to match the real file extension, otherwise
// Android rejects the icon instead of showing it.
const ICON_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
};

// Same reason as robots.txt: the shop name comes from the database, so this
// must be rendered on request rather than at build time.
export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const site = await getSettings();
  const iconType = logoSrc
    ? ICON_TYPES[logoSrc.split(".").pop()!.toLowerCase()] ?? "image/png"
    : null;

  return {
    name: `${site.name} — Kurti Manufacturer`,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#fbf8f3",
    theme_color: "#9c4a28",
    lang: "en-IN",
    icons: logoSrc
      ? [{ src: logoSrc, sizes: "256x256", type: iconType!, purpose: "any" }]
      : undefined,
  };
}