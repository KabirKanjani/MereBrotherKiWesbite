"use client";

import { useState, type FormEvent } from "react";
import { type Product } from "@/lib/cms";
import { enquiryWhatsappUrl, generalWhatsappUrl } from "@/lib/whatsapp";
import { submitEnquiry } from "@/app/(site)/actions/submit-enquiry";

/**
 * The catalogue is passed in from the server. This is a client component, so it
 * cannot reach the database itself, and the shape it needs is only the slug,
 * category and name.
 */
type SlimProduct = Pick<Product, "slug" | "category" | "name" | "fabric" | "sizes">;

type Errors = Partial<Record<"name" | "phone" | "email" | "interest", string>>;

const interests: { value: string; label: string }[] = [
  { value: "A specific style", label: "A specific style" },
  { value: "Single piece order", label: "Single piece order" },
  { value: "Bulk / wholesale", label: "Bulk or wholesale order" },
  { value: "Custom tailoring", label: "Custom tailoring" },
  { value: "Sample pack", label: "Fabric sample pack" },
  { value: "Visit the store", label: "Visiting the store" },
  { value: "Something else", label: "Something else" },
];

const quantities = ["1-4 pieces", "5-19 pieces", "20-49 pieces", "50-199 pieces", "200+ pieces"];

/** Maps the friendly interest labels onto a short kind for the database. */
const KIND_FOR_INTEREST: Record<string, "general" | "bulk" | "custom" | "stockist"> = {
  "Bulk / wholesale": "bulk",
  "Custom tailoring": "custom",
};

