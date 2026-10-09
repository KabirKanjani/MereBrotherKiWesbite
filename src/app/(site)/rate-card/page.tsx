import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wholesale Rate Card",
  description:
    "Download the Kivia Designs wholesale rate card: minimum order quantities, fabrics, sizes and indicative per-piece rates.",
  alternates: { canonical: "/rate-card" },
};

export const dynamic = "force-dynamic";

/**
 * The human-readable page in front of the PDF.
 *
 * A bare PDF link is awkward on a phone and gives a visitor no idea what they
 * are about to download. This explains what the document is and who it is for,
 * then hands over the file. Stockists are asked to identify themselves first,
 * which is how we know who to follow up with.
 */
export default function RateCardPage() {
  return (
    <>
      <section className="bg-ink text-linen">
        <div className="wrap py-16 md:py-24">
          <p className="eyebrow text-saffron">For stockists</p>
          <h1 className="display mt-4 max-w-3xl text-4xl md:text-6xl">Wholesale rate card</h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-linen/75 md:text-lg">
            Our current price list, with minimum order quantities, fabrics and the sizes we make
            each style in. Indicative per-piece rates are shown where we have them; anything marked
            on request is available, we just quote it to you directly.
          </p>
        </div>
      </section>

      <section className="wrap py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <h2 className="display text-3xl">Before you download</h2>
            <div className="mt-6 space-y-5 text-sm leading-relaxed text-ink-soft">
              <p>
                The rate card is a starting point for a conversation, not an offer. Final pricing
                depends on quantity, fabric and how quickly you need it, so we confirm everything
                in writing before you commit.
              </p>
              <p>
                If you are not stocking yet, the{" "}
                <a href="/become-a-stockist" className="text-clay underline">
                  stockist application
                </a>{" "}
                is the better first step — it takes a minute and gets you a reply within one
                business day.
              </p>
              <p>
                Anything on the card that is unclear, ask us. We would rather answer a question now
                than have a surprise at dispatch.
              </p>
            </div>

            <div className="mt-8 border border-line bg-sand p-6">
              <h3 className="font-display text-xl text-ink">Trading terms at a glance</h3>
              <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                {[
                  "20 pieces minimum per style",
                  "Prices are per piece, exclusive of GST",
                  "Lead time confirmed with each order",
                  "Alterations to measure available on request",
                  "Manufacturing to your own design and label",
                ].map((point) => (
                  <li key={point} className="flex gap-3">
                    <span className="text-clay">&mdash;</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border border-line bg-white p-8 md:p-10">
            <p className="eyebrow">Download</p>
            <h2 className="display mt-3 text-3xl">Get the PDF</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              Opens as a normal PDF you can save, print or forward inside your team.
            </p>

            <a
              href="/api/rate-card"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary mt-7"
            >
              Open the rate card
            </a>

            <div className="mt-8 border-t border-line pt-6">
              <h3 className="font-display text-lg text-ink">Need something not on it?</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Ask for a style we have not photographed, or for a fabric and quantity we have not
                listed. Most of what we make is off-inventory.
              </p>
              <a href="/enquiry" className="btn btn-outline mt-5">
                Ask for a quote
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}