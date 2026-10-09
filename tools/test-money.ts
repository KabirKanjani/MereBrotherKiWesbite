/**
 * Tests for the money helpers.
 *
 * Money is the one area on this site where a silent bug is expensive, so these
 * are worth having as an actual runnable check rather than something to eyeball.
 *
 * Run with: node --import tsx tools/test-money.ts
 */

import { discountPaise, formatPaise, groupIndian, sumPaise, toPaise } from "../src/lib/money";

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(
    `  [${ok ? "PASS" : "FAIL"}] ${label}${ok ? "" : ` — got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`}`,
  );
}

console.log("Conversion to paise:");
check("whole rupees", toPaise(1280), 128000);
check("rupees with paise", toPaise(1280.5), 128050);
check("string with comma", toPaise("1,280.50"), 128050);
check("string with currency symbol", toPaise("₹1,280.50"), 128050);
check("already paise", toPaise(128050, true), 128050);
check("empty string", toPaise(""), 0);
check("undefined", toPaise(undefined), 0);
check("null", toPaise(null), 0);
check("garbage becomes zero, not NaN", toPaise("abc"), 0);
check("NaN input becomes zero", toPaise(NaN), 0);
check("negative", toPaise(-50.25), -5025);

console.log("\nThe floating point trap:");
// The classic failure: 0.1 + 0.2 !== 0.3 in binary floating point.
const a = 0.1 + 0.2;
check("0.1 + 0.2 !== 0.3 in floats", a !== 0.3, true);
// The float sum is 0.30000000000000004. Scaled to paise and rounded, it lands on
// exactly 30 paise, which is 30 paise rather than 30.000000000000004.
check("but in paise it rounds to exactly 30", toPaise(a), 30);
check(
  "0.30 rupees formatted is the correct amount",
  formatPaise(toPaise(a)),
  "₹0.30",
);
check(
  "1000 lines of 12.85 total exactly",
  sumPaise(Array.from({ length: 1000 }, () => toPaise(12.85))),
  1285000,
);

console.log("\nFormatting:");
check("simple", formatPaise(128500), "₹1,285.00");
check("Indian grouping", formatPaise(12345678), "₹1,23,456.78");
check("paise part", formatPaise(5), "₹0.05");
check("zero", formatPaise(0), "₹0.00");
check("negative", formatPaise(-5025), "-₹50.25");
check("no currency symbol", formatPaise(128500).replace("₹", ""), "1,285.00");

console.log("\nGrouping:");
check("three digits", groupIndian(285), "285");
check("four digits", groupIndian(1285), "1,285");
check("six digits", groupIndian(123456), "1,23,456");
check("seven digits", groupIndian(1234567), "12,34,567");
check("crore", groupIndian(12345678), "1,23,45,678");

console.log("\nDiscounts and totals:");
check("10% of 100000", discountPaise(100000, 10), 10000);
check("12.5% of 99999 rounds to whole paise", discountPaise(99999, 12.5), 12500);
check("zero percent", discountPaise(100000, 0), 0);
check("sum is exact", sumPaise([1, 2, 3, 4, 5]), 15);
check("sum ignores non-numbers", sumPaise([100, NaN, 200]), 300);
check("sum of empty is zero", sumPaise([]), 0);

console.log(failures === 0 ? "\nAll money checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);