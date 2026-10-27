import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

// Prevent multiple instances of Prisma Client in development (due to node --watch reloads)
const globalForPrisma = globalThis;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  // If connecting to Neon PostgreSQL, use WebSockets over port 443 to bypass any firewall / ISP port blocking
  if (connectionString && connectionString.includes("neon.tech")) {
    neonConfig.webSocketConstructor = ws;
    const adapter = new PrismaNeon({ connectionString });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
    });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
