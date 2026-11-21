import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, CreditCard, Loader2, Lock, ShoppingBag } from 'lucide-react';
import { EmptyState, Field, Notice, PageHeader } from '../components/ui';
import Media from '../components/Media';
import { motifFor } from '../components/ProductCard';
import { OrderTotals } from './Cart';
import { useStore } from '../context/StoreContext';
import { site } from '../data/site';
import { checkCoupon, placeOrder, quoteShipping, NotConfiguredError, PaymentCancelledError } from '../utils/api';
import { classNames, formatPrice, isValidEmail, isValidPhone } from '../utils/format';

const fields = {
  email: { label: 'Email', type: 'email', autoComplete: 'email', required: true },
  phone: { label: 'Phone', type: 'tel', autoComplete: 'tel', required: true },
  firstName: { label: 'First name', autoComplete: 'given-name', required: true },
  lastName: { label: 'Last name', autoComplete: 'family-name', required: true },
  address1: { label: 'Address', autoComplete: 'address-line1', required: true },
  address2: { label: 'Apartment, suite, etc.', autoComplete: 'address-line2', required: false },
  city: { label: 'City', autoComplete: 'address-level2', required: true },
  state: { label: 'State / region', autoComplete: 'address-level1', required: true },
  postcode: { label: 'Postal code', autoComplete: 'postal-code', required: true },
  country: { label: 'Country', autoComplete: 'country-name', required: true },
};

const initial = Object.fromEntries(Object.keys(fields).map((k) => [k, '']));

function validate(values) {
  const errors = {};
  Object.entries(fields).forEach(([key, f]) => {
    if (f.required && !values[key].trim()) errors[key] = `Please enter your ${f.label.toLowerCase()}.`;
  });
  if (values.email && !isValidEmail(values.email)) errors.email = 'Please enter a valid email address.';
  if (values.phone && !isValidPhone(values.phone)) errors.phone = 'Please enter a valid phone number.';
  return errors;
}

