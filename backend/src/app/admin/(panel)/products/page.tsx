import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { previewUrl, storeCurrency } from '@/lib/env';
import { listCategories, UNCATEGORISED } from '@/lib/categories';
import { formatMoney } from '@/lib/money';
import { deleteProductFromList } from '../actions';
import ConfirmButton from '../ConfirmButton';
import FilterTabs from '../FilterTabs';

export const metadata: Metadata = { title: 'Products' };

export default async function ProductsPage({ searchParams }: PageProps<'/admin/products'>) {
  const raw = (await searchParams).category;
  const categories = await listCategories();
  // ?category=none lists products taken out of every category.
  const category = raw === 'none' ? 'none' : typeof raw === 'string' && categories.some((c) => c.id === raw) ? raw : null;
  const products = await db.product.findMany({
    where: category === 'none' ? { category: UNCATEGORISED } : category ? { category } : {},
    include: { images: { orderBy: { position: 'asc' }, take: 1 } },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  });
  const currency = storeCurrency();
  const uncategorised = await db.product.count({ where: { category: UNCATEGORISED } });
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—';

  return (
    <>
      <div className="page-head">
        <h1>Products</h1>
        <Link className="btn" href="/admin/products/new">
          Add product
        </Link>
      </div>
      <FilterTabs
        label="Filter by category"
        tabs={[
          { href: '/admin/products', label: 'All', active: !category },
          ...categories.map((c) => ({ href: `/admin/products?category=${c.id}`, label: c.name, active: c.id === category })),
          ...(uncategorised > 0 || category === 'none' ? [{ href: '/admin/products?category=none', label: 'Uncategorised', active: category === 'none' }] : []),
        ]}
      />
      {products.length === 0 ? (
        <div className="card muted">No products yet. Add one, or run `npm run db:seed` to load the demo catalogue.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th aria-label="Photo" />
                <th>Name</th>
                <th>Category</th>
                <th className="num">Price</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="thumb" src={previewUrl(p.images[0].url)} alt="" />
                    ) : (
                      <span className="thumb" />
                    )}
                  </td>
                  <td>
                    <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
                    <div className="muted small">{p.slug}</div>
                  </td>
                  <td>{categoryName(p.category)}</td>
                  <td className="num">
                    {p.salePrice != null ? (
                      <>
                        {formatMoney(p.salePrice, currency)} <s className="muted small">{formatMoney(p.price, currency)}</s>
                      </>
                    ) : (
                      formatMoney(p.price, currency)
                    )}
                  </td>
                  <td>
                    <div className="row">
                      {!p.inStock && <span className="badge badge--out">Sold out</span>}
                      {p.featured && <span className="badge badge--featured">Featured</span>}
                      {p.isNew && <span className="badge badge--new">New</span>}
                    </div>
                  </td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/admin/products/${p.id}`} className="icon-btn" aria-label={`Edit ${p.name}`} title="Edit">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
                          <path d="m13.5 6.5 4 4" />
                        </svg>
                      </Link>
                      <form action={deleteProductFromList.bind(null, p.id)}>
                        <ConfirmButton
                          className="icon-btn icon-btn--danger"
                          label={`Delete ${p.name}`}
                          title="Delete"
                          message={`Delete ${p.name} and its photos? This cannot be undone.`}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" />
                          </svg>
                        </ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
