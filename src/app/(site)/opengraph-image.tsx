import { ImageResponse } from "next/og";
import { getSettings } from "@/lib/cms";
import { site as fallbackSite } from "@/lib/site";

// `alt` has to be a static string, so it comes from the fallback copy rather than
// the CMS. The image itself does read live settings.
export const alt = `${fallbackSite.name} — kurti manufacturer in ${fallbackSite.city}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const site = await getSettings();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#1b1512",
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(247,241,232,0.05) 0px, rgba(247,241,232,0.05) 1px, transparent 1px, transparent 14px)",
          padding: "80px",
          color: "#f7f1e8",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 26,
              letterSpacing: 6,
              color: "#c79a3c",
              display: "flex",
            }}
          >
            <span>KURTI MANUFACTURE</span>
            <span style={{ marginLeft: 16, opacity: 0.7 }}>{site.city.toUpperCase()}</span>
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 88,
              lineHeight: 1.05,
              maxWidth: 900,
              fontFamily: "Georgia, serif",
              display: "flex",
            }}
          >
            Kurtis made in our own Ahmedabad workshop.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(247,241,232,0.25)",
            paddingTop: 32,
          }}
        >
          <div style={{ fontSize: 34, fontFamily: "Georgia, serif", display: "flex" }}>
            {site.name}
          </div>
          <div
            style={{
              fontSize: 26,
              color: "rgba(247,241,232,0.7)",
              display: "flex",
              gap: 16,
            }}
          >
            <span>S&ndash;3XL</span>
            <span>&middot;</span>
            <span>Single pieces &amp; bulk</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}