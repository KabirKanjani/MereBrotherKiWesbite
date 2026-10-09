import Link from "next/link";
import { getProductionJobs } from "@/lib/operations";
import type { ProductionJob } from "@/lib/operations";

/**
 * The factory-floor job board.
 *
 * Built for a phone held in one hand: one tap per stage, big targets, and no
 * typing to mark progress. The numbers are the ones someone on the floor
 * actually needs — which order, which step, how many pieces, how many done.
 *
 * Colour is never the only signal: every state is also written out, because a
 * red and green pair is no use at all to someone colour blind.
 */

const STAGE_ORDER = ["cutting", "stitching", "embroidery", "finishing", "qc", "packing"];

const STAGE_ACCENT: Record<string, string> = {
  cutting: "#9c4a28",
  stitching: "#7a3819",
  embroidery: "#6e1b2e",
  finishing: "#c79a3c",
  qc: "#4a4038",
  packing: "#1b1512",
};

function statusLine(job: ProductionJob): { label: string; colour?: string } {
  if (job.status === "blocked") return { label: "Stuck", colour: "#a3352a" };
  if (job.isLate) return { label: "Late", colour: "#a3352a" };
  if (job.status === "done") return { label: "Finished" };
  if (job.status === "in-progress") return { label: "Working on it" };
  return { label: "Not started" };
}

export default async function JobBoard() {
  const jobs = await getProductionJobs();

  const active = jobs.filter((j) => j.status !== "done");
  const done = jobs.filter((j) => j.status === "done");

  if (jobs.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Factory floor</h2>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem", opacity: 0.7 }}>
            What is being made, and how far along it is.
          </p>
        </div>
        <p style={{ margin: 0, fontSize: "0.875rem" }}>
          No jobs yet. Open an order, then add a production job for each step: cutting, stitching,
          embroidery, finishing, quality check and packing.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Factory floor</h2>
        <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem", opacity: 0.7 }}>
          {active.length} job(s) in progress, {done.length} finished.
        </p>
      </div>

      {STAGE_ORDER.map((stage) => {
        const stageJobs = jobs.filter((j) => j.stage === stage);
        if (!stageJobs.length) return null;

        return (
          <div key={stage}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
              }}
            >
              <span
                style={{
                  width: "0.65rem",
                  height: "0.65rem",
                  borderRadius: "9999px",
                  background: STAGE_ACCENT[stage],
                  flexShrink: 0,
                }}
              />
              <h3
                style={{
                  margin: 0,
                  fontSize: "0.75rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {stageJobs[0].stageLabel}
              </h3>
              <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>
                ({stageJobs.filter((j) => j.status === "done").length}/{stageJobs.length})
              </span>
            </div>

            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "grid",
                gap: "0.4rem",
              }}
            >
              {stageJobs.map((job) => {
                const state = statusLine(job);
                const pct = job.piecesTarget
                  ? Math.min(100, Math.round((job.piecesDone / job.piecesTarget) * 100))
                  : 0;

                return (
                  <li key={job.id}>
                    <Link
                      href={`/admin/collections/production-tasks/${job.id}`}
                      style={{
                        display: "block",
                        padding: "0.85rem 1rem",
                        border: "1px solid var(--theme-elevation-150)",
                        borderLeft: `3px solid ${state.colour ?? "var(--theme-elevation-300)"}`,
                        borderRadius: "3px",
                        background: "var(--theme-elevation-50)",
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "0.75rem",
                          alignItems: "baseline",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>{job.orderNumber}</span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            color: state.colour,
                          }}
                        >
                          {state.label}
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: "0.4rem",
                          fontSize: "0.8125rem",
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "0.75rem",
                        }}
                      >
                        <span>{job.assignedTo ?? "Not assigned"}</span>
                        <span style={{ whiteSpace: "nowrap" }}>
                          {job.piecesDone} / {job.piecesTarget} pieces
                        </span>
                      </div>

                      {/* Progress bar. The numbers above are the real signal; this
                          is only there so a glance shows where the gap is. */}
                      <div
                        aria-hidden="true"
                        style={{
                          marginTop: "0.5rem",
                          height: "4px",
                          borderRadius: "9999px",
                          background: "var(--theme-elevation-200)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background:
                              job.status === "blocked"
                                ? "var(--theme-error-500)"
                                : "var(--theme-success-500)",
                          }}
                        />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}