"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { DefaultCellComponentProps } from "payload";

/**
 * Moves a style up or down the list without opening it.
 *
 * The alternative is typing an order number into a field, which is invisible
 * logic — a number nobody can reason about, where 1 means "first" and two rows
 * sharing a number have no defined order. Buttons that swap a style with its
 * neighbour show what will happen before it happens.
 *
 * Deliberately buttons rather than drag and drop: this is used on a phone as
 * often as a laptop, and dragging rows is unreliable on touch screens.
 */
export default function ReorderCell({ rowData, collectionSlug }: DefaultCellComponentProps) {
  const slug = typeof collectionSlug === "string" ? collectionSlug : "products";
  const router = useRouter();
  const [busy, setBusy] = useState<"up" | "down" | null>(null);
  const [message, setMessage] = useState<string>("");

  const move = useCallback(
    async (direction: "up" | "down") => {
      setBusy(direction);
      setMessage("");

      try {
        const response = await fetch(
          `/api/${slug}?where[sortOrder][asc]=true&limit=200&draft=true&depth=0`,
          { credentials: "same-origin" },
        );
        if (!response.ok) throw new Error(`Could not load the list (${response.status})`);

        const { docs } = await response.json();
        const id = rowData?.id;
        const index = docs.findIndex((d: { id: unknown }) => d.id === id);
        if (index === -1) throw new Error("This style is not in the list.");

        const target = direction === "up" ? index - 1 : index + 1;
        if (target < 0 || target >= docs.length) {
          setMessage(direction === "up" ? "Already at the top." : "Already at the bottom.");
          setBusy(null);
          return;
        }

        const current = docs[index];
        const neighbour = docs[target];

        /*
         * Order values are swapped rather than renumbered wholesale. Only two
         * rows change, so nothing else in the list can be disturbed.
         */
        const currentOrder = typeof current.sortOrder === "number" ? current.sortOrder : index;
        const neighbourOrder =
          typeof neighbour.sortOrder === "number" ? neighbour.sortOrder : target;

        // Equal values would make the swap a no-op, so nudge them apart.
        const nextCurrent = currentOrder === neighbourOrder ? currentOrder - 0.5 : neighbourOrder;
        const nextNeighbour = currentOrder === neighbourOrder ? neighbourOrder + 0.5 : currentOrder;

        for (const [doc, sortOrder] of [
          [current, nextCurrent],
          [neighbour, nextNeighbour],
        ] as const) {
          const res = await fetch(`/api/${slug}/${doc.id}`, {
            method: "PATCH",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder }),
          });
          if (!res.ok) throw new Error(`Could not save (${res.status})`);
        }

        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Something went wrong.");
      } finally {
        setBusy(null);
      }
    },
    [rowData, router, slug],
  );

  const buttonStyle = (disabled: boolean) => ({
    border: "1px solid var(--theme-elevation-400)",
    background: "var(--theme-elevation-50)",
    color: "var(--theme-elevation-800)",
    borderRadius: "3px",
    padding: "0.25rem 0.5rem",
    lineHeight: 1,
    cursor: disabled ? "wait" : "pointer",
    opacity: disabled ? 0.5 : 1,
    minWidth: "2rem",
  });

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={() => move("up")}
        disabled={busy !== null}
        aria-label="Move this style up"
        title="Move up"
        style={buttonStyle(busy !== null)}
      >
        ↑
      </button>
      <button
        type="button"
        onClick={() => move("down")}
        disabled={busy !== null}
        aria-label="Move this style down"
        title="Move down"
        style={buttonStyle(busy !== null)}
      >
        ↓
      </button>
      {busy ? <span style={{ fontSize: "0.75rem" }}>Moving…</span> : null}
      {message ? (
        <span style={{ fontSize: "0.75rem", color: "var(--theme-error-500)" }}>{message}</span>
      ) : null}
    </span>
  );
}