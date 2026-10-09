import Link from "next/link";
import { generalWhatsappUrl } from "@/lib/whatsapp";

export default function NotFound() {
  return (
    <div className="wrap flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display mt-4 text-4xl md:text-6xl">This page does not exist</h1>
      <p className="mt-5 max-w-md leading-relaxed text-ink-soft">
        The link may be old, or the style may have been moved. Try the collection instead, or ask us
        directly.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/collection" className="btn btn-primary">
          Browse the collection
        </Link>
        <a href={generalWhatsappUrl()} className="btn btn-outline">
          WhatsApp us
        </a>
      </div>
    </div>
  );
}