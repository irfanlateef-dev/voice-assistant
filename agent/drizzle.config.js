import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

import { getDatabaseUrl } from './db/database_url.js';

export default defineConfig({
  schema: './entity/index.js',
  out: './entity/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseUrl(),
  },
});
