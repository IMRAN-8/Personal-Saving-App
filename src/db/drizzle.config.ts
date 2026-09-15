import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  const sqlHost = process.env.SQL_HOST;
  const sqlDbName = process.env.SQL_DB_NAME;
  const user = process.env.SQL_ADMIN_USER;
  const password = process.env.SQL_ADMIN_PASSWORD;

  if (!sqlHost || !sqlDbName || !user || !password) {
    throw new Error("DATABASE_URL or Cloud SQL credentials must be set in environment variables.");
  }
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: databaseUrl 
    ? { url: databaseUrl } 
    : {
        host: process.env.SQL_HOST!,
        user: process.env.SQL_ADMIN_USER!,
        password: process.env.SQL_ADMIN_PASSWORD!,
        database: process.env.SQL_DB_NAME!,
        ssl: false,
      },
  verbose: true,
});
