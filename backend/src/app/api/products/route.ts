import { db } from '@/lib/db';
import { handle, json } from '@/lib/http';
import { toPublicProduct } from '@/lib/products';

export const dynamic = 'force-dynamic';

// GET /api/products: the whole catalogue, in the storefront's product shape.
export const GET = handle(async () => {
  const products = await db.product.findMany({
    include: { images: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
  return json({ products: products.map(toPublicProduct) });
});
