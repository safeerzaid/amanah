import 'server-only';
import bcrypt from 'bcryptjs';
import { jwtVerify, SignJWT } from 'jose';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { env } from './env';

// One admin account, configured through environment variables:
//   ADMIN_EMAIL, ADMIN_PASSWORD_HASH (from `npm run admin:hash`), AUTH_SECRET.
// The session is a signed, httpOnly cookie that lasts 12 hours.

const COOKIE = 'amanah_admin';
const SESSION_HOURS = 12;

function secretKey() {
  const secret = env('AUTH_SECRET');
  if (!secret || secret.length < 32) throw new Error('AUTH_SECRET must be set to at least 32 characters.');
  return new TextEncoder().encode(secret);
}

/** The hash is stored base64-encoded, because `$` signs in a raw bcrypt hash get expanded in .env files. */
function passwordHash() {
  const raw = env('ADMIN_PASSWORD_HASH');
  if (!raw) return undefined;
  return raw.startsWith('$2') ? raw : Buffer.from(raw, 'base64').toString('utf8');
}

// Slow down password guessing: 5 attempts per IP per 15 minutes.
const attempts = new Map<string, { count: number; resetAt: number }>();

async function checkLoginRate() {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || a.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60_000 });
    return true;
  }
  a.count += 1;
  return a.count <= 5;
}

export async function login(email: string, password: string): Promise<string | null> {
  if (!(await checkLoginRate())) return 'Too many attempts. Try again in 15 minutes.';
  const adminEmail = env('ADMIN_EMAIL');
  const hash = passwordHash();
  if (!adminEmail || !hash) return 'The admin account is not configured on the server.';

  const emailOk = email.trim().toLowerCase() === adminEmail.toLowerCase();
  const passwordOk = await bcrypt.compare(password, hash); // always run, so timing doesn't reveal the email
  if (!emailOk || !passwordOk) return 'Email or password is incorrect.';

  const token = await new SignJWT({ sub: adminEmail })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secretKey());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_HOURS * 3600,
  });
  return null;
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}

export async function getAdmin(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Call at the top of every admin page and server action. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect('/admin/login');
  return admin;
}

export const ADMIN_COOKIE = COOKIE;
