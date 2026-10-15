#!/usr/bin/env node
/**
 * Applies db/migrations/*.sql to the Neon database in DATABASE_URL_UNPOOLED
 * (or DATABASE_URL), in file-name order, each in its own transaction, and
 * records it in public.schema_migrations so it runs once.
 *
 *   npm run db:migrate                 # apply pending migrations
 *   npm run db:migrate -- --status     # list applied / pending, change nothing
 *   npm run db:migrate -- --mark-applied <file>   # record without running (existing databases)
 *
 * Reads .env.local (vercel env pull) when present.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "@neondatabase/serverless";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
if (existsSync(join(root, ".env.local"))) process.loadEnvFile(join(root, ".env.local"));

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL_UNPOOLED / DATABASE_URL is not set. Run `vercel env pull .env.local` first.");
  process.exit(1);
}

const dir = join(root, "db", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const pool = new Pool({ connectionString: url });
const args = process.argv.slice(2);

try {
  await pool.query("create table if not exists public.schema_migrations (file text primary key, applied_at timestamptz not null default now())");
  const applied = new Set((await pool.query("select file from public.schema_migrations")).rows.map((r) => r.file));

  if (args[0] === "--status") {
    for (const f of files) console.log(`${applied.has(f) ? "applied" : "PENDING"}  ${f}`);
  } else if (args[0] === "--mark-applied") {
    const target = args[1];
    if (!files.includes(target)) throw new Error(`No migration named ${target}`);
    await pool.query("insert into public.schema_migrations (file) values ($1) on conflict do nothing", [target]);
    console.log(`Marked ${target} as applied.`);
  } else {
    const pending = files.filter((f) => !applied.has(f));
    if (pending.length === 0) console.log("Nothing to apply: the database is up to date.");
    for (const f of pending) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        await client.query(readFileSync(join(dir, f), "utf8"));
        await client.query("insert into public.schema_migrations (file) values ($1)", [f]);
        await client.query("commit");
        console.log(`Applied ${f}`);
      } catch (error) {
        await client.query("rollback");
        throw new Error(`${f} failed and was rolled back: ${error.message}`);
      } finally {
        client.release();
      }
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
