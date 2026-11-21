'use client';

import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { removeProductFromCategory } from '../actions';

export type CategoryProductItem = { id: string; name: string; thumb: string | null };

function RemoveButton({ name }: { name: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="icon-btn icon-btn--danger" disabled={pending} aria-label={`Remove ${name} from this category`} title="Remove from this category">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12h14" />
      </svg>
    </button>
  );
}

/** A product inside the category's Edit panel. Remove takes it out of the category (it stays in the shop). */
export default function CategoryProduct({ product }: { product: CategoryProductItem }) {
  return (
    <li className="cat-prod">
      {product.thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="cat-prod__thumb" src={product.thumb} alt="" />
      ) : (
        <span className="cat-prod__thumb" />
      )}
      <Link href={`/admin/products/${product.id}`} className="cat-prod__name">
        {product.name}
      </Link>
      <form action={removeProductFromCategory.bind(null, product.id)}>
        <RemoveButton name={product.name} />
      </form>
    </li>
  );
}
