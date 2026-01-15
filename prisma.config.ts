import { defineConfig } from "prisma/config";

// Prisma 7+ datasource configuration.
// The DATABASE_URL is now read from here instead of schema.prisma.
export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: {
      env: "DATABASE_URL",
    },
  },
});

