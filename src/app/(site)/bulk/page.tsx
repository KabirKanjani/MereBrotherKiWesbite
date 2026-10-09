import type { Metadata } from "next";
import { bulkWhatsappUrl, generalWhatsappUrl } from "@/lib/whatsapp";
import { getSettings } from "@/lib/cms";

// Reads live settings, so it cannot be prerendered. Prerendering would make the
// build open a database connection, and on Render the database is not reachable
// until the service is already running.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bulk Orders & Custom Kurti Manufacturing",
  description:
    "Wholesale kurtis, custom sizing, private labelling and bulk manufacturing for retailers, event clients and wedding orders from our Ahmedabad workshop. MOQ from 20 pieces.",
  alternates: { canonical: "/bulk" },
};

const tiers = [
  {
    qty: "1 - 19 pieces",
    label: "Single pieces",
    body: "Full retail pricing. Choose your own colours and sizes. Alterations to measure are included.",
  },
  {
    qty: "20 - 49 pieces",
    label: "Small wholesale",
    body: "Wholesale rates apply. Mixed sizes and colours accepted. No minimum per colour.",
  },
  {
    qty: "50 - 199 pieces",
    label: "Bulk",
    body: "Better rates, priority in the production queue, and we hold stock for your repeat orders.",
  },
  {
    qty: "200+ pieces",
    label: "Manufacturing",
    body: "Your own fabric or print, custom sizes, private labels and packaging. Talk to us early so we can plan capacity.",
  },
];

const customOptions = [
  {
    title: "Private labelling",
    body: "Your brand label, your size tags, your packaging. Send us the artwork or the labels and we will sew them in.",
  },
  {
    title: "Custom sizing",
    body: "Grade to your own size chart, or per customer measurements. We grade from a single pattern across your full range.",
  },
  {
    title: "Your fabric or print",
    body: "You supply the fabric, or we source it. For your own print, we arrange screen printing and block printing with our vendors.",
  },
  {
    title: "Custom colourways",
    body: "Any colour in any quantity. For full custom dyes on 100+ pieces, tell us early so we can reserve a lot.",
  },
  {
    title: "Event and wedding orders",
    body: "Matching sets for the family, coordinated colours for a whole wedding party, and matching dupattas.",
  },
  {
    title: "Repeat order holding",
    body: "Regular buyers can have stock held and reserved for their next order, so reorders ship the same day.",
  },
];

const faqs = [
  {
    q: "What is your minimum order quantity?",
    a: "There is no minimum for single pieces, and wholesale rates start at 20 pieces. For private labelling or custom fabric we usually ask for 50 pieces and up, because the setup cost is only sensible at that volume.",
  },
  {
    q: "How long does production take?",
    a: "Ready stock ships within 3 working days. A custom run of 50 pieces usually takes 10 to 15 days. Larger runs are quoted after we check capacity, and we will tell you the date before you pay.",
  },
  {
    q: "Do you ship across India?",
    a: "Yes. We dispatch from Ahmedabad to all serviceable pin codes. Delivery is typically 3 to 6 working days depending on distance. Cash on delivery is available on many pin codes.",
  },
  {
    q: "Can I mix sizes and colours in one order?",
    a: "Yes, for wholesale orders. You can send us a size and colour breakdown in the message and we will confirm what is possible before you pay.",
  },
  {
    q: "Do you return or exchange pieces?",
    a: "Yes. If a piece has a manufacturing fault, send us photos and we will replace it. We cannot accept returns for size preference once a piece has been altered to your measurements, so please check the size guide first.",
  },
  {
    q: "Are you GST registered?",
    a: "Message us for a copy of our GST certificate and current rate card. We share the same documents with every wholesale buyer.",
  },
];

export default async function BulkPage() {
  const site = await getSettings();
  return (
    <>
      <section className="bg-ink text-linen">
        <div className="wrap py-16 md:py-24">
          <p className="eyebrow text-saffron">Bulk &amp; custom</p>
          <h1 className="display mt-4 max-w-3xl text-4xl md:text-6xl">
            Wholesale kurtis, made to your spec
          </h1>
          <p className="mt-6 max-w-2xl leading-relaxed text-linen/70">
            For retailers, event planners and anyone ordering kurtis for a wedding or a company.
            Since we manufacture rather than trade, you deal with the workshop directly &mdash;
            wholesale rates, custom sizing, your own labels, and a straight answer on lead time.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href={bulkWhatsappUrl()} className="btn btn-primary">
              Request rate card
            </a>
            <a href={generalWhatsappUrl()} className="btn btn-ghost-light">
              Talk to us first
            </a>
          </div>
        </div>
      </section>

      <section className="wrap py-16 md:py-24">
        <p className="eyebrow">Order tiers</p>
        <h2 className="display mt-3 text-3xl md:text-4xl">Where you land on pricing</h2>
        <div className="mt-10 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((t) => (
            <div key={t.qty} className="bg-white p-6">
              <p className="font-display text-2xl text-clay">{t.qty}</p>
              <p className="mt-1 text-[0.6875rem] uppercase tracking-[0.16em] text-ink-soft">
                {t.label}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">{t.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-ink-soft">
          Rates vary by fabric and design. Send us the style codes you are interested in and we will
          send a written rate card with quantities, lead time and payment terms.
        </p>
      </section>

      <section className="bg-sand py-16 md:py-24">
        <div className="wrap">
          <div className="max-w-2xl">
            <p className="eyebrow">What we can do</p>
            <h2 className="display mt-3 text-3xl md:text-4xl">
              Beyond off-the-shelf kurtis
            </h2>
          </div>
          <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {customOptions.map((c) => (
              <div key={c.title} className="border-t border-line pt-5">
                <h3 className="font-display text-lg text-ink">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap py-16 md:py-24">
        <p className="eyebrow">Common questions</p>
        <h2 className="display mt-3 text-3xl md:text-4xl">Before you place an order</h2>

        <div className="mt-10 divide-y divide-line border-y border-line">
          {faqs.map((f) => (
            <div key={f.q} className="py-6">
              <h3 className="font-display text-xl text-ink">{f.q}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 border border-line bg-white p-8 md:p-10">
          <h2 className="display text-2xl md:text-3xl">Ready to get a rate card?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
            Send us the styles you want, the quantity per size, and your delivery date. We reply
            with pricing, lead time and payment terms. If you would rather talk it through, call us
            on {site.phone}.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={bulkWhatsappUrl()} className="btn btn-primary">
              Request rate card
            </a>
            <a href={`tel:${site.phone}`} className="btn btn-outline">
              Call {site.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}