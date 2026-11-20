import 'server-only';
import { z } from 'zod';
import type { Product, ProductImage } from '@/generated/prisma/client';
import { toUnits } from './money';

export const CATEGORIES = ['necklaces', 'earrings', 'rings', 'bracelets', 'designer'] as const;
export const TONES = ['ivory', 'champagne', 'deep'] as const;

export const variantsSchema = z
  .array(z.object({ name: z.string().trim().min(1).max(60), options: z.array(z.string().trim().min(1).max(60)).min(1).max(40) }))
  .max(5);
export const specsSchema = z.array(z.object({ label: z.string().trim().min(1).max(60), value: z.string().trim().min(1).max(200) })).max(20);

export type Variant = z.infer<typeof variantsSchema>[number];

export const parseVariants = (value: unknown): Variant[] => variantsSchema.catch([]).parse(value);
const parseSpecs = (value: unknown) => specsSchema.catch([]).parse(value);

export const effectivePriceCents = (p: Pick<Product, 'price' | 'salePrice'>) => p.salePrice ?? p.price;

type PublicImage = { src: string | null; alt: string; view: string; tone: string; motif?: string };

/**
 * The storefront expects at least four gallery slots (front, detail, worn,
 * packaging), the same as the demo catalogue. Real photos fill the first
 * slots; the rest stay as branded placeholders (src: null).
 */
function withPlaceholders(photos: PublicImage[], tone: string, name: string): PublicImage[] {
  const slots: PublicImage[] = [
    { src: null, alt: name, view: 'Front view', tone },
    { src: null, alt: name, view: 'Detail', tone: tone === 'ivory' ? 'champagne' : 'ivory' },
    { src: null, alt: name, view: 'Worn', tone: 'deep' },
    { src: null, alt: name, view: 'Packaging', tone: 'ivory', motif: 'monogram' },
  ];
  return photos.length >= slots.length ? photos : [...photos, ...slots.slice(photos.length)];
}

/**
 * The product as the storefront expects it (same shape as src/data/products.js),
 * with prices in whole currency units.
 */
export function toPublicProduct(p: Product & { images: ProductImage[] }) {
  const images = [...p.images]
    .sort((a, b) => a.position - b.position)
    .map((img) => ({ src: img.url, alt: img.alt || p.name, view: img.view || 'Photo', tone: p.tone }));

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    short: p.short,
    description: p.description || p.short,
    price: toUnits(p.price),
    salePrice: p.salePrice == null ? null : toUnits(p.salePrice),
    inStock: p.inStock,
    featured: p.featured,
    isNew: p.isNew,
    tone: p.tone,
    variants: parseVariants(p.variants),
    specs: parseSpecs(p.specs),
    images: withPlaceholders(images, p.tone, p.name),
    order: p.sortOrder,
  };
}
