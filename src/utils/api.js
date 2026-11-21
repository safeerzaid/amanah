/**
 * Data and service layer. The UI only talks to these functions.
 * With VITE_API_URL set they call the Amanah backend; without it the site runs
 * on the demo catalogue and every form says it is not connected.
 */
import { setCollections } from '../data/collections';
import { setContent } from '../data/content';
import { products, setCatalogue } from '../data/products';
import { site } from '../data/site';

export class NotConfiguredError extends Error {
  constructor(feature) {
    super(`${feature} is not connected yet.`);
    this.name = 'NotConfiguredError';
    this.feature = feature;
  }
}

/** The shopper closed the Razorpay window without paying. */
export class PaymentCancelledError extends Error {
  constructor() {
    super('Payment was cancelled. You have not been charged, and your bag has been kept.');
    this.name = 'PaymentCancelledError';
  }
}

async function request(url, feature, options = {}) {
  if (!url) throw new NotConfiguredError(feature);
  let res;
  try {
    res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  } catch {
    throw new Error('We could not reach the server. Please check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 503) throw new NotConfiguredError(feature);
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}). Please try again.`);
  return data;
}

const post = (url, feature, payload) => request(url, feature, { method: 'POST', body: JSON.stringify(payload) });

/** Loads the live catalogue (products and categories) into src/data. Called once at start-up. */
export async function loadCatalogue() {
  if (!site.endpoints.products) return false;
  // The site's edited text and photos load alongside; if they fail, the built-in copy is used.
  const contentRequest = request(site.endpoints.content, 'Site content')
    .then((c) => setContent(c.content))
    .catch((err) => console.warn('[content] Using the built-in copy:', err.message));
  const data = await request(site.endpoints.products, 'The catalogue');
  await contentRequest;
  setCatalogue(data.products);
  if (Array.isArray(data.categories) && data.categories.length) setCollections(data.categories, data.products);
  return true;
}

/** The catalogue is loaded before the app renders, so this just hands it over. */
export async function fetchProducts() {
  return products;
}

let razorpayScript;
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  razorpayScript ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = resolve;
    s.onerror = () => {
      razorpayScript = null;
      reject(new Error('The payment window could not be loaded. Please check your connection and try again.'));
    };
    document.body.appendChild(s);
  });
  return razorpayScript;
}

/**
 * Full checkout: the backend prices the bag and opens a Razorpay order, the
 * shopper pays in Razorpay's window, and the backend verifies the payment.
 * Resolves only once the backend confirms the order is PAID.
 */
export async function placeOrder(order) {
  const { orderId, razorpay } = await post(site.endpoints.orders, 'Online ordering', order);
  await loadRazorpay();

  const payment = await new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: razorpay.key,
      order_id: razorpay.orderId,
      amount: razorpay.amount,
      currency: razorpay.currency,
      name: razorpay.name,
      description: `Order ${orderId.slice(-8).toUpperCase()}`,
      prefill: razorpay.prefill,
      theme: { color: '#39090B' },
      handler: resolve,
      modal: { ondismiss: () => reject(new PaymentCancelledError()) },
    });
    rzp.on('payment.failed', (res) => {
      // Razorpay keeps its window open so the shopper can retry; this is only informational.
      console.warn('Razorpay payment failed:', res.error?.description);
    });
    rzp.open();
  });

  const result = await post(site.endpoints.verifyPayment, 'Online ordering', payment);
  return { orderId: result.orderId, reference: result.orderId.slice(-8).toUpperCase() };
}

/** Checks a discount code against the bag. Resolves to { code, label, discount, total } in whole units. */
export const checkCoupon = (code, items) => post(site.endpoints.coupon, 'Discount codes', { code, items });

/** The delivery charge for an address: { shipping, days, zone, total } in whole units. */
export const quoteShipping = (payload) => post(site.endpoints.shipping, 'Shipping', payload);

export const sendContactMessage = (msg) => post(site.endpoints.contact, 'The contact form', msg);
export const subscribeNewsletter = (email) => post(site.endpoints.newsletter, 'Newsletter sign-up', { email });
