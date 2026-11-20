import { z } from 'zod';
import { db } from '@/lib/db';
import { handle, json, rateLimit, readJson } from '@/lib/http';

const newsletterSchema = z.object({ email: z.email().max(200) });

// POST /api/newsletter: saves the address. Signing up twice is not an error.
export const POST = handle(async (request: Request) => {
  rateLimit(request, 'newsletter', 5, 10 * 60_000);
  const { email } = await readJson(request, newsletterSchema);
  await db.newsletterSubscriber.upsert({ where: { email: email.toLowerCase() }, create: { email: email.toLowerCase() }, update: {} });
  return json({ ok: true });
});
