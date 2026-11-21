import type { Metadata } from 'next';
import Link from 'next/link';
import { listCategories } from '@/lib/categories';
import { storeCurrency } from '@/lib/env';
import ProductForm from '../ProductForm';

export const metadata: Metadata = { title: 'Add product' };

export default async function NewProductPage() {
  const categories = await listCategories();
  return (
    <>
      <div className="phead">
        <Link href="/admin/products" className="icon-btn" aria-label="Back to products" title="Back to products">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <div className="phead__title">
          <h1>Add product</h1>
          <span className="muted small">You can add photos right after creating it.</span>
        </div>
      </div>
      <ProductForm
        productId={null}
        currency={storeCurrency()}
        categories={categories}
        values={{
          name: '',
          slug: '',
          category: categories[0]?.id ?? '',
          short: '',
          description: '',
          price: '',
          salePrice: '',
          tone: 'ivory',
          sortOrder: '0',
          inStock: true,
          featured: false,
          isNew: true,
          variants: '',
          specs: '',
        }}
      />
    </>
  );
}
