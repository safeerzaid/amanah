'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { addShippingZone, type FormState } from '../actions';

const BLANK = { name: '', rate: '0', freeAbove: '', pinPrefixes: '', minDays: '3', maxDays: '7', priority: '0', active: true as boolean };

export default function AddZoneForm({ currency, states }: { currency: string; states: string[] }) {
  // Controlled, so a failed save keeps what was typed.
  const [values, setValues] = useState(BLANK);
  const [chosen, setChosen] = useState<string[]>([]);
  const picker = useRef<HTMLDetailsElement>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, data) => {
    const result = await addShippingZone(prev, data);
    if (result?.ok) {
      setValues(BLANK);
      setChosen([]);
    }
    return result;
  }, null);

  // Close the state list when clicking elsewhere.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (picker.current?.open && !picker.current.contains(e.target as Node)) picker.current.open = false;
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const field = (name: Exclude<keyof typeof BLANK, 'active'>) => ({
    name,
    value: values[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValues({ ...values, [name]: e.target.value }),
  });
  const toggleState = (s: string) => setChosen((list) => (list.includes(s) ? list.filter((x) => x !== s) : [...list, s]));

  return (
    <form action={action} className="card zone-form">
      <h2>Add a zone</h2>
      <div className="zone-form__grid">
        <label className="zone-form__wide">
          Zone name
          <input {...field('name')} required maxLength={60} placeholder="Kerala" autoComplete="off" />
        </label>
        <label>
          Rate <span className="hint">{currency}</span>
          <input {...field('rate')} type="number" min="0" step="0.01" required />
        </label>
        <label>
          Free above <span className="hint">{currency}, optional</span>
          <input {...field('freeAbove')} type="number" min="0" step="0.01" placeholder="Never" />
        </label>

        <label className="zone-form__wide">
          PIN prefixes <span className="hint">Comma separated, e.g. 673, 6730</span>
          <input {...field('pinPrefixes')} inputMode="numeric" placeholder="673, 680" autoComplete="off" />
        </label>
        <div className="zone-form__states">
          <span className="zone-form__label">…or whole states</span>
          <details ref={picker} className="state-pick">
            <summary>{chosen.length === 0 ? 'No states, match by PIN only' : chosen.length <= 2 ? chosen.join(', ') : `${chosen.length} states`}</summary>
            <div className="state-pick__list">
              {states.map((s) => (
                <label key={s} className="state-pick__item">
                  <input type="checkbox" name="states" value={s} checked={chosen.includes(s)} onChange={() => toggleState(s)} />
                  {s}
                </label>
              ))}
            </div>
          </details>
        </div>

        <label>
          Delivery days <span className="hint">Min</span>
          <input {...field('minDays')} type="number" min="0" max="60" step="1" required />
        </label>
        <label>
          Delivery days <span className="hint">Max</span>
          <input {...field('maxDays')} type="number" min="0" max="60" step="1" required />
        </label>
        <label>
          Priority <span className="hint">Higher wins a tie</span>
          <input {...field('priority')} type="number" min="-100" max="100" step="1" />
        </label>
        <div className="zone-form__end">
          <label className="switch">
            <input type="checkbox" name="active" checked={values.active} onChange={(e) => setValues({ ...values, active: e.target.checked })} />
            <span className="switch__track" aria-hidden="true" />
            <span className="switch__text">Active</span>
          </label>
          <button className="btn" disabled={pending}>
            {pending ? 'Adding…' : 'Add zone'}
          </button>
        </div>
      </div>
      {state?.error && (
        <p className="cat-add__msg cat-add__msg--error" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="cat-add__msg" role="status">
          {state.ok}
        </p>
      )}
    </form>
  );
}
