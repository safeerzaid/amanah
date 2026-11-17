/**
 * Campaign and editorial image slots.
 * Copy a photo into /public/images and set its `src`, e.g. '/images/hero-main.jpg'.
 * While `src` is null, a brand-coloured placeholder is shown instead.
 *
 * tone:  'deep' (burgundy), 'ivory' or 'champagne'. Only used for placeholders.
 * motif: the line drawing shown on the placeholder.
 */
export const media = {
  heroMain: { src: '/images/hero-main.jpg', alt: 'Gold drop earrings, a solitaire pendant necklace and a ring displayed on burgundy velvet and marble', label: 'Hero campaign photo', tone: 'deep', motif: 'necklace' },
  heroPoster: { src: '/images/hero-poster.jpg', alt: 'A woman wearing gold and ruby chandbali earrings and a pearl necklace, by candlelight', label: 'Hero: first frame of the film', tone: 'deep', motif: 'earrings' },
  heroFeature: { src: '/images/hero-card-earrings.jpg', alt: 'Pair of organic gold hoop earrings with a burgundy satin ribbon', label: 'Hero card: portrait', tone: 'deep', motif: 'earrings' },
  heroCardA: { src: '/images/hero-card-bracelet.jpg', alt: 'Gold bangle with a star centrepiece on burgundy satin', label: 'Hero card: detail 1', tone: 'deep', motif: 'ring' },
  heroCardB: { src: '/images/hero-card-hearts.jpg', alt: 'Gold heart charm bracelet and matching necklace on burgundy satin with a ribbon', label: 'Hero card: detail 2', tone: 'deep', motif: 'bracelet' },

  storyMain: { src: '/images/earrings-hoops-powder.jpg', alt: 'Gold hoop earrings set with small stones, resting on deep red powder', label: 'Story: campaign photo', tone: 'champagne', motif: 'pendant' },
  storyDetail: { src: '/images/product-solitaire-pendant.jpg', alt: 'Solitaire pendant necklace on a burgundy velvet bust', label: 'Story: detail photo', tone: 'deep', motif: 'monogram' },
  storyThird: { src: '/images/collection-rings.jpg', alt: 'Gold ring with two marquise stones on a marble block', label: 'Story: third photo', tone: 'deep', motif: 'ring' },

  editorialTall: { src: '/images/hero-card-earrings.jpg', alt: 'Organic gold hoop earrings with a burgundy satin ribbon', label: 'Editorial: portrait', tone: 'deep', motif: 'earrings' },
  editorialWide: { src: '/images/hero-necklace-bust.jpg', alt: 'Gold bar pendant necklace on a burgundy velvet bust', label: 'Editorial: wide campaign', tone: 'deep', motif: 'necklace' },
  editorialSmall: { src: '/images/hero-card-hearts.jpg', alt: 'Gold heart charm bracelet and necklace on burgundy satin', label: 'Editorial: detail', tone: 'champagne', motif: 'ring' },

  newsletter: { src: '/images/earrings-drop-velvet.jpg', alt: 'Sculpted gold drop earrings on burgundy velvet', label: 'Newsletter photo', tone: 'deep', motif: 'earrings' },
  promo: { src: null, alt: 'Amanah gift campaign', label: 'Promo banner photo', tone: 'deep', motif: 'monogram' },

  aboutHero: { src: '/images/hero-necklace-bust.jpg', alt: 'Gold bar pendant necklace on a burgundy velvet bust', label: 'About: hero photo', tone: 'deep', motif: 'necklace' },
  aboutCraft: { src: '/images/collection-designer.jpg', alt: 'A-shaped gold statement earrings on a marble block', label: 'About: craftsmanship photo', tone: 'champagne', motif: 'bracelet' },
  aboutPackaging: { src: null, alt: 'Amanah packaging', label: 'About: packaging photo', tone: 'ivory', motif: 'monogram' },

  collectionsHero: { src: null, alt: 'Amanah collections campaign', label: 'Collections: hero photo', tone: 'deep', motif: 'pendant' },
  contactSide: { src: null, alt: 'Amanah campaign', label: 'Contact: side photo', tone: 'deep', motif: 'earrings' },
};
