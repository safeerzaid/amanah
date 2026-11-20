import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { previewUrl, storeCurrency } from '@/lib/env';
import { formatMoney } from '@/lib/money';

export const metadata: Metadata = { title: 'Products' };

export default async function ProductsPage() {
  const products = await db.product.findMany({
    include: { images: { orderBy: { position: 'asc' }, take: 1 } },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  });
  const currency = storeCurrency();

  return (
    <>
      <div className="page-head">
        <h1>Products</h1>
        <Link className="btn" href="/admin/products/new">
          Add product
        </Link>
      </div>
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
                  <td>{p.category}</td>
                  <td className="num">
                    {p.salePrice != null ? (
                      <>
                        {formatMoney(p.salePrice, currency)} <s className="muted small">{formatMoney(p.price, currency)}</s>
                      </>
                    ) : (
                      formatMoney(p.price, currency)
                    )}
                  </td>
                  <td className="row">
                    {!p.inStock && <span className="badge badge--out">Sold out</span>}
                    {p.featured && <span className="badge">Featured</span>}
                    {p.isNew && <span className="badge">New</span>}
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
