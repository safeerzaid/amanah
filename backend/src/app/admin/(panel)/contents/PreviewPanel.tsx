'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const PAGES = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/shop', label: 'Shop' },
  { path: '/collections', label: 'Collections' },
  { path: '/contact', label: 'Contact' },
];

/**
 * The shop in a window, showing the unsaved text and photos live. The shop
 * (opened with ?preview) asks for them when it loads; every edit is sent again.
 */
export default function PreviewPanel({
  shopOrigin,
  startPath,
  content,
  onClose,
}: {
  shopOrigin: string;
  startPath: string;
  content: Record<string, string>;
  onClose: () => void;
}) {
  const [page, setPage] = useState(startPath);
  const [device, setDevice] = useState<'desktop' | 'phone'>('desktop');
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef(content);

  const send = () => frame.current?.contentWindow?.postMessage({ type: 'amanah-preview', content: latest.current }, shopOrigin);

  // The shop says it is ready each time a page loads in the window.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin === shopOrigin && e.data?.type === 'amanah-preview-ready') send();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `send` reads the latest content through a ref
  }, [shopOrigin]);

  // Live: every edit is shown straight away.
  useEffect(() => {
    latest.current = content;
    send();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-send whenever the content changes
  }, [content]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const body = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = body;
    };
  }, [onClose]);

  // Mounted on <body>: the page's fade-in animation would otherwise box it into the content area.
  return createPortal(
    <div className="preview" role="dialog" aria-modal="true" aria-label="Preview of the shop">
      <div className="preview__bar">
        <div className="preview__title">
          <strong>Preview</strong>
          <span>Unsaved changes are shown here only. Press save to put them live.</span>
        </div>
        <nav className="preview__pages" aria-label="Page to preview">
          {PAGES.map((p) => (
            <button key={p.path} type="button" aria-pressed={page === p.path} onClick={() => setPage(p.path)}>
              {p.label}
            </button>
          ))}
        </nav>
        <div className="preview__devices" role="group" aria-label="Screen size">
          <button type="button" aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')} title="Computer">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="4.5" width="18" height="12" rx="2" />
              <path d="M9 20h6M12 16.5V20" />
            </svg>
          </button>
          <button type="button" aria-pressed={device === 'phone'} onClick={() => setDevice('phone')} title="Phone">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="7" y="3" width="10" height="18" rx="2.5" />
              <path d="M11 18h2" />
            </svg>
          </button>
        </div>
        <button type="button" className="preview__close" onClick={onClose} aria-label="Close preview">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <div className="preview__stage">
        <iframe
          ref={frame}
          key={page}
          title="Shop preview"
          src={`${shopOrigin}${page}?preview`}
          className={`preview__frame preview__frame--${device}`}
        />
      </div>
    </div>,
    document.body,
  );
}
