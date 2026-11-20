// Copies the storefront's demo catalogue (src/data/products.js) into the database.
// Run with: npm run db:seed. Safe to re-run: products are upserted by id, and
// existing products keep any photos already uploaded through the admin.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
// The storefront's demo data. Only available when the backend sits inside the main repo.
import { products } from '../../src/data/products.js';

type DemoProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  short: string;
  description: string;
  price: number;
  salePrice: number | null;
  inStock: boolean;
  featured: boolean;
  isNew: boolean;
  tone: string;
  variants: { name: string; options: string[] }[];
  specs: { label: string; value: string }[];
  order: number;
  images: { src: string | null; view: string }[];
};

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  for (const p of products as DemoProduct[]) {
    const data = {
      slug: p.slug,
      name: p.name,
      category: p.category,
      short: p.short,
      description: p.description,
      price: Math.round(p.price * 100),
      salePrice: p.salePrice == null ? null : Math.round(p.salePrice * 100),
      inStock: p.inStock,
      featured: p.featured,
      isNew: p.isNew,
      tone: p.tone,
      variants: p.variants,
      specs: p.specs,
      sortOrder: p.order,
    };
    const existing = await db.product.findUnique({ where: { id: p.id }, select: { id: true } });
    if (existing) {
      await db.product.update({ where: { id: p.id }, data });
      continue;
    }
    // Demo photos are files in the storefront's /public/images, so their URLs stay relative.
    const images = p.images
      .filter((img) => img.src)
      .map((img, position) => ({ url: img.src!, alt: p.name, view: img.view, position }));
    await db.product.create({ data: { id: p.id, ...data, images: { create: images } } });
  }
  console.log(`Seeded ${products.length} products.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
