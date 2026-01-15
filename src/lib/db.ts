// src/lib/db.ts
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Extend globalThis for caching Prisma client in dev
declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in the environment");
}

// Create a single pg Pool and adapter instance
const pool = new pg.Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  // In production, always create a new PrismaClient instance
  prisma = new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });
} else {
  // In development, use a global variable to prevent hot-reload issues
  if (!globalThis.cachedPrisma) {
    globalThis.cachedPrisma = new PrismaClient({
      adapter,
      log: ["query", "error", "warn"],
    });
  }
  prisma = globalThis.cachedPrisma;
}

export const db = prisma;
