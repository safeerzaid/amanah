'use client';

import { useEffect, useId, useRef, useState } from 'react';

export type DropdownOption = { value: string; label: string };

type Props = {
  name: string;
  options: DropdownOption[];
  /** Uncontrolled starting value. */
  defaultValue?: string;
  /** Controlled value, with onChange. */
  value?: string;
  onChange?: (value: string) => void;
  /** Shown when nothing is chosen. */
  placeholder?: string;
  required?: boolean;
  'aria-label'?: string;
  className?: string;
};

/**
 * A styled replacement for <select>: the brand-coloured list instead of the
 * browser's own, and it still posts `name` with the form. Keyboard: arrows,
 * Home/End, Enter or Space to choose, Escape to close, letters to jump.
 */
export default function Dropdown({ name, options, defaultValue = '', value, onChange, placeholder = 'Choose…', required, className, ...rest }: Props) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const chosen = options.find((o) => o.value === current);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Keep the highlighted option in view.
  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const show = () => {
    setActive(Math.max(0, options.findIndex((o) => o.value === current)));
    setOpen(true);
  };
  const choose = (v: string) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
    setOpen(false);
    trigger.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    const last = options.length - 1;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    const move: Record<string, number> = { ArrowDown: Math.min(active + 1, last), ArrowUp: Math.max(active - 1, 0), Home: 0, End: last };
    if (e.key in move) {
      e.preventDefault();
      setActive(move[e.key]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (options[active]) choose(options[active].value);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      if (e.key === 'Escape') e.preventDefault();
      setOpen(false);
    } else if (e.key.length === 1) {
      const i = options.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      if (i >= 0) setActive(i);
    }
  };

  return (
    <div className={`dropdown${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`} ref={box}>
      {/* Posts the value, and lets the browser enforce `required`. */}
      <input className="dropdown__native" name={name} value={current} required={required} tabIndex={-1} aria-hidden="true" onChange={() => {}} />
      <button
        ref={trigger}
        type="button"
        className="dropdown__trigger"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-label={rest['aria-label']}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={(e) => {
          // Inside a <label>, a click on the label text arrives here too.
          e.preventDefault();
          if (open) setOpen(false);
          else show();
        }}
        onKeyDown={onKey}
      >
        <span className={chosen ? '' : 'dropdown__placeholder'}>{chosen ? chosen.label : placeholder}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul
          ref={list}
          id={id}
          role="listbox"
          className="dropdown__list"
          // Stops the surrounding <label> from re-opening the list.
          onClick={(e) => e.preventDefault()}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-${i}`}
              role="option"
              aria-selected={o.value === current}
              className={`dropdown__option${i === active ? ' is-active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(o.value)}
            >
              <span>{o.label}</span>
              {o.value === current && (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m5 12.5 4.5 4.5L19 7.5" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
