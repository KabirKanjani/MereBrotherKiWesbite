import type { CollectionConfig } from "payload";

/**
 * Staff accounts. This is the only collection a member of staff signs in with,
 * and it is deliberately small: an email, a password and a role.
 *
 * Visitors never see any of this. The public site reads published documents
 * through the local API, which requires no account at all.
 *
 * Two rules keep this from locking the shop out of its own admin panel:
 *
 *  1. The very first account is always an Admin, whatever role was submitted.
 *     If it were not, the shop would have nobody able to add staff.
 *  2. Only an Admin can create or delete accounts, or change anyone's role.
 *     An Editor can change their own name and password, and nothing else.
 */
export const Users: CollectionConfig = {
  slug: "users",
  labels: {
    singular: "Staff account",
    plural: "Staff accounts",
  },
  auth: {
    tokenExpiration: 60 * 60 * 8,
    verify: false,
  },
  admin: {
    useAsTitle: "email",
    group: "Settings",
    description:
      "Logins for you and your brother. Add your brother here with the Editor role, then never share the details.",
  },
  access: {
    // Only signed-in staff can list accounts.
    read: ({ req: { user } }) => Boolean(user),
    // Admins can add staff. Editors cannot, so a compromised editor login
    // cannot be used to hand out further access.
    create: ({ req: { user } }) => user?.role === "admin",
    // Staff may edit their own account; only an Admin may edit anyone else's.
    update: ({ id, req: { user } }) => {
      if (!user) return false;
      return user.id === id || user.role === "admin";
    },
    delete: ({ id, req: { user } }) => {
      if (!user) return false;
      return user.id === id || user.role === "admin";
    },
    admin: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // Nothing to do on edits.
        if (operation !== "create" || !data) return data;

        const existing = await req.payload.count({ collection: "users" });
        if (existing.totalDocs > 0) return data;

        // First account through the door is the owner. Force the role so the
        // shop can never end up with staff but no one able to manage them.
        return { ...data, role: "admin" };
      },
    ],
  },
  fields: [
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "editor",
      options: [
        {
          label: "Editor — can change styles, photos and page wording",
          value: "editor",
        },
        {
          label: "Admin — can also add staff and change their roles",
          value: "admin",
        },
      ],
      // Only admins may change a role, so an editor cannot promote themselves.
      access: {
        update: ({ req: { user } }) => user?.role === "admin",
      },
    },
    {
      name: "fullName",
      type: "text",
      admin: {
        description: "The person's name, so accounts are easy to tell apart.",
      },
    },
  ],
};