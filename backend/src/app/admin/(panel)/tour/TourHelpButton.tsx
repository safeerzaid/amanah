'use client';

import { useTour } from './TourProvider';

/** The "?" in the top bar: replays the guide for the page that is open. */
export default function TourHelpButton() {
  const { replay } = useTour();
  return (
    <button type="button" className="topbar__icon" onClick={replay} aria-label="Show guide for this page" title="Show guide for this page" data-tour="help">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M9.6 9.4a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.1-2.4 3.6M12 17v.01" />
      </svg>
    </button>
  );
}
