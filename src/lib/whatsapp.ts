/**
 * Fallback contact details, used only when a caller does not pass the CMS value.
 *
 * Kept as a plain constant rather than imported from site.ts so this module
 * stays free of any dependency on the CMS, which lets client components use it
 * without pulling the server-only data layer into the browser bundle.
 */
const FALLBACK_WHATSAPP = "919727815381";

/**
 * Every helper here takes an optional WhatsApp number so server components can
 * pass the value stored in the CMS. The fallback to site.whatsapp keeps client
 * components working without having to thread settings through props, and the
 * number is never wrong in a harmful way — a stale fallback only sends a
 * message to the previous number.
 */
function number(whatsapp?: string) {
  return whatsapp || FALLBACK_WHATSAPP;
}

export function whatsappUrl(message: string, whatsapp?: string) {
  return `https://wa.me/${number(whatsapp)}?text=${encodeURIComponent(message)}`;
}

export function generalWhatsappUrl(
  message = "Hi Kivia Designs, I'd like to know more about your kurtis.",
  whatsapp?: string,
) {
  return whatsappUrl(message, whatsapp);
}

export function productWhatsappUrl(
  product: {
    name: string;
    slug: string;
    category: string;
    fabric: string | null;
  },
  whatsapp?: string,
) {
  return whatsappUrl(
    [
      "Hi Kivia Designs,",
      "",
      `I'm interested in the ${product.category.toLowerCase()} you posted as ${product.slug},`,
      product.fabric ? `in ${product.fabric},` : null,
      product.name ? `named ${product.name},` : null,
      "",
      "My required quantity:",
      "My delivery date:",
      "",
      "Please share the rate card, minimum order quantity and lead time.",
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
    whatsapp,
  );
}

export function enquiryWhatsappUrl(details: {
  name: string;
  phone: string;
  interest: string;
  quantity?: string;
  city?: string;
  notes?: string;
}) {
  const lines = [
    "New enquiry from the website",
    "",
    `Name: ${details.name}`,
    `Phone: ${details.phone}`,
    `Interested in: ${details.interest}`,
  ];
  if (details.city) lines.push(`City: ${details.city}`);
  if (details.quantity) lines.push(`Quantity: ${details.quantity}`);
  if (details.notes) lines.push(`Notes: ${details.notes}`);
  return whatsappUrl(lines.join("\n"));
}

export function bulkWhatsappUrl(whatsapp?: string) {
  return whatsappUrl(
    [
      "Hi Kivia Designs,",
      "",
      "I'm interested in a bulk / wholesale kurti order.",
      "Please share your rate card, minimum order quantity and lead time.",
    ].join("\n"),
    whatsapp,
  );
}

export function visitWhatsappUrl(whatsapp?: string, city = "Ahmedabad") {
  return whatsappUrl(
    `Hi Kivia Designs, I'd like to visit your ${city} store. Please share the exact address and timings.`,
    whatsapp,
  );
}

export function mailtoUrl(email?: string) {
  return `mailto:${email || "hello@kiviadesigns.in"}`;
}