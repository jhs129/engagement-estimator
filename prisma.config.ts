import "dotenv/config";
import * as dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// .env.local (Next.js convention) overrides .env for local dev
dotenv.config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Use the direct (unpooled) connection for migrations — PgBouncer doesn't support DDL
    url: process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"],
  },
});
