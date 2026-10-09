import type { CollectionConfig } from "payload";

/**
 * One stage of making an order, assigned to one person.
 *
 * This is the record the factory floor actually needs, and it is designed for a
 * phone held in one hand: few fields, whole numbers, and a status that is set by
 * tapping rather than typing.
 *
 * A kurti goes through the same stages every time, so the stage list is fixed
 * rather than free text. That is what makes "where is this order" answerable
 * without asking anyone.
 */
export const ProductionTasks: CollectionConfig = {
  slug: "production-tasks",
  labels: {
    singular: "Production job",
    plural: "Production jobs",
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  admin: {
    useAsTitle: "stage",
    defaultColumns: ["order", "stage", "assignedTo", "piecesDone", "piecesTarget", "status", "dueDate"],
    group: "Production",
    description:
      "Each step of making an order, who is doing it, and how many pieces are done.",
    listSearchableFields: ["stage", "notes", "order"],
  },
  fields: [
    {
      name: "order",
      type: "relationship",
      relationTo: "orders",
      required: true,
      index: true,
    },
    {
      name: "stage",
      type: "select",
      required: true,
      index: true,
      defaultValue: "cutting",
      options: [
        { label: "1. Cutting", value: "cutting" },
        { label: "2. Stitching", value: "stitching" },
        { label: "3. Embroidery / surface work", value: "embroidery" },
        { label: "4. Finishing and ironing", value: "finishing" },
        { label: "5. Quality check", value: "qc" },
        { label: "6. Packing", value: "packing" },
      ],
      admin: { description: "Which step this is." },
    },
    {
      name: "assignedTo",
      type: "relationship",
      relationTo: "team",
      admin: { description: "Who is doing it. Tap the person on your phone." },
    },
    {
      type: "row",
      fields: [
        {
          name: "piecesTarget",
          type: "number",
          required: true,
          min: 0,
          admin: { description: "How many pieces this stage covers." },
        },
        {
          name: "piecesDone",
          type: "number",
          defaultValue: 0,
          min: 0,
          admin: {
            description: "How many are finished. Just type the number — no minus signs.",
          },
        },
      ],
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending",
      index: true,
      options: [
        { label: "Not started", value: "pending" },
        { label: "Working on it", value: "in-progress" },
        { label: "Finished", value: "done" },
        { label: "Stuck — needs help", value: "blocked" },
      ],
      admin: { description: "Tap to change. This is the only thing the floor needs." },
    },
    {
      type: "row",
      fields: [
        { name: "startedOn", type: "date" },
        { name: "completedOn", type: "date" },
        { name: "dueDate", type: "date", index: true, admin: { description: "When this stage should be finished." } },
      ],
    },
    {
      name: "blockedReason",
      type: "text",
      admin: {
        condition: (data) => data?.status === "blocked",
        description: "Only shown when the job is marked stuck.",
      },
    },
    {
      name: "notes",
      type: "textarea",
      admin: { description: "Measurements, trims, matching shade numbers, anything unusual." },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data) return data;
        const done = Math.max(0, Math.round(Number(data.piecesDone) || 0));
        const target = Math.max(0, Math.round(Number(data.piecesTarget) || 0));

        // Someone working cannot also be stuck, and a finished job gets its date
        // filled in. Saves the floor from having to set both by hand.
        const status =
          data.status === "done" && done < target ? "in-progress" : data.status;

        return {
          ...data,
          piecesDone: done,
          piecesTarget: target,
          status,
          completedOn: status === "done" ? (data.completedOn ?? new Date().toISOString()) : null,
        };
      },
    ],
  },
};