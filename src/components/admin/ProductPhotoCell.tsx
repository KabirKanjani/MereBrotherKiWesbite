"use client";

import Image from "next/image";
import type { DefaultCellComponentProps } from "payload";

type MediaDoc = {
  url?: string | null;
  alt?: string | null;
  thumbnailURL?: string | null;
};

/**
 * Shows the garment's photograph in the product list.
 *
 * Without this the list is a column of style codes, which is close to useless
 * for someone who recognises garments by sight rather than by a database ID.
 *
 * Referenced from the Products collection by path, so it is part of the admin
 * bundle rather than the storefront.
 */
export default function ProductPhotoCell({
  cellData,
  rowData,
}: DefaultCellComponentProps) {
  const media = cellData as MediaDoc | undefined;

  if (!media || typeof media !== "object" || !media.url) {
    return <span className="text-xs opacity-50">No photo yet</span>;
  }

  // The card-size derivative is what the grid itself uses, so the admin list
  // shows the same crop a customer will see.
  const src = media.thumbnailURL || media.url;
  const name = rowData?.name;
  const alt = media.alt || (typeof name === "string" && name ? name : "Product photo");

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem" }}>
      <span
        style={{
          position: "relative",
          display: "block",
          width: "40px",
          height: "52px",
          flexShrink: 0,
          overflow: "hidden",
          borderRadius: "2px",
          background: "var(--theme-elevation-100)",
        }}
      >
        <Image src={src} alt={alt} fill sizes="40px" style={{ objectFit: "cover" }} />
      </span>
    </span>
  );
}