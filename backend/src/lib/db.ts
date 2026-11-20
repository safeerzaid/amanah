import 'server-only';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

// One client per server process, created on first use, so the app can be
// built without DATABASE_URL. In dev, hot reloads would otherwise open a new
// connection pool on every edit.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function client() {
  if (!globalForPrisma.prisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not set.');
    globalForPrisma.prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  }
  return globalForPrisma.prisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const c = client();
    const value = Reflect.get(c, prop, c);
    return typeof value === 'function' ? value.bind(c) : value;
  },
});
