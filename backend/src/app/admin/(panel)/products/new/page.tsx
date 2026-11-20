import type { Metadata } from 'next';
import Link from 'next/link';
import { storeCurrency } from '@/lib/env';
import ProductForm from '../ProductForm';

export const metadata: Metadata = { title: 'Add product' };

export default function NewProductPage() {
  return (
    <>
      <div className="page-head">
        <h1>Add product</h1>
        <Link className="btn btn--ghost" href="/admin/products">
          Back to products
        </Link>
      </div>
      <p className="muted small">Save the product first, then add photos.</p>
      <ProductForm
        productId={null}
        currency={storeCurrency()}
        values={{
          name: '',
          slug: '',
          category: 'necklaces',
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
