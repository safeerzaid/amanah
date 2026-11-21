import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { storeCurrency } from '@/lib/env';
import { formatMoney } from '@/lib/money';
import { deliveryDays, INDIAN_STATES } from '@/lib/shipping';
import { deleteShippingZone, setShippingZoneActive, updateOrderStatus } from '../actions';
import ConfirmButton from '../ConfirmButton';
import AddZoneForm from './AddZoneForm';

export const metadata: Metadata = { title: 'Shipping' };

const address = (c: Record<string, string>) =>
  [c.address1, c.address2, `${c.city}, ${c.state} ${c.postcode}`, c.country].filter(Boolean).join(', ');

export default async function ShippingPage() {
  const currency = storeCurrency();
  const [toShip, shipped, zones] = await Promise.all([
    db.order.findMany({ where: { status: 'PAID' }, include: { items: true }, orderBy: { paidAt: 'asc' } }),
    db.order.findMany({ where: { status: 'SHIPPED' }, orderBy: { updatedAt: 'desc' }, take: 20 }),
    db.shippingZone.findMany({ orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }] }),
  ]);
  const activeZones = zones.filter((z) => z.active).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Shipping</h1>
          <p className="muted">Delivery zones and charges, and paid orders waiting to go out.</p>
        </div>
      </div>

      <AddZoneForm currency={currency} states={INDIAN_STATES} />

      <section className="card">
        <div className="card__head">
          <h2>Zones ({zones.length})</h2>
        </div>
        <p className="muted small zone-rule">
          {activeZones === 0
            ? 'No active zones: delivery is free to every address.'
            : 'A PIN code uses the zone with the longest matching PIN prefix, then a zone listing its state, then a zone with no PINs or states (catch-all). Addresses no zone covers can’t check out.'}
        </p>
        {zones.length > 0 && (
          <ul className="coupon-list zone-list" data-tour="zone-list">
            {zones.map((z) => {
              const where = [
                z.pinPrefixes.length ? `PIN ${z.pinPrefixes.join(', ')}` : '',
                z.states.length ? z.states.join(', ') : '',
              ]
                .filter(Boolean)
                .join(' · ');
              return (
                <li key={z.id} className={z.active ? '' : 'is-off'}>
                  <span className="coupon-list__info">
                    <strong>{z.name}</strong>
                    <span className="muted small">{where || 'Everywhere else (catch-all)'}</span>
                  </span>
                  <span className="coupon-list__info zone-list__price">
                    <strong>{z.rate ? formatMoney(z.rate, currency) : 'Free'}</strong>
                    <span className="muted small">{z.freeAbove != null ? `Free over ${formatMoney(z.freeAbove, currency)}` : 'No free delivery'}</span>
                  </span>
                  <span className="muted small coupon-list__uses">
                    {deliveryDays(z.minDays, z.maxDays)}
                    {z.priority !== 0 && ` · priority ${z.priority}`}
                  </span>
                  <span className={`badge ${z.active ? 'badge--PAID' : ''}`}>{z.active ? 'active' : 'paused'}</span>
                  <div className="row-actions">
                    <form action={setShippingZoneActive.bind(null, z.id, !z.active)}>
                      <button className="icon-btn" aria-label={z.active ? `Pause ${z.name}` : `Resume ${z.name}`} title={z.active ? 'Pause' : 'Resume'}>
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          {z.active ? <path d="M9 6v12M15 6v12" /> : <path d="M8 5.5v13l10.5-6.5z" />}
                        </svg>
                      </button>
                    </form>
                    <form action={deleteShippingZone.bind(null, z.id)}>
                      <ConfirmButton className="icon-btn icon-btn--danger" label={`Delete ${z.name}`} title="Delete" message={`Delete the zone ${z.name}?`}>
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

      <section className="card" data-tour="to-ship">
        <div className="card__head">
          <h2>To ship ({toShip.length})</h2>
        </div>
        {toShip.length === 0 ? (
          <p className="muted">Nothing waiting to ship.</p>
        ) : (
          <ul className="list list--ship">
            {toShip.map((o) => {
              const c = o.customer as Record<string, string>;
              return (
                <li key={o.id}>
                  <div>
                    <Link href={`/admin/orders/${o.id}`}>
                      <strong>
                        {c.firstName} {c.lastName}
                      </strong>
                    </Link>
                    <div className="small">{address(c)}</div>
                    <div className="muted small">{o.items.map((i) => `${i.qty} × ${i.name}`).join(' · ')}</div>
                  </div>
                  <form action={updateOrderStatus.bind(null, o.id)}>
                    <input type="hidden" name="status" value="SHIPPED" />
                    <button className="btn btn--sm">Mark shipped</button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="card__head">
          <h2>Recently shipped</h2>
        </div>
        {shipped.length === 0 ? (
          <p className="muted">No shipped orders yet.</p>
        ) : (
          <ul className="list list--ship">
            {shipped.map((o) => {
              const c = o.customer as Record<string, string>;
              return (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`}>
                    {c.firstName} {c.lastName} <span className="muted small">· {o.id.slice(-8).toUpperCase()}</span>
                  </Link>
                  <span className="muted small">{o.updatedAt.toLocaleDateString('en-CA', { dateStyle: 'medium' })}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
