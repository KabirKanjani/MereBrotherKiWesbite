import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";

import { getProducts, getSettings } from "@/lib/cms";

/**
 * Generates the wholesale rate card as a PDF.
 *
 * Wholesale buyers expect a price list as a document they can circulate
 * internally, so a webpage does not do the job.
 *
 * Prices only appear for styles where staff have entered a rate in the admin.
 * Anything without one is listed with "On request" rather than a blank or a
 * guessed figure, because a rate card is a promise and an invented number on it
 * becomes a real problem.
 */

/** PDF generation needs Node, not the edge runtime. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Brand colours, matching globals.css. */
const INK = "#1b1512";
const CLAY = "#9c4a28";
const INK_SOFT = "#4a4038";
const LINE = "#e2d8c9";
const SAND = "#f7f1e8";

export async function GET(request: Request) {
  const url = new URL(request.url);

  /*
   * The rate card is the commercial part of the site. Anyone can read the
   * preview, but sending it elsewhere needs a token so it cannot simply be
   * discovered and forwarded. When no token is configured the document stays
   * open, which is the sensible default for a single-operator shop.
   */
  const configuredToken = process.env.RATE_CARD_TOKEN;
  if (configuredToken) {
    const supplied = url.searchParams.get("token");
    if (supplied !== configuredToken) {
      return NextResponse.json(
        { error: "A valid rate card token is required." },
        { status: 401 },
      );
    }
  }

  const [products, settings] = await Promise.all([getProducts(), getSettings()]);

  const doc = new PDFDocument({ size: "A4", margin: 40, info: {
    Title: `${settings.name} wholesale rate card`,
    Author: settings.name,
    Subject: "Wholesale price list",
  } });

  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const finished = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const M = 40;
  const pageWidth = doc.page.width - M * 2;

  /* ---- cover header ---- */
  doc.rect(0, 0, doc.page.width, 120).fill(INK);
  doc.fillColor("#f7f1e8").font("Helvetica-Bold").fontSize(24).text(settings.name, M, 40);
  doc.font("Helvetica").fontSize(10).fillColor("#c79a3c").text("WHOLESALE RATE CARD", M, 70);
  doc
    .fontSize(9)
    .fillColor("#8c8378")
    .text(
      `${settings.city}, ${settings.region}  |  ${settings.phone}  |  ${settings.email}`,
      M,
      88,
      { width: pageWidth },
    );

  doc.y = 145;

  doc.fillColor(INK).font("Helvetica-Bold").fontSize(13).text("Trading terms", M, doc.y);
  doc
    .moveDown(0.6)
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor(INK_SOFT)
    .text(
      [
        `Minimum order: ${settings.minimumOrderQuantity} pieces per style.`,
        "Prices are per piece, exclusive of GST, and are indicative until confirmed in writing.",
        "Fabrics and colours are subject to availability. Lead time is confirmed with each order.",
        `Enquiries: ${settings.phone} or ${settings.email}`,
      ].join("\n"),
      { width: pageWidth, lineGap: 3 },
    );

  doc.moveDown(1.2);

  /* ---- table ---- */
  const headerY = doc.y;
  doc.rect(M, headerY, pageWidth, 20).fill(SAND);

  const cols = {
    style: M + 6,
    category: M + 168,
    fabric: M + 258,
    sizes: M + 348,
    price: M + 432,
  };

  doc.fillColor(INK).font("Helvetica-Bold").fontSize(8.5);
  doc.text("STYLE", cols.style, headerY + 6, { width: 158 });
  doc.text("TYPE", cols.category, headerY + 6, { width: 86 });
  doc.text("FABRIC", cols.fabric, headerY + 6, { width: 86 });
  doc.text("SIZES", cols.sizes, headerY + 6, { width: 80 });
  doc.text("RATE / PIECE", cols.price, headerY + 6, { width: 74, align: "right" });

  let rowY = headerY + 20;

  const printable = products.filter((p) => p.name || p.category);

  if (printable.length === 0) {
    doc.moveDown(3).font("Helvetica").fontSize(10).fillColor(INK_SOFT)
      .text("No styles are published yet.", { width: pageWidth });
  }

  for (const p of printable) {
    const label = p.name || `${p.category} (code ${p.instagramCode || p.slug})`;
    const sizes = p.sizes.length ? p.sizes.join(", ") : "On request";
    const price = p.rateCardPrice != null ? formatRupees(p.rateCardPrice) : "On request";

    // Measure the tallest cell so rows never overlap.
    doc.font("Helvetica-Bold").fontSize(9).fillColor(INK);
    const styleH = doc.heightOfString(label, { width: 158 });
    doc.font("Helvetica").fontSize(9).fillColor(INK_SOFT);
    const catH = doc.heightOfString(p.category, { width: 86 });
    const fabH = doc.heightOfString(p.fabric ?? "—", { width: 86 });
    const sizeH = doc.heightOfString(sizes, { width: 80 });
    const priceH = doc.heightOfString(price, { width: 74 });
    const rowH = Math.max(styleH, catH, fabH, sizeH, priceH) + 12;

    // Start a new page rather than splitting a row across the boundary.
    if (rowY + rowH > doc.page.height - 60) {
      doc.addPage();
      rowY = 40;
    }

    doc.moveTo(M, rowY + rowH - 6).lineTo(M + pageWidth, rowY + rowH - 6).lineWidth(0.5).strokeColor(LINE).stroke();

    doc.font("Helvetica-Bold").fontSize(9).fillColor(INK);
    doc.text(label, cols.style, rowY + 2, { width: 158 });

    doc.font("Helvetica").fontSize(9).fillColor(INK_SOFT);
    doc.text(p.category, cols.category, rowY + 2, { width: 86 });
    doc.text(p.fabric ?? "—", cols.fabric, rowY + 2, { width: 86 });
    doc.text(sizes, cols.sizes, rowY + 2, { width: 80 });

    doc
      .font(p.rateCardPrice != null ? "Helvetica-Bold" : "Helvetica-Oblique")
      .fillColor(p.rateCardPrice != null ? CLAY : INK_SOFT)
      .text(price, cols.price, rowY + 2, { width: 74, align: "right" });

    rowY += rowH;
  }

  /* ---- footer on the final page ---- */
  const footerY = Math.min(rowY + 20, doc.page.height - 70);
  doc.font("Helvetica").fontSize(8.5).fillColor(INK_SOFT);
  doc.text(
    [
      "Prices are indicative and confirmed on enquiry. Styles without a rate shown are available on request.",
      `${settings.name}  |  ${settings.city}  |  ${settings.phone}  |  ${settings.email}`,
    ].join("\n"),
    M,
    footerY,
    { width: pageWidth, lineGap: 2 },
  );

  doc.end();
  const buffer = await finished;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${slugify(settings.name)}-rate-card.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Indian numbering, e.g. 125000 -> "1,25,000". */
function formatRupees(value: number): string {
  const rounded = Math.round(value);
  const [whole, rest] = String(rounded).split(".");
  const last3 = whole.slice(-3);
  const restStr = whole.slice(0, -3);
  const grouped = restStr ? `${restStr.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${last3}` : last3;
  return `₹${rest ? `${grouped}.${rest}` : grouped}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}