import { prisma } from "../db/prisma.js";

export async function connectDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to start the API with PostgreSQL.");
  }

  try {
    await prisma.$connect();
    console.log("PostgreSQL (Neon) connected successfully via Prisma.");
  } catch (error) {
    console.error(`PostgreSQL connection failed: ${error.message}`);
    throw error;
  }
}