import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Prevent multiple instances of Prisma Client in development (due to node --watch reloads)
const globalForPrisma = globalThis;

function getConnectionString() {
  let url = process.env.DATABASE_URL || "";
  if (!url.includes("connection_limit")) {
    url += (url.includes("?") ? "&" : "?") + "connection_limit=5";
  }
  if (!url.includes("pool_timeout")) {
    url += "&pool_timeout=20";
  }
  if (!url.includes("connect_timeout")) {
    url += "&connect_timeout=20";
  }
  return url;
}

function createPrismaClient() {
  const url = getConnectionString();
  return new PrismaClient({
    datasources: url ? { db: { url } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

