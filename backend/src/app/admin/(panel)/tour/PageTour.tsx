'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TourStep } from './tours.config';

const RING_PAD = 8; // space between the target and its highlight ring
const GAP = 14; // space between the ring and the card
const EDGE = 12; // closest the card may come to the screen edge
const SHEET_BELOW = 768; // narrower screens show the card as a bottom sheet

/** The step's target, if it is on the page and visible; otherwise the step is a centred card. */
function findTarget(step: TourStep): HTMLElement | null {
  if (!step.target || typeof document === 'undefined') return null;
  const el = document.querySelector<HTMLElement>(step.target);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? el : null;
}

type Side = 'top' | 'bottom' | 'left' | 'right';

/** Places the card beside the target on the side with room, kept fully on screen. */
function placeCard(target: DOMRect, card: { width: number; height: number }, preferred: TourStep['placement']) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const room: Record<Side, number> = {
    bottom: vh - target.bottom - RING_PAD - GAP - EDGE - card.height,
    top: target.top - RING_PAD - GAP - EDGE - card.height,
    right: vw - target.right - RING_PAD - GAP - EDGE - card.width,
    left: target.left - RING_PAD - GAP - EDGE - card.width,
  };
  const order: Side[] = ['bottom', 'top', 'right', 'left'];
  if (preferred && preferred !== 'auto') order.unshift(preferred);
  const side = order.find((s) => room[s] >= 0) ?? order.reduce((a, b) => (room[b] > room[a] ? b : a));

  let top: number;
  let left: number;
  if (side === 'bottom' || side === 'top') {
    top = side === 'bottom' ? target.bottom + RING_PAD + GAP : target.top - RING_PAD - GAP - card.height;
    left = target.left + target.width / 2 - card.width / 2;
  } else {
    left = side === 'right' ? target.right + RING_PAD + GAP : target.left - RING_PAD - GAP - card.width;
    top = target.top + target.height / 2 - card.height / 2;
  }
  return {
    top: Math.round(Math.min(Math.max(top, EDGE), vh - card.height - EDGE)),
    left: Math.round(Math.min(Math.max(left, EDGE), vw - card.width - EDGE)),
  };
}

/**
 * One guide, shown step by step: the page is dimmed, the step's target gets a
 * highlight ring and the card sits beside it. → / Enter next, ← back, Esc close.
 */
export default function PageTour({ steps, onEnd }: { steps: TourStep[]; onEnd: () => void }) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const last = index === steps.length - 1;
  const target = findTarget(step);
  const card = useRef<HTMLDivElement>(null);
  const spot = useRef<HTMLDivElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const bodyId = useId();

  const next = () => (last ? onEnd() : setIndex((i) => i + 1));
  const back = () => setIndex((i) => Math.max(0, i - 1));

  // Brings the target into view, then keeps the ring and card on it while the page scrolls or resizes.
  useLayoutEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: reduced ? 'auto' : 'smooth' });

    const layout = () => {
      const c = card.current;
      if (!c) return;
      if (target && spot.current) {
        const r = target.getBoundingClientRect();
        Object.assign(spot.current.style, {
          top: `${r.top - RING_PAD}px`,
          left: `${r.left - RING_PAD}px`,
          width: `${r.width + RING_PAD * 2}px`,
          height: `${r.height + RING_PAD * 2}px`,
        });
        if (window.innerWidth >= SHEET_BELOW) {
          const { top, left } = placeCard(r, { width: c.offsetWidth, height: c.offsetHeight }, step.placement);
          c.style.top = `${top}px`;
          c.style.left = `${left}px`;
          return;
        }
      }
      c.style.top = '';
      c.style.left = '';
    };

    layout();
    let frame = 0;
    const onMove = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(layout);
    };
    window.addEventListener('scroll', onMove, true); // capture: the admin scrolls inside its own panel
    window.addEventListener('resize', onMove);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [target, step.placement, index]);

  // Each step puts focus on its main button.
  useEffect(() => {
    primary.current?.focus({ preventScroll: true });
  }, [index]);

  // Return focus to wherever it was (the "?" button, usually) when the guide ends.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    return () => before?.focus?.({ preventScroll: true });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onEnd();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (last) onEnd();
        else setIndex((i) => i + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter' && !(document.activeElement instanceof HTMLButtonElement)) {
        // On a focused button, Enter presses that button instead.
        e.preventDefault();
        if (last) onEnd();
        else setIndex((i) => i + 1);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [last, onEnd]);

  // Keep Tab inside the card.
  const trapFocus = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !card.current) return;
    const items = [...card.current.querySelectorAll<HTMLElement>('button')];
    const first = items[0];
    const end = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      end.focus();
    } else if (!e.shiftKey && document.activeElement === end) {
      e.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div className="tour">
      {/* Stops clicks reaching the page while the guide is open. */}
      <div className="tour__blocker" aria-hidden="true" />
      {target ? <div ref={spot} className="tour__spot" aria-hidden="true" /> : <div className="tour__dim" aria-hidden="true" />}

      <div
        ref={card}
        key={index}
        className={`tour__card${target ? '' : ' is-center'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        onKeyDown={trapFocus}
      >
        <button type="button" className="tour__close" onClick={onEnd} aria-label="Close the guide">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <p className="tour__step">
          Step {index + 1} of {steps.length}
        </p>
        <h2 id={titleId} className="tour__title">
          {step.title}
        </h2>
        <p id={bodyId} className="tour__body">
          {step.body}
        </p>

        <div className="tour__dots" aria-hidden="true">
          {steps.map((_, i) => (
            <span key={i} className={i === index ? 'is-on' : i < index ? 'is-done' : ''} />
          ))}
        </div>

        <div className="tour__actions">
          <button type="button" className="tour__skip" onClick={onEnd}>
            Skip the tour
          </button>
          <div className="tour__nav">
            {index > 0 && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={back}>
                Back
              </button>
            )}
            <button ref={primary} type="button" className="btn btn--sm" onClick={next}>
              {last ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
