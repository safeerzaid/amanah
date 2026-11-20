import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { logoutAction } from '../login/actions';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="admin">
      <nav className="admin__nav" aria-label="Admin">
        <span className="admin__brand">Amanah admin</span>
        <Link href="/admin/orders">Orders</Link>
        <Link href="/admin/products">Products</Link>
        <Link href="/admin/messages">Messages</Link>
        <form action={logoutAction}>
          <button>Sign out</button>
        </form>
      </nav>
      <main className="admin__main">{children}</main>
    </div>
  );
}
