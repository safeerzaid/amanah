'use client';

import { useActionState } from 'react';
import { saveProduct, type FormState } from '../actions';
import Dropdown from '../Dropdown';

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

const TONES = [
  { id: 'ivory', label: 'Ivory' },
  { id: 'champagne', label: 'Champagne' },
  { id: 'deep', label: 'Deep burgundy' },
];

/** An on/off switch that posts like a checkbox. */
function Switch({ name, label, hint, defaultChecked }: { name: string; label: string; hint: string; defaultChecked: boolean }) {
  return (
    <label className="switch">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span className="switch__track" aria-hidden="true" />
      <span className="switch__text">
        {label}
        <span className="hint">{hint}</span>
      </span>
    </label>
  );
}

/**
 * The product form: the everyday fields up front, the rarely changed ones under
 * "More settings", and one Save button that stays in view.
 */
export default function ProductForm({
  productId,
  values,
  currency,
  categories,
}: {
  productId: string | null;
  values: ProductFormValues;
  currency: string;
  categories: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProduct.bind(null, productId), null);

  return (
    <form action={action} className="pform">
      <section className="card pform__card" data-tour="product-form">
        <label>
          Product name
          <input name="name" defaultValue={values.name} required maxLength={120} className="pform__name" />
        </label>

        <div className="pform__row3">
          <label>
            Category
            <Dropdown
              name="category"
              defaultValue={values.category}
              options={[{ value: '', label: 'No category' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
            />
          </label>
          <label>
            Price ({currency})
            <input name="price" type="number" min="0" step="0.01" defaultValue={values.price} required />
          </label>
          <label>
            Sale price
            <input name="salePrice" type="number" min="0" step="0.01" defaultValue={values.salePrice} placeholder="Not on sale" />
          </label>
        </div>

        <label>
          Short description <span className="hint">One line, shown on product cards.</span>
          <input name="short" defaultValue={values.short} required maxLength={300} />
        </label>
        <label>
          Full description
          <textarea name="description" defaultValue={values.description} maxLength={5000} rows={4} />
        </label>

        <div className="pform__switches" data-tour="product-switches">
          <Switch name="inStock" label="In stock" hint="Off shows it as sold out" defaultChecked={values.inStock} />
          <Switch name="featured" label="Featured" hint="Shown on the home page" defaultChecked={values.featured} />
          <Switch name="isNew" label="New" hint="Shows a “New” tag" defaultChecked={values.isNew} />
        </div>
      </section>

      <details className="card pform__more">
        <summary>More settings</summary>
        <div className="pform__more-body">
          <div className="pform__row2">
            <label>
              Options <span className="hint">One per line, e.g. &quot;Ring size: 5, 6, 7&quot;</span>
              <textarea name="variants" defaultValue={values.variants} rows={3} />
            </label>
            <label>
              Details <span className="hint">One per line, e.g. &quot;Material: 18k gold&quot;</span>
              <textarea name="specs" defaultValue={values.specs} rows={3} />
            </label>
          </div>
          <div className="pform__row3">
            <label>
              Web address <span className="hint">Empty = built from the name</span>
              <input name="slug" defaultValue={values.slug} maxLength={120} />
            </label>
            <label>
              Colour without photo
              <Dropdown name="tone" defaultValue={values.tone} options={TONES.map((t) => ({ value: t.id, label: t.label }))} />
            </label>
            <label>
              Sort order <span className="hint">Lower comes first</span>
              <input name="sortOrder" type="number" step="1" defaultValue={values.sortOrder} />
            </label>
          </div>
        </div>
      </details>

      <div className="pform__bar">
        <span className={`pform__msg${state?.error ? ' pform__msg--error' : ''}`} role={state?.error ? 'alert' : 'status'}>
          {state?.error ?? state?.ok ?? ''}
        </span>
        <button className="btn" disabled={pending} data-tour="save">
          {pending ? 'Saving…' : productId ? 'Save changes' : 'Create product'}
        </button>
      </div>
    </form>
  );
}
