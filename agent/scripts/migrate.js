import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from 'pg';

import { getDatabaseUrl } from '../db/database_url.js';

const { Pool } = pkg;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

let pool;

try {
  pool = new Pool({ connectionString: getDatabaseUrl() });
} catch (error) {
  console.error(error.message);
  console.error('Add POSTGRES_* variables to agent/.env (see agent/.env.example)');
  process.exit(1);
}

const db = drizzle(pool);

await migrate(db, { migrationsFolder: join(root, 'entity/migrations') });
await pool.end();
console.log('Migrations applied successfully');
