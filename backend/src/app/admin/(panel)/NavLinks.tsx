'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

// Line icons drawn on a 24px grid, stroked in the current text colour.
const ICONS: Record<string, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </>
  ),
  orders: (
    <>
      <path d="M3 4h2.2l2.1 10.5a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6" />
      <circle cx="9.5" cy="19.5" r="1" />
      <circle cx="17" cy="19.5" r="1" />
    </>
  ),
  payments: (
    <>
      <path d="M3.5 9.5 12 4l8.5 5.5M5 10v7M9.7 10v7M14.3 10v7M19 10v7M3.5 20h17" />
    </>
  ),
  returns: (
    <>
      <path d="M4 12a8 8 0 1 0 2.6-5.9" />
      <path d="M4 4v4.5h4.5" />
    </>
  ),
  products: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
    </>
  ),
  categories: (
    <>
      <path d="M3.5 12.6V5a1.5 1.5 0 0 1 1.5-1.5h7.6l8 8a1.5 1.5 0 0 1 0 2.1l-7 7a1.5 1.5 0 0 1-2.1 0z" />
      <circle cx="8" cy="8" r="1.3" />
    </>
  ),
  contents: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M7.5 8h9M7.5 12h9M7.5 16h5" />
    </>
  ),
  inventory: (
    <>
      <path d="M3.5 8 12 3.5 20.5 8v11a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z" />
      <path d="M8 20.5V13h8v7.5M8 16.5h8" />
    </>
  ),
  shipping: (
    <>
      <path d="M2.5 6.5h11v10h-11zM13.5 10h4l3 3.5v3h-7" />
      <circle cx="6.5" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
  customers: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.7a3.5 3.5 0 0 1 0 6.6M18.5 14.5a6.5 6.5 0 0 1 3 5.5" />
    </>
  ),
  coupons: (
    <>
      <path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h14a1.5 1.5 0 0 1 1.5 1.5V10a2 2 0 0 0 0 4v2.5A1.5 1.5 0 0 1 19 18H5a1.5 1.5 0 0 1-1.5-1.5V14a2 2 0 0 0 0-4z" />
      <path d="M14 6v2M14 11v2M14 16v2" />
    </>
  ),
  reviews: (
    <>
      <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
    </>
  ),
  reports: (
    <>
      <path d="M3.5 3.5v17h17M8 16.5v-4M12.5 16.5v-9M17 16.5v-6" />
    </>
  ),
  messages: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  settings: (
    <>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};

const LINKS = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/orders', label: 'Orders', icon: 'orders' },
  { href: '/admin/payments', label: 'Payments', icon: 'payments' },
  { href: '/admin/returns', label: 'Returns', icon: 'returns' },
  { href: '/admin/products', label: 'Products', icon: 'products' },
  { href: '/admin/categories', label: 'Categories', icon: 'categories' },
  { href: '/admin/contents', label: 'Contents', icon: 'contents' },
  { href: '/admin/inventory', label: 'Inventory', icon: 'inventory' },
  { href: '/admin/shipping', label: 'Shipping', icon: 'shipping' },
  { href: '/admin/customers', label: 'Customers', icon: 'customers' },
  { href: '/admin/coupons', label: 'Coupons', icon: 'coupons' },
  { href: '/admin/reviews', label: 'Reviews', icon: 'reviews' },
  { href: '/admin/reports', label: 'Reports', icon: 'reports' },
  { href: '/admin/messages', label: 'Enquiries', icon: 'messages' },
  { href: '/admin/settings', label: 'Settings', icon: 'settings' },
];

const matches = (href: string, path: string) => (href === '/admin' ? path === '/admin' : path.startsWith(href));

export default function NavLinks() {
  const path = usePathname();
  // The item just clicked, highlighted straight away rather than when its page arrives.
  const [clicked, setClicked] = useState<{ href: string; from: string } | null>(null);
  const current = clicked && clicked.from === path ? clicked.href : null;

  return (
    <ul className="side__links">
      {LINKS.map((l) => {
        const active = current ? l.href === current : matches(l.href, path);
        return (
          <li key={l.href}>
            <Link
              href={l.href}
              className="side__link"
              aria-current={active ? 'page' : undefined}
              title={l.label}
              onClick={(e) => {
                if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !matches(l.href, path)) setClicked({ href: l.href, from: path });
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {ICONS[l.icon]}
              </svg>
              <span>{l.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
