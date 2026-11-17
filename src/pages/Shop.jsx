import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, SearchX, AlertCircle } from 'lucide-react';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import { EmptyState, PageHeader } from '../components/ui';
import SelectMenu from '../components/SelectMenu';
import { collections } from '../data/collections';
import { effectivePrice } from '../data/products';
import { site } from '../data/site';
import { fetchProducts } from '../utils/api';
import { useLockBody } from '../hooks/useLockBody';
import { classNames, formatPrice } from '../utils/format';

const PAGE_SIZE = 8;

const priceRanges = [
  { id: 'u4', label: `Under ${formatPrice(4000)}`, min: 0, max: 3999 },
  { id: '4-7', label: `${formatPrice(4000)} – ${formatPrice(7000)}`, min: 4000, max: 7000 },
  { id: '7-10', label: `${formatPrice(7000)} – ${formatPrice(10000)}`, min: 7001, max: 10000 },
  { id: 'o10', label: `Over ${formatPrice(10000)}`, min: 10001, max: Infinity },
];

const sorts = [
  { id: 'featured', label: 'Featured' },
  { id: 'newest', label: 'Newest' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'name', label: 'Name: A to Z' },
];

function Filters({ params, setParam, toggleCategory, counts, onClear, activeCount }) {
  const cats = params.get('category')?.split(',').filter(Boolean) ?? [];
  const price = params.get('price') ?? '';
  const inStock = params.get('stock') === 'in';

  return (
    <div className="filters">
      <fieldset className="filters__group">
        <legend>Category</legend>
        {collections.map((c) => (
          <label key={c.id} className="check">
            <input type="checkbox" checked={cats.includes(c.id)} onChange={() => toggleCategory(c.id)} />
            <span className="check__box" aria-hidden="true" />
            <span className="check__label">{c.name}</span>
            <span className="check__count">{counts[c.id] ?? 0}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="filters__group">
        <legend>Price</legend>
        <label className="check check--radio">
          <input type="radio" name="price" checked={!price} onChange={() => setParam('price', '')} />
          <span className="check__box" aria-hidden="true" />
          <span className="check__label">Any price</span>
        </label>
        {priceRanges.map((r) => (
          <label key={r.id} className="check check--radio">
            <input type="radio" name="price" checked={price === r.id} onChange={() => setParam('price', r.id)} />
            <span className="check__box" aria-hidden="true" />
            <span className="check__label">{r.label}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="filters__group">
        <legend>Availability</legend>
        <label className="check">
          <input type="checkbox" checked={inStock} onChange={() => setParam('stock', inStock ? '' : 'in')} />
          <span className="check__box" aria-hidden="true" />
          <span className="check__label">In stock only</span>
        </label>
      </fieldset>

      {activeCount > 0 && (
        <button type="button" className="text-link filters__clear" onClick={onClear}>
          Clear all filters
        </button>
      )}
    </div>
  );
}

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [all, setAll] = useState(null);
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [drawer, setDrawer] = useState(false);
  const [qInput, setQInput] = useState(params.get('q') ?? '');
  const closeDrawer = useCallback(() => setDrawer(false), []);
  useLockBody(drawer, closeDrawer);

  const load = useCallback(() => {
    setError(null);
    setAll(null);
    fetchProducts()
      .then(setAll)
      .catch(() => setError('We could not load the collection. Please try again.'));
  }, []);

  useEffect(() => {
    load();
    document.title = `Shop | ${site.name}`;
  }, [load]);

  // Keep the search box in sync with the URL (e.g. searching from the header).
  const urlQ = params.get('q') ?? '';
  useEffect(() => setQInput(urlQ), [urlQ]);

  useEffect(() => setVisible(PAGE_SIZE), [params]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const toggleCategory = (id) => {
    const cats = params.get('category')?.split(',').filter(Boolean) ?? [];
    const next = cats.includes(id) ? cats.filter((c) => c !== id) : [...cats, id];
    setParam('category', next.join(','));
  };

  const clearAll = () => {
    setQInput('');
    setParams(new URLSearchParams(), { replace: true });
  };

  // Debounce typing into the search field.
  useEffect(() => {
    const t = setTimeout(() => {
      if (qInput.trim() !== urlQ) setParam('q', qInput.trim());
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  const cats = params.get('category')?.split(',').filter(Boolean) ?? [];
  const priceId = params.get('price') ?? '';
  const inStockOnly = params.get('stock') === 'in';
  const sort = params.get('sort') ?? 'featured';
  const q = urlQ.toLowerCase();

  const { results, counts } = useMemo(() => {
    if (!all) return { results: [], counts: {} };
    const range = priceRanges.find((r) => r.id === priceId);
    const base = all.filter((p) => {
      if (q && !`${p.name} ${p.short} ${p.category}`.toLowerCase().includes(q)) return false;
      if (range && (effectivePrice(p) < range.min || effectivePrice(p) > range.max)) return false;
      if (inStockOnly && !p.inStock) return false;
      return true;
    });
    const counts = base.reduce((acc, p) => ({ ...acc, [p.category]: (acc[p.category] ?? 0) + 1 }), {});
    const filtered = cats.length ? base.filter((p) => cats.includes(p.category)) : base;
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case 'newest':
          return Number(b.isNew) - Number(a.isNew) || b.order - a.order;
        case 'price-asc':
          return effectivePrice(a) - effectivePrice(b);
        case 'price-desc':
          return effectivePrice(b) - effectivePrice(a);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return Number(b.featured) - Number(a.featured) || a.order - b.order;
      }
    });
    return { results: sorted, counts };
  }, [all, q, priceId, inStockOnly, sort, cats.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeChips = [
    ...cats.map((c) => ({ key: `c-${c}`, label: collections.find((x) => x.id === c)?.name ?? c, clear: () => toggleCategory(c) })),
    priceId && { key: 'price', label: priceRanges.find((r) => r.id === priceId)?.label, clear: () => setParam('price', '') },
    inStockOnly && { key: 'stock', label: 'In stock', clear: () => setParam('stock', '') },
    urlQ && { key: 'q', label: `“${urlQ}”`, clear: () => setQInput('') },
  ].filter(Boolean);

  const title = cats.length === 1 ? collections.find((c) => c.id === cats[0])?.name ?? 'Shop' : 'The collection';

  const filterProps = { params, setParam, toggleCategory, counts, onClear: clearAll, activeCount: activeChips.length };

  return (
    <>
      <PageHeader
        eyebrow="Shop"
        title={title}
        intro="Handcrafted designer jewellery, made to be treasured and passed on."
        crumbs={[{ label: 'Shop' }]}
      />

      <section className="shop container">
        {site.demoCatalogue && (
          <p className="demo-note">Preview catalogue: product names, prices and images are placeholders until the final catalogue is added.</p>
        )}

        <div className="shop__bar">
          <div className="shop__search">
            <Search size={17} strokeWidth={1.3} aria-hidden="true" />
            <label htmlFor="shop-search" className="sr-only">
              Search the collection
            </label>
            <input
              id="shop-search"
              type="search"
              placeholder="Search the collection"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn--outline btn--sm shop__filter-btn" onClick={() => setDrawer(true)}>
            <SlidersHorizontal size={15} strokeWidth={1.3} /> Filters{activeChips.length > 0 && ` (${activeChips.length})`}
          </button>
          <SelectMenu
            className="shop__sort"
            label="Sort by"
            value={sort}
            options={sorts}
            onChange={(v) => setParam('sort', v === 'featured' ? '' : v)}
          />
        </div>

        {activeChips.length > 0 && (
          <div className="shop__chips">
            {activeChips.map((c) => (
              <button key={c.key} type="button" className="chip chip--removable" onClick={c.clear} aria-label={`Remove filter ${c.label}`}>
                {c.label} <X size={13} strokeWidth={1.4} />
              </button>
            ))}
            <button type="button" className="text-link" onClick={clearAll}>
              Clear all
            </button>
          </div>
        )}

        <div className="shop__layout">
          <aside className="shop__aside" aria-label="Filters">
            <Filters {...filterProps} />
          </aside>

          <div className="shop__results">
            {error ? (
              <EmptyState
                icon={AlertCircle}
                title="Something went wrong"
                text={error}
                action={
                  <button type="button" className="btn btn--primary" onClick={load}>
                    Try again
                  </button>
                }
              />
            ) : !all ? (
              <div className="product-grid product-grid--3" aria-busy="true" aria-label="Loading products">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : results.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No pieces found"
                text="Nothing matches these filters. Try removing a filter or searching for something else."
                action={
                  <button type="button" className="btn btn--primary" onClick={clearAll}>
                    Clear filters
                  </button>
                }
              />
            ) : (
              <>
                <p className="shop__count" aria-live="polite">
                  Showing {Math.min(visible, results.length)} of {results.length} {results.length === 1 ? 'piece' : 'pieces'}
                </p>
                <div className="product-grid product-grid--3">
                  {results.slice(0, visible).map((p, i) => (
                    <ProductCard key={p.id} product={p} eager={i < 3} />
                  ))}
                </div>
                {visible < results.length && (
                  <div className="shop__more">
                    <span className="shop__progress" aria-hidden="true">
                      <span style={{ width: `${(visible / results.length) * 100}%` }} />
                    </span>
                    <button type="button" className="btn btn--outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                      Load more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {createPortal(
        <div className={classNames('fdrawer', drawer && 'is-open')} aria-hidden={!drawer}>
        <div className="fdrawer__scrim" onClick={closeDrawer} />
        <div className="fdrawer__panel" role="dialog" aria-modal="true" aria-label="Filters">
          <header className="drawer__head">
            <h2>Filters</h2>
            <button type="button" className="icon-btn" onClick={closeDrawer} aria-label="Close filters">
              <X size={20} strokeWidth={1.3} />
            </button>
          </header>
          <div className="fdrawer__body">
            <Filters {...filterProps} />
          </div>
          <footer className="drawer__foot">
            <button type="button" className="btn btn--primary btn--block" onClick={closeDrawer}>
              Show {results.length} {results.length === 1 ? 'piece' : 'pieces'}
            </button>
          </footer>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
