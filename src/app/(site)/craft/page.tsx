import type { Metadata } from "next";
import { generalWhatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Our Craft — Fabric, Stitching and Quality",
  description:
    "How Kivia Designs makes kurtis in Ahmedabad: direct mill sourcing, graded patterns, in-house stitching and a final inspection on every single unit.",
  alternates: { canonical: "/craft" },
};

const stages = [
  {
    n: "01",
    title: "Buying fabric directly",
    body: "We buy from Ahmedabad and Surat mills ourselves rather than through agents. It means we know what the fabric actually is, we can reorder the same quality months later, and there is no broker margin hiding in your price.",
  },
  {
    n: "02",
    title: "Washing fabric first",
    body: "Fabric is washed before cutting. Unwashed fabric shrinks in the first wash, and that shrinkage is what makes cheap kurtis end up too short after two washes. We do not cut from unwashed stock.",
  },
  {
    n: "03",
    title: "Grading every size",
    body: "One pattern is graded across the whole size range, from S to 3XL, before cutting begins. This is why our XXL drapes properly instead of looking like a scaled-up S. If you send measurements, we grade to you.",
  },
  {
    n: "04",
    title: "Cutting in batches",
    body: "We cut in small batches per size rather than cutting everything at once, so a size mix does not sit in the shelf for months waiting for the other sizes to sell.",
  },
  {
    n: "05",
    title: "In-house stitching",
    body: "Stitching, embroidery and finishing are all done in our own workshop. Our operators are on a fixed team, not rotating contract labour, so the quality does not depend on who is on shift.",
  },
  {
    n: "06",
    title: "Finishing and pressing",
    body: "Faying seams, adding labels, trimming every thread, ironing and folding. Untrimmed thread and unironed creases are the two things that make a kurti look mass-made, so they are the two things we never skip.",
  },
  {
    n: "07",
    title: "Final inspection",
    body: "Every unit is checked before it is folded: seams, stitching, length, colour matching against the batch, and ironing. If a piece fails it does not get packed.",
  },
  {
    n: "08",
    title: "Packed and shipped",
    body: "Folded with a tissue wrap and dispatched from Ahmedabad. Same piece, same finish as the one on our store counter.",
  },
];

const qualityChecks = [
  {
    title: "Fabric weight",
    body: "We check GSM by hand and against a spec sheet. A fabric that feels fine at the counter can feel thin in real daylight, so weight is verified before it reaches cutting.",
  },
  {
    title: "Shrinkage test",
    body: "Cut swatches are washed before the main run. If a fabric moves more than we allow, we reject the lot rather than pass the problem on to you.",
  },
  {
    title: "Seam strength",
    body: "Seams are checked by pulling. Kurtis fail at the armhole and the side seam, so those are the two we test hardest.",
  },
  {
    title: "Colour consistency",
    body: "Every piece in a batch is matched against the approved sample under daylight, so a set of three does not arrive in three slightly different shades.",
  },
  {
    title: "Length accuracy",
    body: "Length is measured on the finished piece, not estimated from the pattern. A 42 inch kurti will measure 42 inches.",
  },
  {
    title: "Thread and pressing",
    body: "Thread trimming and final pressing are on the checklist, not optional. It is the least glamorous part of making a kurti and the most visible difference.",
  },
];

export default function CraftPage() {
  return (
    <>
      <section className="border-b border-line bg-sand">
        <div className="wrap py-16 md:py-24">
          <p className="eyebrow">Our craft</p>
          <h1 className="display mt-4 max-w-3xl text-4xl md:text-6xl">
            The difference is a manufacturer, not a reseller
          </h1>
          <p className="mt-6 max-w-2xl leading-relaxed text-ink-soft">
            Most kurtis sold online were not made by the people selling them. They were made in a
            factory, traded through a wholesale market, then bought and relabelled by a shop that
            has never seen the fabric. We make ours. This page explains exactly what that changes,
            because when you order from another city you cannot hold the fabric in your hand and
            judge it yourself.
          </p>
        </div>
      </section>

      <section className="wrap py-16 md:py-24">
        <p className="eyebrow">The process</p>
        <h2 className="display mt-3 text-3xl md:text-4xl">
          Eight steps from mill to folded kurti
        </h2>

        <div className="mt-12 space-y-px bg-line">
          {stages.map((s) => (
            <div key={s.n} className="grid gap-3 bg-linen py-7 md:grid-cols-[6rem_1fr_1.3fr] md:gap-8">
              <span className="font-display text-3xl text-clay/35">{s.n}</span>
              <h3 className="font-display text-xl text-ink md:pt-1">{s.title}</h3>
              <p className="text-sm leading-relaxed text-ink-soft">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-sand py-16 md:py-24">
        <div className="wrap">
          <div className="max-w-2xl">
            <p className="eyebrow">Quality control</p>
            <h2 className="display mt-3 text-3xl md:text-4xl">
              Six checks before anything is packed
            </h2>
            <p className="mt-5 leading-relaxed text-ink-soft">
              These are the specific things we check. We list them because you cannot see them in a
              product photo, and because you should be able to ask us about any of them.
            </p>
          </div>

          <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {qualityChecks.map((c) => (
              <div key={c.title} className="border-t border-line pt-5">
                <h3 className="font-display text-lg text-ink">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap py-16 md:py-24">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="display text-3xl md:text-4xl">What we will not claim</h2>
            <p className="mt-5 leading-relaxed text-ink-soft">
              Being straight with you matters more than sounding impressive. So, plainly: we are a
              kurti workshop, not a luxury label. Our strength is cotton, rayon, georgette and
              chanderi kurtis made well at a fair price, from single pieces up to bulk runs. We do
              not do heavy designer couture, and we do not pretend our georgette is imported.
            </p>
            <p className="mt-4 leading-relaxed text-ink-soft">
              We also will not quote a price we cannot hold. If fabric costs move between when you
              message and when we confirm, we tell you before you pay, not after.
            </p>
          </div>

          <div>
            <h2 className="display text-3xl md:text-4xl">Ask us anything</h2>
            <p className="mt-5 leading-relaxed text-ink-soft">
              If you are ordering from another city and something is not covered on this site,
              message us before you order. Ask for a video call, ask for the fabric GSM, ask for a
              photo of the actual piece, or ask us to grade to your measurements. We would rather
              answer a question now than deal with a return later.
            </p>
            <a href={generalWhatsappUrl()} className="btn btn-primary mt-7">
              Ask on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}