export default function EnquiryForm({
  presetProduct,
  products,
  shopName,
  shopPhone,
  shopCity,
  shopEmail,
}: {
  presetProduct?: string;
  products: SlimProduct[];
  shopName: string;
  shopPhone: string;
  shopCity: string;
  shopEmail: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [interest, setInterest] = useState("A specific style");
  const [product, setProduct] = useState(presetProduct ?? "");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [honeypot, setHoneypot] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const chosen = products.find((p) => p.slug === product);

  function validate() {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = "Please enter your name.";
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) next.phone = "Enter a 10 digit phone number.";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "That email address does not look right.";
    }
    if (!interest) next.interest = "Pick what your enquiry is about.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSending(true);

    const interestLine = chosen
      ? `${interest} - ${chosen.category}${chosen.name ? `, ${chosen.name}` : ""}`
      : interest;

    /*
     * Saved to the database first. WhatsApp is offered afterwards as a
     * convenience, but the enquiry no longer depends on the customer having
     * WhatsApp installed or on anyone reading the message.
     */
    const result = await submitEnquiry({
      kind: KIND_FOR_INTEREST[interest] ?? "general",
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      city: city.trim() || undefined,
      interest: interestLine,
      productSlug: chosen?.slug,
      quantity: quantity || undefined,
      notes: notes.trim() || undefined,
      sourcePage: presetProduct ? `/collection/${presetProduct}` : "/enquiry",
      website: honeypot,
    });

    setSending(false);

    if (!result.ok) {
      setServerError(result.error);
      return;
    }

    setSent(result.reference);
  }

  // Confirmed. Offer WhatsApp, but do not require it.
  if (sent) {
    const url = enquiryWhatsappUrl({
      name: name.trim(),
      phone: phone.trim(),
      interest: chosen ? `${interest} - ${chosen.category}` : interest,
      quantity: quantity || undefined,
      city: city.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    return (
      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
        <div className="border border-line bg-sand p-8">
          <p className="eyebrow">Enquiry received</p>
          <h2 className="display mt-3 text-3xl">Thank you, we have your details</h2>
          <p className="mt-4 leading-relaxed text-ink-soft">
            Your enquiry is with us and someone will reply during store hours. Your reference is{" "}
            <span className="font-medium text-ink">{sent}</span> — quote it if you get in touch
            again.
          </p>

          <div className="mt-7 border-t border-line pt-6">
            <p className="text-sm leading-relaxed text-ink-soft">
              Want it moving faster? Sending the same message on WhatsApp puts you at the front of
              the queue. This is optional.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Also send on WhatsApp
              </a>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setSent(null);
                  setName("");
                  setPhone("");
                  setEmail("");
                  setCity("");
                  setQuantity("");
                  setNotes("");
                  setProduct("");
                }}
              >
                Send another enquiry
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="border border-line p-6">
            <h2 className="font-display text-xl text-ink">Prefer to talk?</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Call the {shopCity} workshop on{" "}
              <a href={`tel:${shopPhone}`} className="text-clay underline">
                {shopPhone}
              </a>
              , or email{" "}
              <a href={`mailto:${shopEmail}`} className="text-clay underline">
                {shopEmail}
              </a>
              .
            </p>
          </div>
        </aside>
      </div>
    );
  }

  // Derived from the catalogue rather than hardcoded, so a category added in the
  // CMS appears here without a code change.
  const categories: string[] = ["All", ...new Set(products.map((p) => p.category))];

  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">
              Your name
            </label>
            <input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field"
              placeholder="Priya Shah"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name ? (
              <p id="name-error" role="alert" className="mt-1.5 text-xs text-maroon">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div>
            <label className="label" htmlFor="phone">
              Phone / WhatsApp number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="field"
              placeholder="98765 43210"
              autoComplete="tel"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "phone-error" : undefined}
            />
            {errors.phone ? (
              <p id="phone-error" role="alert" className="mt-1.5 text-xs text-maroon">
                {errors.phone}
              </p>
            ) : null}
          </div>

          <div>
            <label className="label" htmlFor="email">
              Email <span className="normal-case tracking-normal">(optional)</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email ? (
              <p id="email-error" role="alert" className="mt-1.5 text-xs text-maroon">
                {errors.email}
              </p>
            ) : null}
          </div>
        </div>

        {/* Honeypot: hidden from people, filled in by bots. */}
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        {serverError ? (
          <p role="alert" className="border border-maroon/30 bg-maroon/5 p-4 text-sm text-maroon">
            {serverError}
          </p>
        ) : null}

        <div>
          <span className="label">What is your enquiry about?</span>
          <div className="flex flex-wrap gap-2">
            {interests.map((i) => (
              <button
                key={i.value}
                type="button"
                onClick={() => setInterest(i.value)}
                aria-pressed={interest === i.value}
                className={`border px-3 py-2 text-xs transition-colors ${
                  interest === i.value
                    ? "border-clay bg-clay text-linen"
                    : "border-line bg-white text-ink-soft hover:border-clay hover:text-clay"
                }`}
              >
                {i.label}
              </button>
            ))}
          </div>
          {errors.interest ? (
            <p role="alert" className="mt-1.5 text-xs text-maroon">
              {errors.interest}
            </p>
          ) : null}
        </div>

        {interest === "A specific style" ? (
          <div>
            <label className="label" htmlFor="product">
              Which style? (optional)
            </label>
            <select
              id="product"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="field"
            >
              <option value="">Not sure yet, show me options</option>
              {categories.map((c) =>
                c === "All" ? null : (
                  <optgroup key={c} label={c}>
                    {products
                      .filter((p) => p.category === c)
                      .map((p, i) => (
                        <option key={p.slug} value={p.slug}>
                          {p.name || `${p.category} ${i + 1}`}
                        </option>
                      ))}
                  </optgroup>
                ),
              )}
            </select>
            {chosen ? (
              <p className="mt-1.5 text-xs text-ink-soft">
                {[
                  chosen.fabric,
                  chosen.sizes.length ? `sizes ${chosen.sizes.join(", ")}` : null,
                  "bulk orders from 20 pieces",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="quantity">
              Quantity (optional)
            </label>
            <select
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="field"
            >
              <option value="">Just enquiring</option>
              {quantities.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="city">
              City (optional)
            </label>
            <input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="field"
              placeholder="Surat"
              autoComplete="address-level2"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="notes">
            Anything else? (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="field resize-y"
            placeholder="Chest 38 in, need it by Diwali, prefer dark colours..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? "Sending..." : "Send enquiry"}
          </button>
          <p className="text-xs leading-relaxed text-ink-soft">
            Saved to us straight away. We will reply during store hours. You will be offered
            WhatsApp as a faster option afterwards.
          </p>
        </div>

        <p className="text-xs leading-relaxed text-ink-soft">
          Prefer to talk first? Call us on{" "}
          <a href={`tel:${shopPhone}`} className="text-clay underline">
            {shopPhone}
          </a>
        </p>
      </form>

      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <div className="border border-line bg-sand p-6">
          <h2 className="font-display text-xl text-ink">Why WhatsApp</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            You will get a reply from a person at our {shopCity} workshop, usually within a few
            hours during business time. We can share photos of the actual piece, confirm stock, and
            quote a delivery date &mdash; things an email form cannot do.
          </p>
          <ul className="mt-5 space-y-2">
            {[
              "Reply during store hours, 10:30 AM to 8:30 PM",
              "We can send extra photos on request",
              "Rate card for bulk and wholesale",
              "Fabric and size help before you order",
            ].map((point) => (
              <li key={point} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                <span className="mt-2 h-px w-3 shrink-0 bg-clay" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-line bg-white p-6">
          <h2 className="font-display text-xl text-ink">Who you are dealing with</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {shopName} is a kurti manufacturing workshop in {shopCity}. The person replying to
            your message can answer questions about fabric, stitching, sizing and shipping
            directly, because the same people who make the kurtis work in the store.
          </p>
          <a href={generalWhatsappUrl()} className="btn btn-outline mt-5">
            Plain WhatsApp message
          </a>
        </div>
      </aside>
    </div>
  );
}