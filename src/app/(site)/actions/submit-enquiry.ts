"use server";

import { getPayload } from "payload";
import config from "@payload-config";

/**
 * Receives website enquiries and writes them to the database.
 *
 * Before this existed an enquiry existed only as a WhatsApp message in the
 * owner's phone. Nothing was recorded, so a lead could not be followed up,
 * counted, or handed to anybody else.
 *
 * Design notes:
 *  - The visitor's own copy of the details is never stored. Only what they
 *    typed, and only after basic shape checks.
 *  - A honeypot field is checked before anything is written.
 *  - The raw message is stored verbatim rather than being split on newlines, so
 *    a phone number pasted with spaces still arrives intact.
 */

export type EnquiryResult =
  | { ok: true; reference: string }
  | { ok: false; error: string };

type SubmitInput = {
  kind?: "general" | "bulk" | "custom" | "stockist";
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  interest?: string;
  productSlug?: string;
  quantity?: string;
  notes?: string;
  sourcePage?: string;
  /** Honeypot. Must be empty. */
  website?: string;
};

function clean(value: string | undefined, max: number): string {
  if (!value) return "";
  return value.trim().slice(0, max);
}

/**
 * Normalises a phone number to digits, keeping a leading + so international
 * numbers stay diallable.
 */
function normalisePhone(value: string): string {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

export async function submitEnquiry(input: SubmitInput): Promise<EnquiryResult> {
  // Honeypot: a bot filled in the hidden field. Pretend nothing happened.
  if (input.website && input.website.trim().length > 0) {
    return { ok: true, reference: "received" };
  }

  const name = clean(input.name, 120);
  const phone = normalisePhone(clean(input.phone, 40));
  const email = clean(input.email, 200);

  if (name.length < 2) return { ok: false, error: "Please give a name we can reply to." };
  if (phone.replace(/\D/g, "").length < 6) {
    return { ok: false, error: "Please give a phone number with at least 6 digits." };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "That email address does not look right." };
  }

  // Resolve the style if one was named, so the lead records what they asked about.
  let productId: number | undefined;
  if (input.productSlug) {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "products",
      where: { slug: { equals: input.productSlug } },
      limit: 1,
      depth: 0,
      draft: false,
    });
    if (docs[0]) productId = docs[0].id;
  }

  const payload = await getPayload({ config });

  const created = await payload.create({
    collection: "enquiries",
    data: {
      kind: input.kind ?? "general",
      name,
      phone,
      email: email || undefined,
      city: clean(input.city, 80) || undefined,
      interest: clean(input.interest, 200) || undefined,
      quantity: clean(input.quantity, 80) || undefined,
      notes: clean(input.notes, 2000) || undefined,
      product: productId,
      sourcePage: clean(input.sourcePage, 200) || undefined,
      // status and internalNotes are refused at field level, so a visitor
      // cannot set them even by guessing the parameter names.
      status: "new",
    },
    draft: false,
  });

  return { ok: true, reference: `KD-${created.id}` };
}