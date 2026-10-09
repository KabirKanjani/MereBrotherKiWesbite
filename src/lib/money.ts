/**
 * Money handling for the operations side of the app.
 *
 * Every amount in the database is a whole number of paise. Rupees are never
 * stored as decimals, and never as floats.
 *
 * The reason is specific. 0.1 + 0.2 is not 0.3 in binary floating point, and a
 * running total over a few hundred order lines drifts. On a marketing site a
 * one-paisa error is invisible; on an invoice it means the figure in the system
 * does not match the figure in the bank, and nobody can reconcile it.
 *
 * So: integers in, integers out, and formatting happens only at the moment a
 * figure is shown to a person.
 */

/** Paise in a rupee. */
export const PAISE = 100;

/** Largest amount we will accept, to catch a mistyped figure early. */
const MAX_PAISE = 1_000_000_000_00; // 1 crore rupees

/**
 * Converts whatever a form or the API gave us into whole paise.
 *
 * Accepts a number of rupees (1280.5), a string ("1280.50"), or a value already
 * in paise when `alreadyPaise` is set. Anything unparseable becomes 0 rather
 * than NaN, because NaN in a total silently poisons every sum it touches.
 */
export function toPaise(input: unknown, alreadyPaise = false): number {
  if (input === null || input === undefined || input === "") return 0;

  const value = typeof input === "string" ? Number(input.replace(/[^\d.-]/g, "")) : Number(input);

  if (!Number.isFinite(value)) return 0;

  const paise = alreadyPaise ? Math.round(value) : Math.round(value * PAISE);

  if (Math.abs(paise) > MAX_PAISE) {
    throw new RangeError(
      `Amount ${value} is out of range. If this is meant to be paise, it is far too large.`,
    );
  }

  return paise;
}

/**
 * Renders paise as a rupee string, using the Indian numbering system.
 *
 * 128500 -> "₹1,285.00", 12345678 -> "₹1,23,456.78"
 */
export function formatPaise(paise: number): string {
  if (!Number.isFinite(paise)) return "₹0.00";

  const negative = paise < 0;
  const abs = Math.abs(Math.round(paise));

  const rupees = Math.floor(abs / PAISE);
  const paisePart = abs % PAISE;

  const grouped = groupIndian(rupees);

  return `${negative ? "-" : ""}₹${grouped}.${String(paisePart).padStart(2, "0")}`;
}

/** Formats without the currency symbol, for filling a PDF table cell. */
export function formatPaisePlain(paise: number): string {
  return formatPaise(paise).replace("₹", "");
}

/** 1234567 -> "12,34,567" */
export function groupIndian(n: number): string {
  const s = String(Math.trunc(n));
  if (s.length <= 3) return s;

  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${last3}`;
}

/**
 * Percentage discount in paise, rounded to the nearest paisa.
 *
 * Used by orders so a 12.5% discount on an odd amount still lands on a whole
 * paisa rather than a fraction nobody can enter again.
 */
export function discountPaise(subtotalPaise: number, percent: number): number {
  if (!percent) return 0;
  return Math.round((subtotalPaise * percent) / 100);
}

/** Guard against a negative invoice caused by a mistyped discount. */
export function clampNonNegative(paise: number): number {
  return paise < 0 ? 0 : paise;
}

/**
 * Total of a set of line totals. Uses a reducer over integers so the result is
 * exact regardless of how many lines there are.
 */
export function sumPaise(values: number[]): number {
  return values.reduce<number>((total, v) => total + (Number.isFinite(v) ? Math.round(v) : 0), 0);
}