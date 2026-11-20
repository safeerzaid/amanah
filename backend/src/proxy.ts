import { NextResponse, type NextRequest } from 'next/server';

// 1. CORS: only the storefront's own origin(s) may call /api from a browser.
// 2. Admin pages: visitors without a session cookie are sent to the login page.
//    (Every admin page and action also checks the session itself; this only
//    saves a round trip.)

const origins = () =>
  (process.env.STOREFRONT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);

function corsHeaders(origin: string | null) {
  const h = new Headers({ Vary: 'Origin' });
  if (origin && origins().includes(origin)) {
    h.set('Access-Control-Allow-Origin', origin);
    h.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    h.set('Access-Control-Allow-Headers', 'Content-Type');
    h.set('Access-Control-Max-Age', '86400');
  }
  return h;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/')) {
    const headers = corsHeaders(request.headers.get('origin'));
    if (request.method === 'OPTIONS') return new NextResponse(null, { status: 204, headers });
    const res = NextResponse.next();
    headers.forEach((value, key) => res.headers.set(key, value));
    return res;
  }

  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !request.cookies.has('amanah_admin')) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
};
