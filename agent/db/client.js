import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';

import * as schema from '../entity/index.js';
import { getDatabaseUrl } from './database_url.js';

const { Pool } = pkg;

let db;
let pool;

export function getDb() {
  if (!db) {
    pool = new Pool({ connectionString: getDatabaseUrl() });
    db = drizzle(pool, { schema });
  }

  return db;
}
