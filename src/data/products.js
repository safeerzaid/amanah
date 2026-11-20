/**
 * DEMO CATALOGUE. Every name, price and description here is a placeholder.
 * Replace it with the real catalogue (or load it from a backend through
 * src/utils/api.js) before launch.
 *
 * Unconfirmed details (material, purity, stones, weight) say "To be confirmed"
 * on purpose. Don't fill them in without verified information.
 *
 * images: one entry per gallery view. Set `src` to '/images/<file>.jpg'
 * once real product photography is available.
 * photo: a demo stand-in image used as the main view. These are borrowed
 * campaign/reference shots, not photos of these exact products.
 */

const TBC = 'To be confirmed';

const views = (tone) => [
  { src: null, view: 'Front view', tone },
  { src: null, view: 'Detail', tone: tone === 'ivory' ? 'champagne' : 'ivory' },
  { src: null, view: 'Worn', tone: 'deep' },
  { src: null, view: 'Packaging', tone: 'ivory', motif: 'monogram' },
];

const specs = (extra = []) => [
  { label: 'Material', value: TBC },
  { label: 'Finish', value: TBC },
  ...extra,
  { label: 'Handcrafted', value: 'Yes' },
];

const ringSizes = { name: 'Ring size', options: ['5', '6', '7', '8', '9'] };
const chainLength = { name: 'Chain length', options: ['16 in', '18 in', '20 in'] };
const braceletSize = { name: 'Size', options: ['Small', 'Medium', 'Large'] };

const raw = [
  // Necklaces
  { id: 'n1', photo: '/images/hero-necklace-bust.jpg', name: 'Noor Pendant Necklace', category: 'necklaces', price: 6400, featured: true, isNew: true, tone: 'ivory', variants: [chainLength], short: 'A softly sculpted pendant on a fine chain.', specs: specs([{ label: 'Stone', value: TBC }]) },
  { id: 'n2', name: 'Layla Layered Chain', category: 'necklaces', price: 5200, salePrice: 4400, tone: 'champagne', variants: [chainLength], short: 'Two fine strands designed to fall in gentle layers.', specs: specs() },
  { id: 'n3', photo: '/images/product-solitaire-pendant.jpg', name: 'Safa Drop Necklace', category: 'necklaces', price: 7800, tone: 'ivory', short: 'A single elongated drop with a graceful line.', specs: specs([{ label: 'Stone', value: TBC }]) },
  { id: 'n4', name: 'Rimal Collar', category: 'necklaces', price: 9600, inStock: false, tone: 'champagne', short: 'A sculptural collar inspired by flowing dunes.', specs: specs() },

  // Earrings
  { id: 'e1', photo: '/images/earrings-drop-velvet.jpg', name: 'Zahra Drop Earrings', category: 'earrings', price: 4800, featured: true, tone: 'champagne', short: 'Teardrop earrings with a quiet, luminous movement.', specs: specs([{ label: 'Closure', value: TBC }]) },
  { id: 'e2', photo: '/images/hero-card-earrings.jpg', name: 'Amal Hoop Earrings', category: 'earrings', price: 3900, isNew: true, tone: 'ivory', short: 'Classic hoops refined to an elegant proportion.', specs: specs([{ label: 'Closure', value: TBC }]) },
  { id: 'e3', name: 'Lulu Studs', category: 'earrings', price: 2600, salePrice: 2200, tone: 'champagne', short: 'Petite studs for every day and every occasion.', specs: specs([{ label: 'Closure', value: TBC }]) },
  { id: 'e4', name: 'Qamar Crescent Earrings', category: 'earrings', price: 5600, tone: 'ivory', short: 'Crescent forms that catch the light softly.', specs: specs([{ label: 'Closure', value: TBC }]) },

  // Rings
  { id: 'r1', photo: '/images/collection-rings.jpg', name: 'Amanah Signet Ring', category: 'rings', price: 5400, featured: true, isNew: true, tone: 'ivory', variants: [ringSizes], short: 'A refined signet that carries a promise.', specs: specs() },
  { id: 'r2', name: 'Wafa Band', category: 'rings', price: 3600, tone: 'champagne', variants: [ringSizes], short: 'A slim band made for stacking or wearing alone.', specs: specs() },
  { id: 'r3', name: 'Yasmin Cocktail Ring', category: 'rings', price: 8200, salePrice: 6900, tone: 'ivory', variants: [ringSizes], short: 'A statement ring with a generous, sculpted crown.', specs: specs([{ label: 'Stone', value: TBC }]) },
  { id: 'r4', name: 'Sahar Stacking Set', category: 'rings', price: 6100, inStock: false, tone: 'champagne', variants: [ringSizes], short: 'Three delicate rings designed to be worn together.', specs: specs() },

  // Bracelets
  { id: 'b1', photo: '/images/hero-card-bracelet.jpg', name: 'Rahma Cuff', category: 'bracelets', price: 7200, featured: true, tone: 'champagne', variants: [braceletSize], short: 'An open cuff with a soft, hand-finished curve.', specs: specs() },
  { id: 'b2', photo: '/images/hero-card-hearts.jpg', name: 'Hana Chain Bracelet', category: 'bracelets', price: 3400, isNew: true, tone: 'ivory', variants: [braceletSize], short: 'A fine chain bracelet with a delicate clasp.', specs: specs([{ label: 'Clasp', value: TBC }]) },
  { id: 'b3', name: 'Dana Bangle', category: 'bracelets', price: 4600, tone: 'champagne', variants: [braceletSize], short: 'A slim bangle with a quietly polished edge.', specs: specs() },

  // Designer
  { id: 'd1', photo: '/images/collection-designer.jpg', name: 'Mirage Statement Set', category: 'designer', price: 14800, featured: true, tone: 'ivory', short: 'A signature necklace and earring set for occasions to remember.', specs: specs([{ label: 'Includes', value: 'Necklace and earrings' }]) },
  { id: 'd2', name: 'Sultana Sculpted Ring', category: 'designer', price: 9800, tone: 'champagne', variants: [ringSizes], short: 'An architectural ring where form becomes art.', specs: specs() },
  { id: 'd3', name: 'Nadia Ear Cuff', category: 'designer', price: 5900, salePrice: 4900, isNew: true, tone: 'ivory', short: 'A sculptural ear cuff that needs no piercing.', specs: specs() },
];

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const products = raw.map((p, i) => ({
  inStock: true,
  featured: false,
  isNew: false,
  salePrice: null,
  variants: [],
  ...p,
  slug: slugify(p.name),
  description: `${p.short} Part of the Amanah demo catalogue: this description is a placeholder to be replaced with the final product copy.`,
  // `photo` (demo stand-in) becomes the main gallery image; other views stay placeholders.
  images: views(p.tone).map((v, idx) => (idx === 0 && p.photo ? { ...v, src: p.photo } : v)),
  // Lower number = newer. Used by "Newest" sorting.
  order: i,
}));

/**
 * Replaces the demo catalogue with the live one from the backend. Called once
 * in main.jsx before the app renders, so every page that reads `products`
 * synchronously sees the live catalogue.
 */
export function setCatalogue(list) {
  products.length = 0;
  products.push(...list);
}

export const getProductBySlug = (slug) => products.find((p) => p.slug === slug);
export const getProductById = (id) => products.find((p) => p.id === id);
export const effectivePrice = (p) => p.salePrice ?? p.price;
