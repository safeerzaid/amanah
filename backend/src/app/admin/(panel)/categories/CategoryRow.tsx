'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { deleteCategory, updateCategory, type FormState } from '../actions';
import Dropdown from '../Dropdown';
import CategoryProduct, { type CategoryProductItem } from './CategoryProduct';

type Category = { id: string; name: string; tagline: string };

/** One category: its name and product count. Edit (with the category's products) and Delete open in place. */
export default function CategoryRow({
  category,
  products,
  others,
}: {
  category: Category;
  products: CategoryProductItem[];
  others: Category[];
}) {
  const count = products.length;
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view');
  const [editState, editAction, saving] = useActionState<FormState, FormData>(async (prev, data) => {
    const result = await updateCategory(category.id, prev, data);
    if (result?.ok) setMode('view');
    return result;
  }, null);
  const [deleteState, deleteAction, deleting] = useActionState<FormState, FormData>(deleteCategory.bind(null, category.id), null);

  if (mode === 'edit') {
    return (
      <li className="cat-row cat-row--open">
        <form action={editAction} className="cat-edit">
          <input name="name" defaultValue={category.name} required maxLength={60} aria-label="Category name" autoFocus />
          <input name="tagline" defaultValue={category.tagline} maxLength={120} placeholder="Tagline (optional)" aria-label="Tagline" />
          <div className="cat-row__actions">
            <button className="btn btn--sm" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setMode('view')}>
              Cancel
            </button>
          </div>
        </form>
        {editState?.error && <p className="cat-add__msg cat-add__msg--error">{editState.error}</p>}

        <p className="cat-prods__head">
          {products.length === 0 ? 'No products in this category.' : `Products in ${category.name} (${products.length})`}
        </p>
        {products.length > 0 && (
          <ul className="cat-prods">
            {products.map((p) => (
              <CategoryProduct key={p.id} product={p} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  if (mode === 'delete') {
    return (
      <li className="cat-row cat-row--open">
        <form action={deleteAction} className={`cat-edit cat-edit--delete${count === 0 ? ' cat-edit--empty' : ''}`}>
          <p className="cat-del__text">
            Delete <strong>{category.name}</strong>?
            {count > 0 && (
              <>
                {' '}
                Its {count} {count === 1 ? 'product' : 'products'} will move to
              </>
            )}
          </p>
          {count > 0 && (
            <Dropdown
              name="moveTo"
              required
              placeholder="Choose a category"
              aria-label="Move its products to"
              options={others.map((o) => ({ value: o.id, label: o.name }))}
            />
          )}
          <div className="cat-row__actions">
            <button className="btn btn--danger btn--sm" disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setMode('view')}>
              Cancel
            </button>
          </div>
        </form>
        {deleteState?.error && <p className="cat-add__msg cat-add__msg--error">{deleteState.error}</p>}
      </li>
    );
  }

  return (
    <li className="cat-row">
      <Link href={`/admin/products?category=${category.id}`} className="cat-list__name">
        {category.name}
        {category.tagline && <span className="muted small">{category.tagline}</span>}
      </Link>
      <span className="badge">
        {count} {count === 1 ? 'product' : 'products'}
      </span>
      <div className="cat-row__actions" data-tour="category-actions">
        <button type="button" className="icon-btn" onClick={() => setMode('edit')} aria-label={`Edit ${category.name}`} title="Edit">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
            <path d="m13.5 6.5 4 4" />
          </svg>
        </button>
        <button
          type="button"
          className="icon-btn icon-btn--danger"
          onClick={() => setMode('delete')}
          disabled={count > 0 && others.length === 0}
          aria-label={`Delete ${category.name}`}
          title={count > 0 && others.length === 0 ? 'Add another category first, to move its products to' : 'Delete'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" />
          </svg>
        </button>
      </div>
    </li>
  );
}
