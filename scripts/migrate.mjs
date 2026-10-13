import { Pool } from "pg";
import { readFile } from "node:fs/promises";
if (!process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL before running the migration.");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
try {
  await pool.query(
    await readFile(
      new URL("../db/001_subscriptions.sql", import.meta.url),
      "utf8",
    ),
  );
  console.log("Subscription schema applied.");
} finally {
  await pool.end();
}
