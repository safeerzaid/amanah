import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { setInStock } from '../actions';

export const metadata: Metadata = { title: 'Inventory' };

export default async function InventoryPage() {
  const products = await db.product.findMany({ orderBy: [{ inStock: 'asc' }, { category: 'asc' }, { name: 'asc' }] });
  const out = products.filter((p) => !p.inStock).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Inventory</h1>
          <p className="muted">
            {products.length} products · {out} sold out. Sold-out pieces stay on the shop but cannot be added to the bag.
          </p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Stock</th>
              <th className="num" aria-label="Action" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
                </td>
                <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                <td>{p.inStock ? <span className="badge badge--PAID">In stock</span> : <span className="badge badge--out">Sold out</span>}</td>
                <td className="num">
                  <form action={setInStock.bind(null, p.id, !p.inStock)}>
                    <button className="btn btn--ghost btn--sm">{p.inStock ? 'Mark sold out' : 'Mark in stock'}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