/** "Discount code" box in the order summary. The backend checks the code against the bag. */
function CouponBox({ cart, coupon, onApply, onRemove }) {
  const [code, setCode] = useState('');
  const [state, setState] = useState({ busy: false, error: '' });

  const apply = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setState({ busy: true, error: '' });
    try {
      const result = await checkCoupon(
        code.trim(),
        cart.items.map((i) => ({ id: i.id, variant: i.variant, qty: i.qty })),
      );
      onApply(result);
      setCode('');
      setState({ busy: false, error: '' });
    } catch (err) {
      setState({ busy: false, error: err instanceof NotConfiguredError ? 'Discount codes are not available yet.' : err.message });
    }
  };

  if (coupon) {
    return (
      <div className="coupon-box coupon-box--applied">
        <span>
          <strong>{coupon.code}</strong> · {coupon.label}
        </span>
        <button type="button" className="text-link" onClick={onRemove}>
          Remove
        </button>
      </div>
    );
  }

  return (
    <form className="coupon-box" onSubmit={apply} noValidate>
      <label htmlFor="co-coupon" className="sr-only">
        Discount code
      </label>
      <div className="coupon-box__row">
        <input
          id="co-coupon"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Discount code"
          autoComplete="off"
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? 'co-coupon-error' : undefined}
        />
        <button type="submit" className="btn btn--outline btn--sm" disabled={state.busy || !code.trim()}>
          {state.busy ? <Loader2 size={15} className="spin" /> : 'Apply'}
        </button>
      </div>
      {state.error && (
        <p id="co-coupon-error" className="coupon-box__error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}

export default function Checkout() {
  const { cart, clearCart } = useStore();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState({ state: 'idle' });
  const [coupon, setCoupon] = useState(null);
  // A code was checked against the bag as it was; if the bag changes, ask for it again.
  const [couponFor, setCouponFor] = useState(cart.subtotal);
  if (coupon && couponFor !== cart.subtotal) {
    setCoupon(null);
  }
  // The delivery charge for the address typed so far, priced by the backend's shipping zones.
  const postcode = values.postcode.trim();
  const quoteKey = postcode.length >= 3 ? JSON.stringify([postcode, values.state.trim(), cart.subtotal, coupon?.code ?? '']) : '';
  const [quote, setQuote] = useState({ key: '', result: null });
  const shipping = !quoteKey ? null : quote.key === quoteKey ? quote.result : { status: 'loading' };
  const total = (coupon ? coupon.total : cart.subtotal) + (shipping?.status === 'ok' ? shipping.shipping : 0);
  const statusRef = useRef(null);

  useEffect(() => {
    if (!quoteKey) return undefined;
    let stale = false;
    const [pc, st, , code] = JSON.parse(quoteKey);
    const timer = setTimeout(async () => {
      let result;
      try {
        const q = await quoteShipping({ postcode: pc, state: st, couponCode: code || undefined, items: cart.items.map((i) => ({ id: i.id, variant: i.variant, qty: i.qty })) });
        result = { status: 'ok', shipping: q.shipping, days: q.days };
      } catch (err) {
        // Without a backend, shipping simply stays "to be confirmed".
        result = err instanceof NotConfiguredError ? null : { status: 'error', message: err.message };
      }
      if (!stale) setQuote({ key: quoteKey, result });
    }, 450);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
    // Re-quotes only when the key changes; the bag's contents are covered by cart.subtotal in it.
  }, [quoteKey]);

  useEffect(() => {
    document.title = `Checkout | ${site.name}`;
  }, []);

  useEffect(() => {
    if (status.state === 'blocked' || status.state === 'error') statusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [status]);

  const onChange = (e) => {
    const { name, value } = e.target;
    const next = { ...values, [name]: value };
    setValues(next);
    if (touched[name]) setErrors(validate(next));
  };

  const onBlur = (e) => {
    setTouched((t) => ({ ...t, [e.target.name]: true }));
    setErrors(validate(values));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    setTouched(Object.fromEntries(Object.keys(fields).map((k) => [k, true])));
    if (Object.keys(errs).length) {
      const first = Object.keys(fields).find((k) => errs[k]);
      document.getElementById(`co-${first}`)?.focus();
      return;
    }
    setStatus({ state: 'loading' });
    try {
      // Prices are recalculated by the backend; only ids, options and quantities are sent.
      const order = await placeOrder({
        customer: values,
        items: cart.items.map((i) => ({ id: i.id, variant: i.variant, qty: i.qty })),
        couponCode: coupon?.code,
      });
      // Only reached once the backend has verified the payment.
      clearCart();
      setStatus({ state: 'sent', reference: order.reference, email: values.email });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err instanceof NotConfiguredError) setStatus({ state: 'blocked' });
      else if (err instanceof PaymentCancelledError) setStatus({ state: 'cancelled', message: err.message });
      else setStatus({ state: 'error', message: err.message });
    }
  };

  const input = (name) => {
    const f = fields[name];
    const id = `co-${name}`;
    const err = touched[name] && errors[name];
    return (
      <Field label={f.label} id={id} error={err} optional={!f.required}>
        <input
          id={id}
          name={name}
          type={f.type ?? 'text'}
          autoComplete={f.autoComplete}
          value={values[name]}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={Boolean(err)}
          aria-describedby={err ? `${id}-error` : undefined}
        />
      </Field>
    );
  };

  if (status.state === 'sent') {
    return (
      <>
        <PageHeader eyebrow="Thank you" title="Order confirmed" crumbs={[{ label: 'Checkout' }]} />
        <div className="container page-pad-b">
          <EmptyState
            icon={CheckCircle2}
            title={`Order ${status.reference} is paid`}
            text={`Thank you for choosing Amanah. A confirmation has been sent to ${status.email}, and we will email you again when your order ships.`}
            action={
              <Link to="/shop" className="btn btn--primary">
                Continue shopping
              </Link>
            }
          />
        </div>
      </>
    );
  }

  if (cart.items.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Checkout" title="Checkout" crumbs={[{ label: 'Shopping bag', to: '/cart' }, { label: 'Checkout' }]} />
        <div className="container page-pad-b">
          <EmptyState
            icon={ShoppingBag}
            title="Your bag is empty"
            text="Add a piece to your bag to check out."
            action={
              <Link to="/shop" className="btn btn--primary">
                Shop the collection
              </Link>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Almost yours" title="Checkout" crumbs={[{ label: 'Shopping bag', to: '/cart' }, { label: 'Checkout' }]} />
      <section className="container checkout page-pad-b">
        <form className="checkout__form" onSubmit={onSubmit} noValidate>
          <fieldset className="co-block">
            <legend className="co-block__title">
              <span>01</span> Contact details
            </legend>
            <div className="form-grid">
              {input('email')}
              {input('phone')}
            </div>
          </fieldset>

          <fieldset className="co-block">
            <legend className="co-block__title">
              <span>02</span> Shipping address
            </legend>
            <div className="form-grid">
              {input('firstName')}
              {input('lastName')}
              <div className="span-2">{input('address1')}</div>
              <div className="span-2">{input('address2')}</div>
              {input('city')}
              {input('state')}
              {input('postcode')}
              {input('country')}
            </div>
          </fieldset>

          <fieldset className="co-block">
            <legend className="co-block__title">
              <span>03</span> Payment
            </legend>
            <div className="pay-placeholder">
              <CreditCard size={22} strokeWidth={1.2} />
              <div>
                <p className="pay-placeholder__title">Secure payment with Razorpay</p>
                <p>
                  When you continue, Razorpay opens a secure window to take your payment. Card details are entered
                  there and never reach this website.
                </p>
              </div>
            </div>
          </fieldset>

          <div ref={statusRef}>
            {status.state === 'blocked' && (
              <Notice tone="warn" title="Online ordering is not live yet">
                <p>
                  Your order has <strong>not</strong> been placed and you have not been charged. Your bag is saved on this
                  device. Please <Link to="/contact">contact us</Link> to order this selection.
                </p>
              </Notice>
            )}
            {status.state === 'error' && (
              <Notice tone="error" title="We could not place your order">
                <p>{status.message} Your bag has been kept.</p>
              </Notice>
            )}
            {status.state === 'cancelled' && (
              <Notice tone="warn" title="Payment not completed">
                <p>{status.message}</p>
              </Notice>
            )}
          </div>

          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={status.state === 'loading'}>
            {status.state === 'loading' ? (
              <>
                <Loader2 size={17} className="spin" /> Processing payment…
              </>
            ) : (
              <>
                <Lock size={15} strokeWidth={1.4} /> Pay securely · {formatPrice(total)}
              </>
            )}
          </button>
        </form>

        <aside className="summary checkout__summary">
          <h2 className="summary__title">Order summary</h2>
          <ul className="mini-lines">
            {cart.items.map((i) => (
              <li key={i.key}>
                <span className="mini-lines__img">
                  <Media src={i.product.images[0].src} tone={i.product.images[0].tone} motif={motifFor(i.product.category)} alt="" showLabel={false} />
                  <span className="mini-lines__qty">{i.qty}</span>
                </span>
                <span className="mini-lines__info">
                  <span className="mini-lines__name">{i.product.name}</span>
                  {i.variant && <span className="mini-lines__variant">{Object.values(i.variant).join(' · ')}</span>}
                </span>
                <span className={classNames('mini-lines__price')}>{formatPrice(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <CouponBox
            cart={cart}
            coupon={coupon}
            onApply={(c) => {
              setCoupon(c);
              setCouponFor(cart.subtotal);
            }}
            onRemove={() => setCoupon(null)}
          />
          <OrderTotals subtotal={cart.subtotal} coupon={coupon} shipping={shipping} />
          <Link to="/cart" className="text-link">
            Edit bag
          </Link>
        </aside>
      </section>
    </>
  );
}
