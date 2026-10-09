import type { Metadata } from "next";
import { getSettings } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Size Guide & Fabric Care",
  description:
    "Kurti size chart with chest, length, sleeve and shoulder measurements for S to 3XL, plus how to measure yourself and how to wash and store each fabric we use.",
  alternates: { canonical: "/size-guide" },
};

const sizeRows = [
  { size: "S", chest: "36 in", length: "40 in", shoulder: "15 in", sleeve: "21 in" },
  { size: "M", chest: "38 in", length: "41 in", shoulder: "15.5 in", sleeve: "21.5 in" },
  { size: "L", chest: "40 in", length: "42 in", shoulder: "16 in", sleeve: "22 in" },
  { size: "XL", chest: "42 in", length: "43 in", shoulder: "16.5 in", sleeve: "22.5 in" },
  { size: "XXL", chest: "44 in", length: "43.5 in", shoulder: "17 in", sleeve: "23 in" },
  { size: "3XL", chest: "46 in", length: "44 in", shoulder: "17.5 in", sleeve: "23.5 in" },
];

const fitNote = {
  chest: "Measured flat, across the chest, one inch below the armhole",
  length: "From the shoulder seam to the hem, on the finished garment",
  shoulder: "Seam to seam across the back",
  sleeve: "Shoulder seam to the cuff on a full sleeve",
};

const measuringSteps = [
  "Stand in front of a mirror with a soft measuring tape. Wear the kind of bra or inner you will wear under the kurti.",
  "For chest, wrap the tape around the fullest part of your bust and keep it level all the way around. Do not pull it tight.",
  "For length, measure from your shoulder down to where you want the hem to fall on a kurti. Wear the shoes you plan to wear.",
  "For shoulder, measure across the back from the edge of one shoulder bone to the other.",
  "For sleeve, measure from the shoulder seam down the arm to the wrist bone, with the arm slightly bent.",
];

const fabricCare = [
  {
    fabric: "Pure Cotton & Cotton Cambric",
    feel: "Breathable, matte, keeps its shape",
    wash: "Machine wash cold on a gentle cycle",
    dry: "Line dry in shade",
    iron: "Medium heat while slightly damp",
    avoid: "Do not bleach. Do not wring.",
  },
  {
    fabric: "Cotton Slub",
    feel: "Breathable with a textured slub finish",
    wash: "Machine wash cold, inside out",
    dry: "Line dry in shade",
    iron: "Medium heat on the reverse",
    avoid: "Do not use fabric softener, it fills the slub texture.",
  },
  {
    fabric: "Rayon",
    feel: "Soft, fluid, good drape",
    wash: "Machine wash cold, gentle cycle",
    dry: "Dry in shade, away from direct sun",
    iron: "Cool iron on the reverse",
    avoid: "Do not tumble dry. Do not bleach.",
  },
  {
    fabric: "Georgette",
    feel: "Crisp, sheer, lightweight",
    wash: "Hand wash cold or dry clean",
    dry: "Hang dry in shade",
    iron: "Low heat on the reverse, with a cloth",
    avoid: "Do not wring. Do not soak.",
  },
  {
    fabric: "Chanderi",
    feel: "Sheer, lustrous, soft rustle",
    wash: "Dry clean recommended",
    dry: "Dry in shade, never in direct sun",
    iron: "Low heat on the reverse",
    avoid: "Do not wring. Store folded in muslin, not plastic.",
  },
  {
    fabric: "Crepe",
    feel: "Matte, wrinkle resistant",
    wash: "Machine wash cold",
    dry: "Tumble dry low or line dry",
    iron: "Cool iron",
    avoid: "Do not bleach.",
  },
];

const storageTips = [
  "Hang full-length kurtis on padded hangers, not wire. Wire hangers stretch the shoulder and it never comes back.",
  "Fold heavier cotton and rayon rather than hanging them, to avoid stretching the side seams over time.",
  "Store chanderi and georgette folded in muslin cloth. Plastic bags trap moisture and yellow the fabric over time.",
  "Keep embroidered and sequin pieces folded, in a breathable cotton bag, away from direct sunlight.",
  "Wash a kurti once before storing it for a season. It sets the fabric and removes any starch from finishing.",
];

