/**
 * The shop's categories. These five are the demo set; with a backend connected the
 * list comes from the admin's Categories page instead (see setCollections below).
 * `id` must match `category` in products.js.
 */
export const collections = [
  {
    id: 'necklaces',
    name: 'Necklaces',
    tagline: 'Drawn close to the heart',
    description: 'Pendants and fine chains designed to be layered, gifted and kept.',
    media: { src: '/images/hero-necklace-bust.jpg', alt: 'Gold bar pendant necklace on a burgundy velvet bust', label: 'Collection: necklaces', tone: 'deep', motif: 'necklace' },
  },
  {
    id: 'earrings',
    name: 'Earrings',
    tagline: 'Light that frames the face',
    description: 'Studs, drops and hoops for quiet everyday moments and grand occasions.',
    media: { src: '/images/earrings-drop-velvet.jpg', alt: 'Sculpted gold drop earrings on burgundy velvet', label: 'Collection: earrings', tone: 'champagne', motif: 'earrings' },
  },
  {
    id: 'rings',
    name: 'Rings',
    tagline: 'Promises worn every day',
    description: 'Sculpted bands and statement rings made to carry meaning.',
    media: { src: '/images/collection-rings.jpg', alt: 'Gold ring with two marquise stones on a marble block', label: 'Collection: rings', tone: 'deep', motif: 'ring' },
  },
  {
    id: 'bracelets',
    name: 'Bracelets',
    tagline: 'Elegance at the wrist',
    description: 'Cuffs and delicate bracelets that move with you.',
    media: { src: '/images/hero-card-bracelet.jpg', alt: 'Gold bangle with a star centrepiece on burgundy satin', label: 'Collection: bracelets', tone: 'ivory', motif: 'bracelet' },
  },
  {
    id: 'designer',
    name: 'Designer Jewellery',
    tagline: 'Signature statement pieces',
    description: 'Distinctive designs where craftsmanship takes centre stage.',
    media: { src: '/images/collection-designer.jpg', alt: 'A-shaped gold statement earrings on a marble block', label: 'Collection: designer', tone: 'deep', motif: 'designer' },
  },
];

export const getCollection = (id) => collections.find((c) => c.id === id);

// The photos and copy written for the original categories, kept when the list is replaced.
const local = new Map(collections.map((c) => [c.id, c]));

/**
 * Replaces the categories with the backend's list (called once at start-up). A category
 * added in the admin gets its name and text from there, and the first photo among its
 * products as its image (a brand placeholder until it has one).
 */
export function setCollections(list, catalogue) {
  const next = list.map((c) => {
    const known = local.get(c.id);
    const photo = catalogue.find((p) => p.category === c.id && p.images[0]?.src)?.images[0];
    return {
      id: c.id,
      name: c.name || known?.name || c.id,
      tagline: c.tagline || known?.tagline || '',
      description: c.description || known?.description || '',
      media: known?.media ?? {
        src: photo?.src ?? null,
        alt: c.name,
        label: `Collection: ${c.name}`,
        tone: 'deep',
        motif: 'monogram',
      },
    };
  });
  collections.length = 0;
  collections.push(...next);
}
