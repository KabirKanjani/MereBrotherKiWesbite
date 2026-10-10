"use client";

import type { ReactNode } from "react";

/**
 * Repaints the admin panel in the shop's own colours.
 *
 * The two brand colours were read straight out of the logo file rather than
 * picked by eye: a purple (#6040a0) and a coral (#f08060). Payload builds its
 * panel out of CSS custom properties, so the whole theme is changed by
 * overriding those variables — no stylesheet surgery, and it survives a Payload
 * upgrade because only the variable names are relied on.
 *
 * Each brand colour gets a full nineteen-step ramp because Payload reads
 * different steps for buttons, hover states, borders and text, and a ramp that
 * collapses at one end produces unreadable hover states.
 */

const purple: Record<number, string> = {
  50: "#f8f7fa",
  100: "#e8e4f0",
  150: "#d7cee7",
  200: "#c4b6e2",
  250: "#b29fd9",
  300: "#9f88cf",
  350: "#8c6fc5",
  400: "#7654bb",
  450: "#6040a0",
  500: "#6040a0",
  550: "#583c91",
  600: "#503782",
  650: "#473172",
  700: "#3e2b62",
  750: "#342552",
  800: "#2b1f43",
  850: "#211833",
  900: "#171124",
  950: "#0e0a14",
};

const coral: Record<number, string> = {
  50: "#fbf7f6",
  100: "#f8ece8",
  150: "#f7ded7",
  200: "#f9cfc3",
  250: "#f8c1b2",
  300: "#f6b3a0",
  350: "#f4a48d",
  400: "#f29479",
  450: "#f08060",
  500: "#f08060",
  550: "#eb6b46",
  600: "#e6552b",
  650: "#d4451c",
  700: "#b43c1a",
  750: "#943317",
  800: "#742914",
  850: "#561f10",
  900: "#37150b",
  950: "#190a05",
};

const ramp = (name: string, scale: Record<number, string>) =>
  Object.entries(scale)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([step, hex]) => `--color-${name}-${step}: ${hex};`)
    .join("\n    ");

const css = `
  :root {
    /* Primary — the purple from the logo. Drives buttons, links and the active
       state of whatever you are looking at. */
    ${ramp("success", purple)}

    /* Secondary — the coral from the logo. Used for notices, tags and the
       warmer highlights. */
    ${ramp("warning", coral)}
    ${ramp("info", coral)}

    /* Errors stay red: a failed save should never be mistaken for a brand
       colour, and red-on-purple reads as a rendering fault. */
  }
`;

export default function ThemeProvider({ children }: { children?: ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </>
  );
}
