import Link from "next/link";
import { getOpsSummary } from "@/lib/operations";
import { formatPaise } from "@/lib/money";

/**
 * The money and production figures on the admin dashboard.
 *
 * Ordered by what costs the shop money when it is wrong. Outstanding balance
 * comes first, then anything overdue, then stock that has run out, then the
 * factory floor. Catalogue counts sit last because they are the least urgent
 * thing on this screen.
 *
 * Every figure here is derived from the movements and payments at read time
 * rather than stored, so none of it can drift out of date.
 */

const cardStyle = {
  display: "block" as const,
  padding: "0.9rem 1rem",
  border: "1px solid var(--theme-elevation-150)",
  borderRadius: "4px",
  background: "var(--theme-elevation-50)",
  textDecoration: "none",
  color: "inherit",
};

const base = "/admin/collections";

export default async function OpsOverview() {
  const s = await getOpsSummary();

  const money = (
    label: string,
    value: number,
    href: string,
    tone?: string,
    caption?: string,
  ) => (
    <Link key={label} href={href} style={cardStyle}>
      <div style={{ fontSize: "1.6rem", fontWeight: 500, color: tone, lineHeight: 1.2 }}>
        {value}
      </div>
      <div
        style={{
          fontSize: "0.6875rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginTop: "0.35rem",
        }}
      >
        {label}
      </div>
      {caption ? (
        <div style={{ fontSize: "0.75rem", opacity: 0.65, marginTop: "0.25rem" }}>{caption}</div>
      ) : null}
    </Link>
  );

  const count = (
    label: string,
    value: number,
    href: string,
    tone?: string,
    caption?: string,
  ) => money(label, value, href, tone, caption);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Orders and money</h2>
        <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem", opacity: 0.7 }}>
          What buyers owe you, worked out from what has actually been received.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: "0.75rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        }}
      >
        {money(
          "Outstanding",
          s.liveOrderCount,
          `${base}/orders`,
          s.outstandingPaise > 0 ? "var(--theme-success-450)" : undefined,
          `${formatPaise(s.outstandingPaise)} across ${s.liveOrderCount} live order(s)`,
        )}
        {count(
          s.overdueCount > 0 ? "Overdue" : "Overdue",
          s.overdueCount,
          `${base}/orders`,
          s.overdueCount > 0 ? "var(--theme-error-500)" : undefined,
          s.overdueCount > 0 ? `${formatPaise(s.overdueValuePaise)} past the promised date` : "Nothing late",
        )}
        {count(
          "Buyers",
          s.buyerCount,
          `${base}/buyers`,
          undefined,
          "Active accounts",
        )}
      </div>

      <div>
        <h2 style={{ margin: "0 0 0.35rem", fontSize: "1.25rem" }}>Stock and production</h2>
        <div
          style={{
            display: "grid",
            gap: "0.75rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          }}
        >
          {count(
            "Out of stock",
            s.outOfStock,
            `${base}/stock-movements`,
            s.outOfStock > 0 ? "var(--theme-error-500)" : undefined,
            "Cannot promise a delivery date",
          )}
          {count(
            "Running low",
            s.lowStock,
            `${base}/stock-movements`,
            s.lowStock > 0 ? "var(--theme-success-450)" : undefined,
            "Under ten pieces",
          )}
          {count(
            "Jobs running",
            s.jobsInProgress,
            `${base}/production-tasks`,
            undefined,
            "On the floor now",
          )}
          {count(
            s.jobsBlocked > 0 ? "Stuck" : "Stuck",
            s.jobsBlocked,
            `${base}/production-tasks`,
            s.jobsBlocked > 0 ? "var(--theme-error-500)" : undefined,
            "Needs someone to unblock",
          )}
          {count(
            "Late jobs",
            s.jobsLate,
            `${base}/production-tasks`,
            s.jobsLate > 0 ? "var(--theme-error-500)" : undefined,
            "Past their due date",
          )}
        </div>
      </div>

      {(s.overdueCount > 0 || s.jobsBlocked > 0 || s.outOfStock > 0) && (
        <p
          style={{
            margin: 0,
            fontSize: "0.875rem",
            borderLeft: "3px solid var(--theme-success-450)",
            paddingLeft: "0.85rem",
          }}
        >
          {[
            s.overdueCount > 0
              ? `${s.overdueCount} order(s) are past their promised date and ${formatPaise(s.overdueValuePaise)} is unpaid`
              : null,
            s.jobsBlocked > 0 ? `${s.jobsBlocked} production job(s) are marked stuck` : null,
            s.outOfStock > 0 ? `${s.outOfStock} style or size has run out` : null,
          ]
            .filter(Boolean)
            .join(". ")}
          .
        </p>
      )}

      {s.liveOrderCount === 0 && s.jobsInProgress === 0 && (
        <p style={{ margin: 0, fontSize: "0.875rem", opacity: 0.75 }}>
          Nothing in progress yet. Add a buyer under Orders → Buyers, then raise an order.
        </p>
      )}
    </div>
  );
}