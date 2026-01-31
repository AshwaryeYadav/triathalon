
// Prisma configuration
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // Use DATABASE_URL from environment, or fallback for build
    url: process.env.DATABASE_URL || "file:./dev.db",
  },
});
