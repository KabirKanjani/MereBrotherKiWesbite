import type { Metadata } from "next";
import Link from "next/link";
import { getSeasons, getSettings } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: `Seasons | ${settings.name}`,
    description:
      "Browse our seasonal ranges — festival collections, festive edits and everyday co-ords, all made in our Ahmedabad workshop.",
    alternates: { canonical: "/seasons" },
  };
}

export default async function SeasonsPage() {
  const seasons = await getSeasons();

  return (
    <>
      <section className="bg-ink text-linen">
        <div className="wrap py-16 md:py-24">
          <p className="eyebrow text-saffron">Ranges</p>
          <h1 className="display mt-4 max-w-3xl text-4xl md:text-6xl">Seasons</h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-linen/75 md:text-lg">
            Each range is photographed as it comes off the floor. Pick a season to see what is in
            it, or ask us for the catalogue.
          </p>
        </div>
      </section>

      <section className="wrap py-14 md:py-20">
        {seasons.length === 0 ? (
          <div className="max-w-2xl">
            <p className="leading-relaxed text-ink-soft">
              We are putting the current season together. Everything we make right now is on the{" "}
              <Link href="/collection" className="text-clay underline">
                collection page
              </Link>
              , and new ranges appear here first.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {seasons.map((s) => (
              <Link
                key={s.id}
                href={`/seasons/${s.slug}`}
                className="group relative flex min-h-[18rem] flex-col justify-end overflow-hidden bg-ink p-7"
              >
                {s.heroImage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.heroImage}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
                  </>
                ) : null}

                <div className="relative">
                  {s.seasonLabel ? (
                    <p className="text-[0.6875rem] uppercase tracking-[0.22em] text-saffron">
                      {s.seasonLabel}
                    </p>
                  ) : null}
                  <h2 className="display mt-2 text-3xl text-linen">{s.title}</h2>
                  {s.summary ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-linen/70">
                      {s.summary}
                    </p>
                  ) : null}
                  <span className="mt-4 inline-block text-xs uppercase tracking-[0.16em] text-saffron">
                    View range &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-16 border border-line bg-sand p-8 text-center md:p-12">
          <h2 className="display text-3xl md:text-4xl">Want the wholesale catalogue?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-soft">
            We send the current season catalogue and rate card to stockists. It takes one message.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/become-a-stockist" className="btn btn-primary">
              Become a stockist
            </Link>
            <Link href="/enquiry" className="btn btn-outline">
              Ask for the catalogue
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}