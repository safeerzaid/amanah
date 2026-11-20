import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/health: for Coolify's health check. Fails if the database is unreachable.
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
