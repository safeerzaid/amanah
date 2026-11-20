import 'server-only';
import type { z } from 'zod';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const json = (data: unknown, status = 200) => Response.json(data, { status });

/** Wraps a route handler so thrown HttpErrors become clean JSON responses. */
export function handle<Args extends unknown[]>(fn: (...args: Args) => Promise<Response>) {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof HttpError) {
        return json({ error: err.message, ...(err.details ? { details: err.details } : {}) }, err.status);
      }
      console.error(err);
      return json({ error: 'Something went wrong. Please try again.' }, 500);
    }
  };
}

export async function readJson<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, 'The request body must be JSON.');
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, 'Some fields are missing or invalid.', parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
  }
  return parsed.data;
}

export const clientIp = (request: Request) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';

// Simple fixed-window rate limit kept in memory. Good enough for one server
// instance; move to Redis if the backend is ever scaled to several.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(request: Request, scope: string, limit: number, windowMs: number) {
  const key = `${scope}:${clientIp(request)}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) throw new HttpError(429, 'Too many requests. Please wait a moment and try again.');
}
