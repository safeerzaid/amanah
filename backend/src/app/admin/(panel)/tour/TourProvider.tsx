'use client';

import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import PageTour from './PageTour';
import { pageKeyFor, TOURS } from './tours.config';

type TourApi = {
  /** Replays the current page's guide from step 1 (the "?" button). */
  replay: () => void;
  /** Whether the current page has a guide. */
  hasTour: boolean;
};

const TourContext = createContext<TourApi>({ replay: () => {}, hasTour: false });
export const useTour = () => useContext(TourContext);

/** Starts a page's guide this long after it opens, so its content is on screen. */
const START_DELAY = 400;

// "Seen" is kept per admin and per page in this browser (there is no admin user table).
const seenKey = (userId: string, page: string) => `tour_seen:${userId}:${page}`;
const isSeen = (userId: string, page: string) => {
  try {
    return localStorage.getItem(seenKey(userId, page)) === '1';
  } catch {
    return true; // storage blocked: never nag
  }
};
/** The page's own content (its heading) is on screen, not just the admin frame. */
const pageHasLoaded = () => Boolean(document.querySelector('.admin__main .page-enter h1'));

const markSeen = (userId: string, page: string) => {
  try {
    localStorage.setItem(seenKey(userId, page), '1');
  } catch {
    /* storage blocked */
  }
};

export default function TourProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const page = pageKeyFor(pathname);
  const steps = page ? TOURS[page] : undefined;
  const [running, setRunning] = useState<{ page: string; run: number } | null>(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Moving to another page ends the guide that was open (it isn't marked seen).
  const [shownPage, setShownPage] = useState(page);
  if (page !== shownPage) {
    setShownPage(page);
    setRunning(null);
  }

  // First visit to a page: its guide starts by itself once the page has settled.
  useEffect(() => {
    if (!page || !TOURS[page]?.length || isSeen(userId, page)) return;
    let timer: ReturnType<typeof setTimeout>;
    const started = Date.now();
    // Pages stream in after the admin frame; wait for this page's heading, then a short pause.
    const whenReady = () => {
      if (pageHasLoaded() || Date.now() - started > 8000) timer = setTimeout(() => setRunning((r) => r ?? { page, run: Date.now() }), START_DELAY);
      else timer = setTimeout(whenReady, 150);
    };
    whenReady();
    return () => clearTimeout(timer);
  }, [page, userId]);

  const replay = useCallback(() => {
    if (!page || !TOURS[page]?.length) {
      setToast('No guide for this page yet');
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(''), 2600);
      return;
    }
    setRunning({ page, run: Date.now() }); // a new run always starts from step 1
  }, [page]);

  // Finished, skipped or closed: don't start this page's guide by itself again.
  const end = useCallback(() => {
    setRunning((r) => {
      if (r) markSeen(userId, r.page);
      return null;
    });
  }, [userId]);

  const active = running && running.page === page ? running : null;

  return (
    <TourContext.Provider value={{ replay, hasTour: Boolean(steps?.length) }}>
      {children}
      {active && steps && <PageTour key={active.run} steps={steps} onEnd={end} />}
      {toast && (
        <div className="tour-toast" role="status">
          {toast}
        </div>
      )}
    </TourContext.Provider>
  );
}
