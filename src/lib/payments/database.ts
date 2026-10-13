import "server-only";
import { Pool } from "pg";
import type { Database, SQL } from "./store";
let pool: Pool | undefined;
export function postgresDatabase(connectionString: string): Database {
  pool ??= new Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 10000,
  });
  const current = pool;
  return {
    query: async (text, values) => {
      const result = await current.query(text, values);
      return { rows: result.rows };
    },
    transaction: async <T>(work: (sql: SQL) => Promise<T>) => {
      const client = await current.connect();
      try {
        await client.query("BEGIN");
        const result = await work({
          query: async (text, values) => {
            const result = await client.query(text, values);
            return { rows: result.rows };
          },
        });
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
