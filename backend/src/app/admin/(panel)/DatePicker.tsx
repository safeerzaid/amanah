'use client';

import { useEffect, useRef, useState } from 'react';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/** Local date as YYYY-MM-DD (what <input type="date"> would post). */
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};

type Props = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Earliest choosable day, YYYY-MM-DD. */
  min?: string;
  'aria-label'?: string;
};

/** A styled date field: a brand-coloured calendar instead of the browser's own. Posts YYYY-MM-DD as `name`. */
export default function DatePicker({ name, value, onChange, placeholder = 'Pick a date', min, ...rest }: Props) {
  const [open, setOpen] = useState(false);
  const selected = parse(value);
  const today = new Date();
  const [view, setView] = useState(() => {
    const base = selected ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const show = () => {
    const base = selected ?? today;
    setView(new Date(base.getFullYear(), base.getMonth(), 1));
    setOpen(true);
  };
  const pick = (d: Date) => {
    onChange(iso(d));
    setOpen(false);
    trigger.current?.focus();
  };
  const shift = (months: number) => setView((v) => new Date(v.getFullYear(), v.getMonth() + months, 1));

  // Six weeks starting on the Monday on or before the 1st.
  const start = new Date(view.getFullYear(), view.getMonth(), 1 - ((view.getDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  const minDate = min ? parse(min) : null;
  const beforeMin = (d: Date) => Boolean(minDate && d < minDate);
  const prevDisabled = Boolean(minDate && new Date(view.getFullYear(), view.getMonth(), 0) < minDate);

  return (
    <div className={`datepick${open ? ' is-open' : ''}`} ref={box}>
      <input type="hidden" name={name} value={value} />
      <button
        ref={trigger}
        type="button"
        className="dropdown__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={rest['aria-label']}
        onClick={(e) => {
          e.preventDefault(); // inside a <label>, the label's own click lands here too
          if (open) setOpen(false);
          else show();
        }}
      >
        <span className={selected ? '' : 'dropdown__placeholder'}>
          {selected ? selected.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : placeholder}
        </span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
      </button>

      {open && (
        <div className="datepick__panel" role="dialog" aria-label="Choose a date" onClick={(e) => e.preventDefault()}>
          <div className="datepick__head">
            <button type="button" className="datepick__nav" onClick={() => shift(-1)} disabled={prevDisabled} aria-label="Previous month">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m15 6-6 6 6 6" />
              </svg>
            </button>
            <strong>{view.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</strong>
            <button type="button" className="datepick__nav" onClick={() => shift(1)} aria-label="Next month">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
          </div>

          <div className="datepick__grid" role="grid">
            {WEEKDAYS.map((w) => (
              <span key={w} className="datepick__dow">
                {w}
              </span>
            ))}
            {days.map((d) => {
              const key = iso(d);
              const classes = [
                'datepick__day',
                d.getMonth() !== view.getMonth() && 'is-outside',
                key === iso(today) && 'is-today',
                key === value && 'is-selected',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <button
                  key={key}
                  type="button"
                  className={classes}
                  disabled={beforeMin(d)}
                  aria-pressed={key === value}
                  aria-label={d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  onClick={() => pick(d)}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div className="datepick__foot">
            <button
              type="button"
              className="datepick__link"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              Clear
            </button>
            <button type="button" className="datepick__link" onClick={() => pick(today)} disabled={beforeMin(new Date(today.getFullYear(), today.getMonth(), today.getDate()))}>
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
