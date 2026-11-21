import type { Metadata } from 'next';
import { couponState, describeCoupon } from '@/lib/coupons';
import { db } from '@/lib/db';
import { storeCurrency } from '@/lib/env';
import { formatMoney } from '@/lib/money';
import { deleteCoupon, setCouponActive } from '../actions';
import ConfirmButton from '../ConfirmButton';
import AddCouponForm from './AddCouponForm';

export const metadata: Metadata = { title: 'Coupons' };

const STATE_BADGE = { active: 'badge--PAID', paused: '', expired: 'badge--out', 'used up': 'badge--out' } as const;

export default async function CouponsPage() {
  const currency = storeCurrency();
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Coupons</h1>
          <p className="muted">Discount codes shoppers can enter at checkout.</p>
        </div>
      </div>

      <AddCouponForm currency={currency} />

      <section className="card">
        {coupons.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No coupons yet. Create one above, then share the code with your customers.
          </p>
        ) : (
          <ul className="coupon-list" data-tour="coupon-list">
            {coupons.map((c) => {
              const state = couponState(c);
              const rules = [
                c.minSubtotal ? `Orders over ${formatMoney(c.minSubtotal, currency)}` : 'Any order',
                c.expiresAt ? `until ${c.expiresAt.toLocaleDateString('en-CA', { dateStyle: 'medium' })}` : 'no end date',
              ].join(' · ');
              return (
                <li key={c.code} className={state === 'active' ? '' : 'is-off'}>
                  <span className="coupon-list__code">{c.code}</span>
                  <span className="coupon-list__info">
                    <strong>{describeCoupon(c, currency)}</strong>
                    <span className="muted small">{rules}</span>
                  </span>
                  <span className="muted small coupon-list__uses">
                    Used {c.uses}
                    {c.maxUses != null && ` of ${c.maxUses}`}
                  </span>
                  <span className={`badge ${STATE_BADGE[state]}`}>{state}</span>
                  <div className="row-actions">
                    <form action={setCouponActive.bind(null, c.code, !c.active)}>
                      <button className="icon-btn" aria-label={c.active ? `Pause ${c.code}` : `Resume ${c.code}`} title={c.active ? 'Pause' : 'Resume'}>
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          {c.active ? <path d="M9 6v12M15 6v12" /> : <path d="M8 5.5v13l10.5-6.5z" />}
                        </svg>
                      </button>
                    </form>
                    <form action={deleteCoupon.bind(null, c.code)}>
                      <ConfirmButton className="icon-btn icon-btn--danger" label={`Delete ${c.code}`} title="Delete" message={`Delete the code ${c.code}?`}>
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" />
                        </svg>
                      </ConfirmButton>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
