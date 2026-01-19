import { config } from 'dotenv';
import type { Config } from 'drizzle-kit';

// Load .env.local
config({ path: '.env.local' });

export default {
  schema: './src/lib/db/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
