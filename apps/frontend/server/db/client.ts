import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

// PgBouncer-compatible client (pooler on 6543)
const client = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  prepare: false,
  max: 1,
});

export const db = drizzle(client);
export const pgClient = client;


