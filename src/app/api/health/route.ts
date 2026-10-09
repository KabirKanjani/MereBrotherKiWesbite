import { NextResponse } from "next/server";

/**
 * A liveness check for the host.
 *
 * Render polls this to decide whether the service is healthy, and it doubles as a
 * quick way to confirm the database is actually reachable. It reports degraded
 * rather than failing outright when the CMS cannot be reached, so a temporary
 * database blip does not make Render kill and restart the app, which would make
 * the problem worse.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();

  try {
    const { getPayload } = await import("payload");
    const { default: config } = await import("@payload-config");

    const payload = await getPayload({ config });

    // A trivial real query proves the connection works. There is no portable
    // `ping` across Payload's database adapters, so this asks for one document.
    await payload.find({
      collection: "products",
      limit: 1,
      depth: 0,
      draft: false,
    });

    return NextResponse.json(
      {
        status: "ok",
        database: "connected",
        checkedInMs: Date.now() - started,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        database: "unreachable",
        message: error instanceof Error ? error.message : "unknown error",
      },
      // 200 so the platform does not restart the app over a transient outage.
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
}