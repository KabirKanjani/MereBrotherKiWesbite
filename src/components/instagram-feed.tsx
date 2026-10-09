import Link from "next/link";
import type { SocialPost } from "@/lib/cms";

/**
 * A strip of recent Instagram posts.
 *
 * The photos are managed in the admin rather than pulled live, because the
 * Instagram API needs a linked business account and a token that expires, and
 * scraping breaks whenever the markup changes. Entered posts cannot break the
 * page and staff decide exactly what a first-time visitor sees.
 */
export default function InstagramFeed({
  posts,
  handle,
  url,
}: {
  posts: SocialPost[];
  handle: string;
  url: string;
}) {
  if (!posts.length) return null;

  return (
    <section className="wrap py-20 md:py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">From Instagram</p>
          <h2 className="display mt-3 text-3xl md:text-4xl">Newest on the floor</h2>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs uppercase tracking-[0.16em] text-clay transition-colors hover:text-clay-dark"
        >
          Follow @{handle} &rarr;
        </a>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {posts.map((post) => (
          <a
            key={post.id}
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block aspect-square overflow-hidden bg-sand"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.image}
              alt={post.caption || `Post from ${handle} on Instagram`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
            {post.caption ? (
              <span className="absolute inset-x-0 bottom-0 translate-y-full bg-ink/85 px-3 py-2 text-[0.6875rem] leading-snug text-linen transition-transform duration-300 group-hover:translate-y-0">
                {post.caption}
              </span>
            ) : null}
          </a>
        ))}
      </div>

      <p className="mt-6 text-xs text-ink-soft">
        Tag us in your store photos and we will repost.{" "}
        <Link href="/enquiry" className="text-clay underline">
          Get in touch
        </Link>{" "}
        if you would like a wholesale partnership.
      </p>
    </section>
  );
}