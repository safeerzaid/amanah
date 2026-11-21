import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck } from 'lucide-react';
import { CartLine } from '../components/Overlays';
import { EmptyState, PageHeader } from '../components/ui';
import { useStore } from '../context/StoreContext';
import { site } from '../data/site';
import { formatPrice } from '../utils/format';

/**
 * `shipping` comes from the checkout once an address is entered:
 * { status: 'loading' } | { status: 'ok', shipping, days } | { status: 'error', message }.
 * Without it (the bag page) shipping shows as to be confirmed.
 */
export function OrderTotals({ subtotal, coupon = null, shipping = null }) {
  const known = shipping?.status === 'ok';
  const total = (coupon ? coupon.total : subtotal) + (known ? shipping.shipping : 0);
  return (
    <dl className="totals">
      <div>
        <dt>Subtotal</dt>
        <dd>{formatPrice(subtotal)}</dd>
      </div>
      {coupon && (
        <div className="totals__discount">
          <dt>Discount ({coupon.code})</dt>
          <dd>−{formatPrice(coupon.discount)}</dd>
        </div>
      )}
      <div>
        <dt>
          Shipping
          {known && shipping.days && <span className="totals__note">Delivery in {shipping.days}</span>}
        </dt>
        {known ? (
          <dd>{shipping.shipping ? formatPrice(shipping.shipping) : 'Free'}</dd>
        ) : (
          <dd className="is-tbc">{shipping?.status === 'loading' ? 'Calculating…' : shipping?.status === 'error' ? 'Not available' : 'To be confirmed'}</dd>
        )}
      </div>
      {shipping?.status === 'error' && (
        <div className="totals__error">
          <dt className="sr-only">Shipping problem</dt>
          <dd role="alert">{shipping.message}</dd>
        </div>
      )}
      <div className="totals__grand">
        <dt>{known ? 'Total' : 'Estimated total'}</dt>
        <dd>{formatPrice(total)}</dd>
      </div>
    </dl>
  );
}

export default function Cart() {
  const { cart } = useStore();

  useEffect(() => {
    document.title = `Shopping bag | ${site.name}`;
  }, []);

  return (
    <>
      <PageHeader eyebrow="Your selection" title="Shopping bag" crumbs={[{ label: 'Shopping bag' }]} />
      <section className="container cart page-pad-b">
        {cart.items.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Your bag is empty"
            text="Pieces you add to your bag will appear here, and stay here between visits."
            action={
              <Link to="/shop" className="btn btn--primary">
                Shop the collection
              </Link>
            }
          />
        ) : (
          <div className="cart__grid">
            <div>
              <div className="cart__head">
                <span>
                  {cart.count} {cart.count === 1 ? 'piece' : 'pieces'}
                </span>
                <Link to="/shop" className="text-link">
                  Continue shopping
                </Link>
              </div>
              <ul className="cart__lines">
                {cart.items.map((item) => (
                  <CartLine key={item.key} item={item} large />
                ))}
              </ul>
            </div>
            <aside className="summary">
              <h2 className="summary__title">Order summary</h2>
              <OrderTotals subtotal={cart.subtotal} />
              <p className="summary__note">{site.shippingNote}</p>
              <Link to="/checkout" className="btn btn--primary btn--block">
                Proceed to checkout
              </Link>
              <p className="summary__secure">
                <ShieldCheck size={15} strokeWidth={1.3} /> Your bag is saved on this device.
              </p>
            </aside>
          </div>
        )}
      </section>
    </>
  );
}
