import Link from 'next/link';
import { db } from '@/lib/db';
import { storeCurrency, storefrontOrigins } from '@/lib/env';
import { formatMoney } from '@/lib/money';
import NotificationBell, { type Notice } from './NotificationBell';
import TourHelpButton from './tour/TourHelpButton';

const ago = (date: Date) => {
  const mins = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days < 30 ? `${days} d ago` : date.toLocaleDateString('en-CA', { dateStyle: 'medium' });
};

/** Things that need the owner's attention: paid orders to ship, recent enquiries, sold-out pieces. */
async function loadNotices(): Promise<Notice[]> {
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [toShip, enquiries, soldOut] = await Promise.all([
    db.order.findMany({ where: { status: 'PAID' }, orderBy: { paidAt: 'desc' }, take: 8, select: { id: true, subtotal: true, currency: true, customer: true, paidAt: true, createdAt: true } }),
    db.contactMessage.findMany({ where: { createdAt: { gte: monthAgo } }, orderBy: { createdAt: 'desc' }, take: 8, select: { id: true, name: true, topic: true, createdAt: true } }),
    db.product.findMany({ where: { inStock: false }, orderBy: { updatedAt: 'desc' }, take: 8, select: { id: true, name: true, updatedAt: true } }),
  ]);
  const currency = storeCurrency();

  const notices = [
    ...toShip.map((o) => {
      const c = o.customer as Record<string, string>;
      const at = o.paidAt ?? o.createdAt;
      return {
        id: `order-${o.id}`,
        kind: 'order' as const,
        title: `New order ${o.id.slice(-8).toUpperCase()} to ship`,
        detail: `${c.firstName ?? ''} ${c.lastName ?? ''} · ${formatMoney(o.subtotal, o.currency || currency)}`.trim(),
        href: `/admin/orders/${o.id}`,
        at,
      };
    }),
    ...enquiries.map((m) => ({
      id: `enquiry-${m.id}`,
      kind: 'enquiry' as const,
      title: `Enquiry from ${m.name}`,
      detail: m.topic || 'Contact form',
      href: '/admin/messages',
      at: m.createdAt,
    })),
    ...soldOut.map((p) => ({
      id: `stock-${p.id}`,
      kind: 'stock' as const,
      title: `${p.name} is sold out`,
      detail: 'Restock or mark it in stock',
      href: '/admin/inventory',
      at: p.updatedAt,
    })),
  ];

  return notices
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 12)
    .map((n) => ({ ...n, at: n.at.getTime(), when: ago(n.at) }));
}

export default async function TopBar() {
  const notices = await loadNotices();
  const site = storefrontOrigins()[0] ?? 'http://localhost:5173';

  return (
    <header className="topbar" data-tour="topbar">
      <a className="topbar__site" href={site} target="_blank" rel="noopener noreferrer">
        <span>View site</span>
        <svg className="topbar__out" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 6h9v9M18 6 6.5 17.5" />
        </svg>
      </a>
      <NotificationBell notices={notices} />
      <TourHelpButton />
      <Link className="topbar__icon" href="/admin/settings" aria-label="Settings" title="Settings">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </Link>
    </header>
  );
}
