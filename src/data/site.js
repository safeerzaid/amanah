// The backend's base URL, e.g. 'https://api.example.com'. Set VITE_API_URL in
// .env.local (and in Vercel). Without it the site runs on the demo catalogue
// and the forms say they are not connected.
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/**
 * Site-wide settings. Every `null` value is a detail that has not been
 * confirmed by the brand yet. The UI shows "Coming soon" for it instead of
 * inventing information.
 */
export const site = {
  name: 'Amanah Jewellery',
  tagline: 'Handcrafted Designer Jewellery',
  announcement: 'Handcrafted designer jewellery · Each piece made to be treasured',
  // Shown instead of the full line on narrow screens, so the bar stays one line.
  announcementShort: 'Handcrafted designer jewellery',

  // Shown on the shop pages while the catalogue is still demo data.
  demoCatalogue: !API_URL,

  // Small labels on image placeholders naming the image that belongs there.
  showImageLabels: false,

  currency: { code: 'CAD', locale: 'en-CA' },

  contact: {
    email: null, // e.g. 'hello@example.com'
    phone: null, // e.g. '+91 00000 00000'
    whatsapp: null, // digits only, with country code, e.g. '910000000000'
    address: null, // e.g. 'Street, City, Country'
    hours: null,
  },

  social: {
    instagram: null,
    facebook: null,
    pinterest: null,
    youtube: null,
  },

  // Backend endpoints. While these are null, the forms explain that the
  // feature is not connected yet. They never pretend that something was sent.
  endpoints: {
    products: API_URL ? `${API_URL}/api/products` : null,
    orders: API_URL ? `${API_URL}/api/checkout` : null,
    verifyPayment: API_URL ? `${API_URL}/api/checkout/verify` : null,
    coupon: API_URL ? `${API_URL}/api/coupons/check` : null,
    shipping: API_URL ? `${API_URL}/api/shipping/quote` : null,
    contact: API_URL ? `${API_URL}/api/contact` : null,
    newsletter: API_URL ? `${API_URL}/api/newsletter` : null,
    content: API_URL ? `${API_URL}/api/content` : null,
  },

  shippingNote:
    'Shipping rates and delivery times will be confirmed once online ordering is live.',
};

export const brandStory =
  'Amanah Jewelry honors the beauty of trust, profound craftsmanship, and classic elegance. Inspired by the Arabic word of Amanah, which means trust and responsibility, we think that each item of jewelry conveys a sentiment, a tale, and an enduring bond. Our meticulously chosen collection combines elegant styles, genuine materials, and outstanding attention to detail to create jewelry that feels as unique as the occasions it symbolizes. Amanah Jewelry makes every encounter significant, sophisticated, and long-lasting with a dedication to quality, openness, and individualized service.';

export const brandValues = [
  {
    title: 'Trust',
    text: 'Our name means trust. Every piece, every conversation and every promise is held to that standard.',
  },
  {
    title: 'Authenticity',
    text: 'Honest descriptions and open service, so you always know exactly what you are choosing.',
  },
  {
    title: 'Craftsmanship',
    text: 'Designs shaped with patience and a profound attention to the smallest detail.',
  },
  {
    title: 'Timeless Elegance',
    text: 'Pieces that outlast passing trends and become part of the stories you keep.',
  },
];
