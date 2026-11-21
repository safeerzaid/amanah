import 'server-only';
import { db } from './db';

/**
 * Every piece of storefront text and imagery the owner can edit (products and
 * categories have their own pages). Defaults match the storefront's built-in
 * copy, so an unedited field changes nothing. Saved values live in the Setting
 * table under `key`; only values that differ from the default are stored.
 *
 * In headings, *stars* mark the words shown in the gold italic accent.
 */
export type FieldType = 'text' | 'textarea' | 'image' | 'email' | 'url' | 'tel';
export type ContentField = { key: string; label: string; type: FieldType; default: string; hint?: string; optional?: boolean };
export type ContentGroup = { title: string; fields: ContentField[] };
export type ContentSection = { id: string; title: string; intro: string; preview: string; groups: ContentGroup[] };

const ACCENT = 'Wrap words in *stars* for the gold italic accent.';
const t = (key: string, label: string, def: string, hint?: string): ContentField => ({ key, label, type: 'text', default: def, hint });
const ta = (key: string, label: string, def: string, hint?: string): ContentField => ({ key, label, type: 'textarea', default: def, hint });
const img = (slot: string, label: string, def: string | null): ContentField => ({ key: `image.${slot}`, label, type: 'image', default: def ?? '' });

export const CONTENT: ContentSection[] = [
  {
    id: 'general',
    title: 'Site-wide',
    intro: 'Shown on every page: the bar at the top, the brand story, contact details and social links.',
    preview: '/',
    groups: [
      {
        title: 'Announcement bar',
        fields: [
          t('site.announcement', 'Announcement', 'Handcrafted designer jewellery · Each piece made to be treasured'),
          t('site.announcementShort', 'Short version', 'Handcrafted designer jewellery', 'Shown on phones, where the full line would not fit.'),
          t('site.tagline', 'Tagline', 'Handcrafted Designer Jewellery', 'Used in browser tab titles and search results.'),
        ],
      },
      {
        title: 'Brand story',
        fields: [
          ta(
            'brandStory',
            'Story',
            'Amanah Jewelry honors the beauty of trust, profound craftsmanship, and classic elegance. Inspired by the Arabic word of Amanah, which means trust and responsibility, we think that each item of jewelry conveys a sentiment, a tale, and an enduring bond. Our meticulously chosen collection combines elegant styles, genuine materials, and outstanding attention to detail to create jewelry that feels as unique as the occasions it symbolizes. Amanah Jewelry makes every encounter significant, sophisticated, and long-lasting with a dedication to quality, openness, and individualized service.',
            'Shown on the home page and the About page.',
          ),
        ],
      },
      {
        title: 'Contact details',
        fields: [
          { key: 'contactEmail', label: 'Email', type: 'email', default: '', optional: true, hint: 'Also editable in Settings.' },
          { key: 'contactPhone', label: 'Phone', type: 'tel', default: '', optional: true, hint: 'Also editable in Settings.' },
          { key: 'contact.whatsapp', label: 'WhatsApp number', type: 'tel', default: '', optional: true, hint: 'With country code, e.g. 91 98765 43210.' },
          { key: 'contact.address', label: 'Boutique address', type: 'text', default: '', optional: true },
          { key: 'contact.hours', label: 'Opening hours', type: 'text', default: '', optional: true, hint: 'e.g. Mon–Sat, 10am–7pm' },
        ],
      },
      {
        title: 'Social links',
        fields: [
          { key: 'social.instagram', label: 'Instagram', type: 'url', default: '', optional: true, hint: 'Full link, e.g. https://instagram.com/yourshop' },
          { key: 'social.facebook', label: 'Facebook', type: 'url', default: '', optional: true },
          { key: 'social.pinterest', label: 'Pinterest', type: 'url', default: '', optional: true },
          { key: 'social.youtube', label: 'YouTube', type: 'url', default: '', optional: true },
        ],
      },
    ],
  },
  {
    id: 'home',
    title: 'Home',
    intro: 'The landing page, top to bottom.',
    preview: '/',
    groups: [
      {
        title: 'Hero',
        fields: [
          t('home.heroLine1', 'Headline, first line', 'crafted'),
          t('home.heroLine2', 'Headline, second line', 'in trust'),
          t('home.heroCta1', 'Main button', 'Shop collection'),
          t('home.heroCta2', 'Second button', 'Discover more'),
          { ...img('heroPoster', 'Hero image', '/images/hero-poster.jpg'), hint: 'The home page opens with a short film. Changing this photo shows it in place of the film.' },
        ],
      },
      {
        title: 'Featured pieces',
        fields: [
          t('home.featuredTitle', 'Heading', 'Pieces to treasure'),
          ta('home.featuredIntro', 'Intro', 'Signature pieces from the Amanah collection, each one made to be gifted and kept.'),
        ],
      },
      {
        title: 'Story',
        fields: [
          t('home.storyTitle', 'Heading', 'The beauty *of trust*', ACCENT),
          t('home.storyCta', 'Button', 'Read our story'),
          img('storyDetail', 'Left photo', '/images/product-solitaire-pendant.jpg'),
          img('storyMain', 'Centre photo', '/images/earrings-hoops-powder.jpg'),
          img('storyThird', 'Right photo', '/images/collection-rings.jpg'),
        ],
      },
      {
        title: 'The edit',
        fields: [
          t('home.editTitle', 'Heading', 'The Amanah *edit*', ACCENT),
          ta('home.editIntro', 'Intro', 'Light, texture and quiet confidence. A study of pieces designed to be lived in and handed on, every moment framed with elegance.'),
          t('home.editCta', 'Button', 'Explore the collections'),
          t('home.editCaption1', 'Caption 1', 'Sculpted gold'),
          img('editorialTall', 'Photo 1', '/images/hero-card-earrings.jpg'),
          t('home.editCaption2', 'Caption 2', 'Held close'),
          img('editorialWide', 'Photo 2', '/images/hero-necklace-bust.jpg'),
          t('home.editCaption3', 'Caption 3', 'Little hearts'),
          img('editorialSmall', 'Photo 3', '/images/hero-card-hearts.jpg'),
          t('home.editQuote', 'Quote', '“Each piece carries a sentiment, a tale and an enduring bond.”'),
          t('home.editQuoteCta', 'Quote button', 'Shop the edit'),
        ],
      },
      {
        title: 'Gifting banner',
        fields: [
          t('home.promoTitle', 'Heading', 'Gifts that *carry meaning*', ACCENT),
          ta('home.promoText', 'Text', 'An unforgettable gift that preserves moments of feeling for many years to come.'),
          t('home.promoCta', 'Button', 'Find the perfect gift'),
          img('promo', 'Background photo', null),
        ],
      },
      {
        title: 'Newsletter',
        fields: [
          t('home.newsletterTitle', 'Heading', 'Join the *Amanah* list', ACCENT),
          ta('home.newsletterText', 'Text', 'New collections, campaign stories and invitations, sent with care.'),
          img('newsletter', 'Photo', '/images/earrings-drop-velvet.jpg'),
        ],
      },
    ],
  },
  {
    id: 'about',
    title: 'About',
    intro: 'The “Our story” page. The story text itself is under Site-wide.',
    preview: '/about',
    groups: [
      {
        title: 'Page header',
        fields: [t('about.title', 'Title', 'Our story'), ta('about.intro', 'Intro', 'Inspired by the Arabic word amanah, meaning trust and responsibility.')],
      },
      {
        title: 'Brand story',
        fields: [t('about.storyTitle', 'Heading', 'Jewellery, *held in trust*', ACCENT), img('aboutHero', 'Photo', '/images/hero-necklace-bust.jpg')],
      },
      {
        title: 'Values',
        fields: [
          t('about.valuesTitle', 'Heading', 'What we *stand for*', ACCENT),
          t('about.value1Title', 'Value 1', 'Trust'),
          ta('about.value1Text', 'Value 1 text', 'Our name means trust. Every piece, every conversation and every promise is held to that standard.'),
          t('about.value2Title', 'Value 2', 'Authenticity'),
          ta('about.value2Text', 'Value 2 text', 'Honest descriptions and open service, so you always know exactly what you are choosing.'),
          t('about.value3Title', 'Value 3', 'Craftsmanship'),
          ta('about.value3Text', 'Value 3 text', 'Designs shaped with patience and a profound attention to the smallest detail.'),
          t('about.value4Title', 'Value 4', 'Timeless Elegance'),
          ta('about.value4Text', 'Value 4 text', 'Pieces that outlast passing trends and become part of the stories you keep.'),
        ],
      },
      {
        title: 'Craftsmanship',
        fields: [
          t('about.craftTitle', 'Heading', 'Made with *profound* care', ACCENT),
          ta(
            'about.craftText1',
            'First paragraph',
            'Every Amanah design begins with an idea of what a piece should mean to the person who wears it. Elegant styles, genuine materials and outstanding attention to detail come together so that each piece feels as unique as the occasion it symbolises.',
          ),
          ta('about.craftText2', 'Second paragraph', 'Quality, openness and individualised service guide every conversation we have.'),
          img('aboutCraft', 'Photo', '/images/collection-designer.jpg'),
        ],
      },
      {
        title: 'Closing banner',
        fields: [
          t('about.ctaTitle', 'Heading', 'A mark of *trust*', ACCENT),
          ta('about.ctaText', 'Text', 'Drawn as an architectural A framing a radiant star, the Amanah monogram is a quiet seal of the promise behind every piece.'),
        ],
      },
    ],
  },
  {
    id: 'pages',
    title: 'Other pages',
    intro: 'Headers of the Shop, Collections and Contact pages.',
    preview: '/shop',
    groups: [
      { title: 'Shop', fields: [ta('shop.intro', 'Intro', 'Handcrafted designer jewellery, made to be treasured and passed on.')] },
      {
        title: 'Collections',
        fields: [t('collections.title', 'Title', 'Collections'), ta('collections.intro', 'Intro', 'Each collection is a chapter: a sentiment, a tale and an enduring bond.')],
      },
      {
        title: 'Contact',
        fields: [t('contact.title', 'Title', 'Contact us'), ta('contact.intro', 'Intro', 'Questions about a piece, an order or a gift? Send us a message.')],
      },
    ],
  },
];

export const ALL_FIELDS = CONTENT.flatMap((s) => s.groups.flatMap((g) => g.fields));

/** Photos already in the storefront's /public/images, offered as a library. */
export const SITE_IMAGES = [
  '/images/hero-poster.jpg',
  '/images/hero-main.jpg',
  '/images/hero-necklace-bust.jpg',
  '/images/hero-card-earrings.jpg',
  '/images/hero-card-bracelet.jpg',
  '/images/hero-card-hearts.jpg',
  '/images/earrings-hoops-powder.jpg',
  '/images/earrings-drop-velvet.jpg',
  '/images/product-solitaire-pendant.jpg',
  '/images/collection-rings.jpg',
  '/images/collection-designer.jpg',
];

/** Saved values (only the edited ones), keyed by field key. */
export async function savedContent() {
  const rows = await db.setting.findMany({ where: { key: { in: ALL_FIELDS.map((f) => f.key) } } });
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, string>;
}
