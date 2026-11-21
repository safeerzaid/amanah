'use client';

import { useActionState, useRef, useState } from 'react';
import { addCoupon, type FormState } from '../actions';
import DatePicker from '../DatePicker';
import Dropdown from '../Dropdown';

export default function AddCouponForm({ currency }: { currency: string }) {
  const form = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<'percent' | 'amount'>('percent');
  const [expiresOn, setExpiresOn] = useState('');
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, data) => {
    const result = await addCoupon(prev, data);
    if (result?.ok) {
      form.current?.reset();
      setType('percent');
      setExpiresOn('');
    }
    return result;
  }, null);

  return (
    <form ref={form} action={action} className="card coupon-form" data-tour="coupon-form">
      <h2>New coupon</h2>
      <div className="coupon-form__grid">
        <label>
          Code
          <input name="code" required maxLength={20} placeholder="WELCOME10" className="coupon-form__code" autoComplete="off" />
        </label>
        <label>
          Discount
          <div className="coupon-form__value">
            <input
              name="value"
              type="number"
              min="1"
              max={type === 'percent' ? 90 : undefined}
              step={type === 'percent' ? 1 : 0.01}
              required
              placeholder={type === 'percent' ? '10' : '25'}
            />
            <Dropdown
              name="type"
              value={type}
              onChange={(v) => setType(v as 'percent' | 'amount')}
              aria-label="Discount type"
              options={[
                { value: 'percent', label: '% off' },
                { value: 'amount', label: `${currency} off` },
              ]}
            />
          </div>
        </label>
        <label>
          Minimum order <span className="hint">Optional, in {currency}</span>
          <input name="minSubtotal" type="number" min="0" step="0.01" placeholder="No minimum" />
        </label>
        <label>
          Expires on <span className="hint">Optional</span>
          <DatePicker name="expiresOn" value={expiresOn} onChange={setExpiresOn} placeholder="No end date" min={new Date().toLocaleDateString('en-CA')} />
        </label>
        <label>
          Usage limit <span className="hint">Optional</span>
          <input name="maxUses" type="number" min="1" step="1" placeholder="Unlimited" />
        </label>
        <div className="coupon-form__submit">
          <button className="btn" disabled={pending}>
            {pending ? 'Adding…' : 'Add coupon'}
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
