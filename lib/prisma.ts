import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const getPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
  const isProduction = process.env.NODE_ENV === "production";

  // DATABASE_URL may point at a session-mode pooler with a small shared
  // client limit. Each serverless runtime gets its own pool, so keep the
  // production pool small to avoid multiplying connections across instances.
  const pool = new pg.Pool({
    connectionString,
    max: isProduction ? 1 : 5,
    // Release serverless connections quickly after queries finish so idle
    // runtimes do not occupy the session pool's limited client slots.
    idleTimeoutMillis: isProduction ? 1000 : 10000,
    connectionTimeoutMillis: 10000,
  });

  pool.on("error", (err) => {
    console.error("Unexpected error on idle database client", err);
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
