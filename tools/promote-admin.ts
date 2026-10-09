/**
 * Promotes a staff account to Admin.
 *
 * Needed when the only existing account was created as an Editor, which happens
 * if the very first account was made before the "first account is always an
 * Admin" rule existed. Without this, nobody can add further staff accounts.
 *
 * Usage:
 *   node --import tsx tools/promote-admin.ts you@example.com
 */

import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const email = process.argv[2];

  if (!email) {
    const payload = await getPayload({ config });
    const users = await payload.find({ collection: "users", limit: 20, depth: 0 });
    console.log("Which account should be made an Admin?\n");
    users.docs.forEach((u) => console.log(`  ${u.email}  (currently ${u.role ?? "unset"})`));
    console.log("\nRun again with the address, for example:");
    console.log("  node --import tsx tools/promote-admin.ts you@example.com");
    process.exit(0);
  }

  const payload = await getPayload({ config });

  const users = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
  });

  const user = users.docs[0];
  if (!user) {
    console.error(`No account found for ${email}.`);
    process.exit(1);
  }

  if (user.role === "admin") {
    console.log(`${email} is already an Admin. Nothing to do.`);
    process.exit(0);
  }

  await payload.update({
    collection: "users",
    id: user.id,
    data: { role: "admin" },
  });

  console.log(`${email} is now an Admin.`);
  console.log("Sign in again so the new permissions take effect.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});