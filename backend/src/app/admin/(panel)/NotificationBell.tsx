'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

export type Notice = {
  id: string;
  kind: 'order' | 'enquiry' | 'stock';
  title: string;
  detail: string;
  href: string;
  at: number;
  when: string;
};

const SEEN_KEY = 'amanah-admin-notices-seen';
const listeners = new Set<() => void>();
const readSeen = () => Number(localStorage.getItem(SEEN_KEY) ?? 0);
const markSeen = () => {
  localStorage.setItem(SEEN_KEY, String(Date.now()));
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const ICON: Record<Notice['kind'], React.ReactNode> = {
  order: <path d="M3 4h2.2l2.1 10.5a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6" />,
  enquiry: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  stock: <path d="M12 4 21 19.5H3zM12 10v4.5M12 17v.01" />,
};

export default function NotificationBell({ notices }: { notices: Notice[] }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  // When the list was last opened, kept in this browser. Before hydration nothing counts as new.
  const seen = useSyncExternalStore(subscribe, readSeen, () => Infinity);
  const unread = notices.filter((n) => n.at > seen).length;

  // Once the list has been opened, closing it (any way) counts everything as seen.
  const close = () => {
    markSeen();
    setOpen(false);
  };
  const toggle = () => (open ? close() : setOpen(true));

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);


  return (
    <div className="notif" ref={box}>
      <button
        type="button"
        className="topbar__icon"
        aria-label={unread ? `Notifications, ${unread} new` : 'Notifications'}
        title="Notifications"
        aria-expanded={open}
        onClick={toggle}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" />
        </svg>
        {unread > 0 && <span className="notif__count">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notif__panel" role="dialog" aria-label="Notifications">
          <div className="notif__head">
            <strong>Notifications</strong>
            {unread > 0 && (
              <button type="button" className="notif__clear" onClick={markSeen}>
                Mark all read
              </button>
            )}
          </div>
          {notices.length === 0 ? (
            <p className="notif__empty">You&apos;re all caught up.</p>
          ) : (
            <ul className="notif__list">
              {notices.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    className={`notif__item notif__item--${n.kind}`}
                    onClick={close}
                  >
                    <span className="notif__icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        {ICON[n.kind]}
                      </svg>
                    </span>
                    <span className="notif__text">
                      <span className="notif__title">
                        {n.title}
                        {n.at > seen && <i className="notif__dot" aria-label="new" />}
                      </span>
                      <span className="notif__detail">{n.detail}</span>
                    </span>
                    <span className="notif__when">{n.when}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