export default async function SizeGuidePage() {
  const site = await getSettings();
  return (
    <>
      <section className="border-b border-line bg-sand">
        <div className="wrap py-16 md:py-24">
          <p className="eyebrow">Size guide &amp; care</p>
          <h1 className="display mt-4 max-w-3xl text-4xl md:text-6xl">
            Get the size right the first time
          </h1>
          <p className="mt-6 max-w-2xl leading-relaxed text-ink-soft">
            Ordering from another city means you cannot try a kurti on before you commit. These are
            our actual measurements on the finished garment, not pattern dimensions. If you are
            between two sizes, or you want it graded to your measurements, message us &mdash; we
            alter to measure at no extra cost.
          </p>
        </div>
      </section>

      <section className="wrap py-16 md:py-24">
        <h2 className="display text-3xl md:text-4xl">Kurti size chart</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
          All measurements in inches. Lengths are for standard kurtis; specific designs are listed
          on their own page.
        </p>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[38rem] border-collapse bg-white text-left">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-ink">
                  Size
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-ink">
                  Chest
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-ink">
                  Length
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-ink">
                  Shoulder
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-ink">
                  Sleeve
                </th>
              </tr>
            </thead>
            <tbody>
              {sizeRows.map((r) => (
                <tr key={r.size} className="border-b border-line">
                  <td className="px-4 py-3 font-display text-lg text-clay">{r.size}</td>
                  <td className="px-4 py-3 text-sm text-ink">{r.chest}</td>
                  <td className="px-4 py-3 text-sm text-ink">{r.length}</td>
                  <td className="px-4 py-3 text-sm text-ink">{r.shoulder}</td>
                  <td className="px-4 py-3 text-sm text-ink">{r.sleeve}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          {Object.entries(fitNote).map(([key, note]) => (
            <div key={key}>
              <dt className="text-xs uppercase tracking-[0.14em] text-ink">{key}</dt>
              <dd className="text-sm text-ink-soft">{note}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 border-l-2 border-clay bg-sand p-6">
          <h3 className="font-display text-xl text-ink">Between two sizes?</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
            Kurti length matters more than chest for most of our designs, so going up in size
            usually makes it longer too. If you want the chest of one size and the length of
            another, tell us and we will cut it that way. Send a message on WhatsApp with your chest
            and height and we will tell you which size to pick.
          </p>
        </div>
      </section>

      <section className="bg-sand py-16 md:py-24">
        <div className="wrap">
          <div className="max-w-2xl">
            <p className="eyebrow">Measuring yourself</p>
            <h2 className="display mt-3 text-3xl md:text-4xl">
              Five steps, one soft tape
            </h2>
          </div>
          <ol className="mt-10 space-y-px bg-line">
            {measuringSteps.map((step, i) => (
              <li key={step} className="flex gap-5 bg-sand py-5">
                <span className="font-display text-2xl text-clay/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="max-w-3xl text-sm leading-relaxed text-ink-soft">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="wrap py-16 md:py-24">
        <p className="eyebrow">Fabric care</p>
        <h2 className="display mt-3 text-3xl md:text-4xl">
          How to wash each fabric we use
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Most kurti complaints come from washing everything the same way. A chanderi and a cotton
          crepe should never go through the same cycle.
        </p>

        <div className="mt-10 space-y-px bg-line">
          {fabricCare.map((f) => (
            <div key={f.fabric} className="bg-white p-6">
              <h3 className="font-display text-xl text-ink">{f.fabric}</h3>
              <p className="mt-1 text-sm text-ink-soft">{f.feel}</p>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Wash", f.wash],
                  ["Dry", f.dry],
                  ["Iron", f.iron],
                  ["Avoid", f.avoid],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[0.6875rem] uppercase tracking-[0.16em] text-clay">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm leading-relaxed text-ink-soft">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-sand py-16 md:py-24">
        <div className="wrap">
          <div className="max-w-2xl">
            <p className="eyebrow">Storage</p>
            <h2 className="display mt-3 text-3xl md:text-4xl">
              Making a kurti last
            </h2>
          </div>
          <ul className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {storageTips.map((tip) => (
              <li key={tip} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                <span className="mt-2 h-px w-3 shrink-0 bg-clay" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="wrap py-16 md:py-24">
        <div className="grid gap-8 border border-line bg-white p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10">
          <div>
            <h2 className="display text-2xl md:text-3xl">Still unsure?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
              Send us your chest, waist and height on WhatsApp, or call us. We will tell you which
              size to order, or we will grade it to your measurements.
            </p>
          </div>
          <a
            href={`tel:${site.phone}`}
            className="btn btn-primary justify-self-start md:justify-self-end"
          >
            Call {site.phone}
          </a>
        </div>
      </section>
    </>
  );
}