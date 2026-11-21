import { listCategories } from '@/lib/categories';
import { db } from '@/lib/db';
import { handle, json } from '@/lib/http';
import { toPublicProduct } from '@/lib/products';

export const dynamic = 'force-dynamic';

// GET /api/products: the whole catalogue, in the storefront's product shape, plus the
// categories (managed on the admin's Categories page) in display order.
export const GET = handle(async () => {
  const [products, categories] = await Promise.all([
    db.product.findMany({
      include: { images: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
    listCategories(),
  ]);
  return json({
    products: products.map(toPublicProduct),
    categories: categories.map((c) => ({ id: c.id, name: c.name, tagline: c.tagline, description: c.description })),
  });
});
