import type { Metadata } from "next";

import StockistForm from "@/components/stockist-form";

export const metadata: Metadata = {
  title: "Become a Stockist",
  description:
    "Stock Kivia Designs in your city. Wholesale kurtis, kurti pant sets and co-ord sets manufactured in our own Ahmedabad workshop, with a rate card sent on request.",
  alternates: { canonical: "/become-a-stockist" },
};

/** Read on demand so the form's contact details come from the CMS. */
export const dynamic = "force-dynamic";

const benefits = [
  {
    title: "Our own workshop",
    body: "Cutting, stitching, embroidery and finishing under one roof in Ahmedabad. No outsourced quality control, and no waiting on a third party.",
  },
  {
    title: "Fresh catalogues each season",
    body: "Ranges designed around what actually sells at retail, sent before the season starts rather than after.",
  },
  {
    title: "Low minimum order",
    body: "20 pieces per style, so you can test a new range without committing to a container.",
  },
  {
    title: "Made to your measurements",
    body: "Bring your own design and we will cut it to your spec, with your label. Your vision, our floor.",
  },
  {
    title: "Manufacturer-direct pricing",
    body: "Rates built for retail margin, quoted per style and fabric before you commit to anything.",
  },
  {
    title: "Fast dispatch",
    body: "Packing lines built for season, so your shelves are stocked when the season starts, not after.",
  },
];

const steps = [
  { step: "01", title: "Send your details", body: "The form on this page takes a minute. We ask about your city and volume so we know what to quote." },
  { step: "02", title: "Get the rate card", body: "We reply within one business day with wholesale figures, minimums and lead times." },
  { step: "03", title: "Place a trial order", body: "Start with 20 pieces on the styles that suit your customers, then grow from there." },
];

export default function BecomeAStockistPage() {
  return (
    <>
      <section className="bg-ink text-linen">
        <div className="wrap py-16 md:py-24">
          <p className="eyebrow text-saffron">Wholesale partnership</p>
          <h1 className="display mt-4 max-w-3xl text-4xl md:text-6xl">
            Sell Kivia Designs in your city
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-linen/75 md:text-lg">
            We manufacture kurtis, kurti pant sets, dupatta sets and co-ords in our own Ahmedabad
            workshop. If you run a shop or a boutique and are looking for a reliable wholesale
            supply, we would like to hear from you.
          </p>
        </div>
      </section>

      <section className="wrap py-16 md:py-24">
        <p className="eyebrow">Why stock with us</p>
        <h2 className="display mt-3 text-3xl md:text-4xl">Built on repeat orders</h2>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="border-t border-line pt-5">
              <h3 className="font-display text-xl text-ink">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-sand py-16 md:py-20">
        <div className="wrap">
          <p className="eyebrow">How it works</p>
          <h2 className="display mt-3 text-3xl md:text-4xl">Three steps to your first order</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step} className="bg-white p-6">
                <p className="font-display text-3xl text-clay">{s.step}</p>
                <h3 className="mt-3 font-display text-xl text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap py-16 md:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow">Apply</p>
          <h2 className="display mt-3 text-3xl md:text-4xl">Tell us about your shop</h2>
          <p className="mt-4 leading-relaxed text-ink-soft">
            Everything you send is kept on file and used only to prepare your rate card. We reply
            within one business day.
          </p>
        </div>

        <div className="mt-10">
          <StockistForm />
        </div>
      </section>
    </>
  );
}