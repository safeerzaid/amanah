'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * The admin scrolls inside .admin__main, not the window, and Next.js only resets the
 * window's scroll on navigation. This puts the page area back at the top whenever the
 * page changes (filters, which only change the query string, keep their position).
 */
export default function ScrollReset() {
  const pathname = usePathname();
  useEffect(() => {
    document.querySelector('.admin__main')?.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}
