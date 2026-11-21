'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

type Tab = { href: string; label: string; active: boolean };

/** Filter pills that highlight the clicked option straight away, before its list arrives. */
export default function FilterTabs({ tabs, label }: { tabs: Tab[]; label: string }) {
  const query = useSearchParams().toString();
  const [clicked, setClicked] = useState<{ href: string; from: string } | null>(null);
  const pending = clicked && clicked.from === query ? clicked.href : null;

  return (
    <nav className="tabs" aria-label={label}>
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          scroll={false}
          aria-current={(pending ? t.href === pending : t.active) ? 'page' : undefined}
          onClick={(e) => {
            if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !t.active) setClicked({ href: t.href, from: query });
          }}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
