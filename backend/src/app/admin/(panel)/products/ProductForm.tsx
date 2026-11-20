'use client';

import { useActionState } from 'react';
import { saveProduct, type FormState } from '../actions';

export type ProductFormValues = {
  name: string;
  slug: string;
  category: string;
  short: string;
  description: string;
  price: string;
  salePrice: string;
  tone: string;
  sortOrder: string;
  inStock: boolean;
  featured: boolean;
  isNew: boolean;
  variants: string;
  specs: string;
};

const CATEGORIES = ['necklaces', 'earrings', 'rings', 'bracelets', 'designer'];
const TONES = ['ivory', 'champagne', 'deep'];

export default function ProductForm({ productId, values, currency }: { productId: string | null; values: ProductFormValues; currency: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProduct.bind(null, productId), null);

  return (
    <form action={action} className="card form">
      <div className="form-grid">
        <label>
          Name
          <input name="name" defaultValue={values.name} required maxLength={120} />
        </label>
        <label>
          Slug <span className="hint">Web address. Leave empty to build it from the name.</span>
          <input name="slug" defaultValue={values.slug} maxLength={120} />
        </label>
        <label>
          Category
          <select name="category" defaultValue={values.category}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Placeholder colour <span className="hint">Shown when there is no photo.</span>
          <select name="tone" defaultValue={values.tone}>
            {TONES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Price ({currency})
          <input name="price" type="number" min="0" step="0.01" defaultValue={values.price} required />
        </label>
        <label>
          Sale price ({currency}) <span className="hint">Leave empty when not on sale.</span>
          <input name="salePrice" type="number" min="0" step="0.01" defaultValue={values.salePrice} />
        </label>
        <label className="span-2">
          Short description
          <input name="short" defaultValue={values.short} required maxLength={300} />
        </label>
        <label className="span-2">
          Full description
          <textarea name="description" defaultValue={values.description} maxLength={5000} />
        </label>
        <label>
          Options <span className="hint">One per line, e.g. &quot;Ring size: 5, 6, 7&quot;</span>
          <textarea name="variants" defaultValue={values.variants} />
        </label>
        <label>
          Details <span className="hint">One per line, e.g. &quot;Material: 18k gold&quot;</span>
          <textarea name="specs" defaultValue={values.specs} />
        </label>
        <label>
          Sort order <span className="hint">Lower numbers appear first under &quot;Newest&quot;.</span>
          <input name="sortOrder" type="number" step="1" defaultValue={values.sortOrder} />
        </label>
      </div>
      <div className="checks">
        <label>
          <input type="checkbox" name="inStock" defaultChecked={values.inStock} /> In stock
        </label>
        <label>
          <input type="checkbox" name="featured" defaultChecked={values.featured} /> Featured on home page
        </label>
        <label>
          <input type="checkbox" name="isNew" defaultChecked={values.isNew} /> Marked as new
        </label>
      </div>
      {state?.error && (
        <p className="alert alert--error" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="alert alert--ok" role="status">
          {state.ok}
        </p>
      )}
      <div className="row">
        <button className="btn" disabled={pending}>
          {pending ? 'Saving…' : productId ? 'Save changes' : 'Create product'}
        </button>
      </div>
    </form>
  );
}
