import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const getPrismaClient = () => {
  const pool = new pg.Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 10, // Limit to 10 connections to stay under the 15 limit
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma || getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
} else {
  // In production (including build), also try to reuse the global instance
  // if it exists, but usually modules are cached.
  // Next.js build workers might re-evaluate this module.
  globalForPrisma.prisma = prisma;
}
