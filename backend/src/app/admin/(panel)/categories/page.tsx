import type { Metadata } from 'next';
import Link from 'next/link';
import { listCategories, UNCATEGORISED } from '@/lib/categories';
import { db } from '@/lib/db';
import { previewUrl } from '@/lib/env';
import AddCategoryForm from './AddCategoryForm';
import type { CategoryProductItem } from './CategoryProduct';
import CategoryRow from './CategoryRow';

export const metadata: Metadata = { title: 'Categories' };

export default async function CategoriesPage() {
  const [categories, products] = await Promise.all([
    listCategories(),
    db.product.findMany({
      select: { id: true, name: true, category: true, images: { select: { url: true }, orderBy: { position: 'asc' }, take: 1 } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
  ]);
  const brief = categories.map((c) => ({ id: c.id, name: c.name, tagline: c.tagline }));
  const uncategorised = products.filter((p) => p.category === UNCATEGORISED).length;
  const productsIn = (id: string): CategoryProductItem[] =>
    products
      .filter((p) => p.category === id)
      .map((p) => ({ id: p.id, name: p.name, thumb: p.images[0] ? previewUrl(p.images[0].url) : null }));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Categories</h1>
          <p className="muted">Choose one of these when adding or editing a product.</p>
        </div>
      </div>

      <section className="card">
        <AddCategoryForm />
        <ul className="cat-list">
          {brief.map((c) => (
            <CategoryRow key={c.id} category={c} products={productsIn(c.id)} others={brief.filter((o) => o.id !== c.id)} />
          ))}
        </ul>
        {uncategorised > 0 && (
          <p className="cat-none">
            {uncategorised} {uncategorised === 1 ? 'product has' : 'products have'} no category.{' '}
            <Link href="/admin/products?category=none">See {uncategorised === 1 ? 'it' : 'them'}</Link>
          </p>
        )}
      </section>
    </>
  );
}
