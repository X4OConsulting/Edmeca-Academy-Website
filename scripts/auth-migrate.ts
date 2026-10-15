/**
 * Creates or updates Better Auth's tables (user, session, account, verification)
 * in the Neon database named by DATABASE_URL.
 *
 *   npx tsx --env-file=.env.local scripts/auth-migrate.ts          # print the SQL only
 *   npx tsx --env-file=.env.local scripts/auth-migrate.ts --apply  # run it
 *
 * Run it again after adding a Better Auth plugin or field.
 */
import { getMigrations } from "better-auth/db/migration";
import { auth } from "../server/auth";
import { db } from "../server/db";

const apply = process.argv.includes("--apply");
const plan = await getMigrations(auth.options);
for (const problem of [...plan.unsafeChanges, ...plan.schemaProblems]) console.error(`! ${problem}`);
// With nothing to change, compileMigrations() returns a lone ";".
const sql = (await plan.compileMigrations()).trim().replace(/^;$/, "");
console.log(sql || "-- Nothing to do: the auth tables are up to date.");
if (apply && sql) {
  await plan.runMigrations();
  console.log("-- Applied.");
}
await db().end();
