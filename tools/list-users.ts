/**
 * Reports which staff accounts exist, without printing passwords or hashes.
 *
 * Used to confirm that an admin account was created and to check its role. The
 * password is never readable from here, which is the point of the script: it
 * lists who can sign in, nothing more.
 *
 * Run with: node --import tsx tools/list-users.ts
 */

import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const users = await payload.find({ collection: "users", limit: 20, depth: 0 });

  console.log(`Staff accounts: ${users.totalDocs}`);
  for (const user of users.docs) {
    console.log(
      `  - ${user.email}  role=${user.role ?? "(unset)"}  name=${(user as { fullName?: string }).fullName || "(none)"}`,
    );
  }

  if (users.totalDocs === 0) {
    console.log("\nNo accounts yet. Create the first one at /admin/create-first-user");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});