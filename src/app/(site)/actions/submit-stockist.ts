"use server";

import { getPayload } from "payload";
import config from "@payload-config";

/**
 * Receives applications from shops wanting to stock the range.
 *
 * Kept separate from the general enquiry action because it posts to a different
 * collection with different questions, and because a stockist application is a
 * business relationship rather than a one-off question.
 */

export type StockistResult =
  | { ok: true; reference: string }
  | { ok: false; error: string };

type SubmitInput = {
  businessName?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  city?: string;
  websiteOrInstagram?: string;
  yearsTrading?: string;
  monthlyPieces?: string;
  brandsCarried?: string;
  message?: string;
  /** Honeypot. Must be empty. */
  website?: string;
};

function clean(value: string | undefined, max: number): string {
  if (!value) return "";
  return value.trim().slice(0, max);
}

export async function submitStockistApplication(input: SubmitInput): Promise<StockistResult> {
  if (input.website && input.website.trim().length > 0) {
    return { ok: true, reference: "received" };
  }

  const businessName = clean(input.businessName, 140);
  const ownerName = clean(input.ownerName, 120);
  const phone = clean(input.phone, 40).replace(/\D/g, "");
  const email = clean(input.email, 200);
  const city = clean(input.city, 80);

  if (businessName.length < 2) return { ok: false, error: "Please give the shop or business name." };
  if (ownerName.length < 2) return { ok: false, error: "Please give your name." };
  if (phone.length < 6) {
    return { ok: false, error: "Please give a phone number with at least 6 digits." };
  }
  if (city.length < 2) return { ok: false, error: "Please give the city you would sell in." };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please give an email address so we can send the rate card." };
  }

  const payload = await getPayload({ config });

  const created = await payload.create({
    collection: "stockist-applications",
    data: {
      businessName,
      ownerName,
      phone,
      email,
      city,
      websiteOrInstagram: clean(input.websiteOrInstagram, 200) || undefined,
      yearsTrading: (clean(input.yearsTrading, 20) || null) as
        | "new"
        | "1-3"
        | "3-10"
        | "10+"
        | null
        | undefined,
      monthlyPieces: (clean(input.monthlyPieces, 20) || null) as
        | "under-50"
        | "50-200"
        | "200-500"
        | "500-1000"
        | "1000+"
        | null
        | undefined,
      brandsCarried: clean(input.brandsCarried, 1000) || undefined,
      message: clean(input.message, 2000) || undefined,
      status: "new",
    },
    draft: false,
  });

  return { ok: true, reference: `ST-${created.id}` };
}