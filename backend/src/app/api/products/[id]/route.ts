import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { handle, HttpError, json } from '@/lib/http';
import { toPublicProduct } from '@/lib/products';

export const dynamic = 'force-dynamic';

// GET /api/products/:id: one product, looked up by id or by slug.
export const GET = handle(async (_req: NextRequest, ctx: RouteContext<'/api/products/[id]'>) => {
  const { id } = await ctx.params;
  const product = await db.product.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { images: true },
  });
  if (!product) throw new HttpError(404, 'Product not found.');
  return json({ product: toPublicProduct(product) });
});
