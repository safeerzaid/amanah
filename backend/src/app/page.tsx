import Link from 'next/link';

export default function Home() {
  return (
    <main className="center-card">
      <div className="card">
        <h1>Amanah Jewellery API</h1>
        <p className="muted">This server powers the storefront. Store staff can sign in to manage products and orders.</p>
        <p>
          <Link className="btn" href="/admin">
            Open the admin
          </Link>
        </p>
      </div>
    </main>
  );
}
