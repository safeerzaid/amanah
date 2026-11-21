import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Reviews' };

export default function ReviewsPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Reviews</h1>
          <p className="muted">Customer reviews of products.</p>
        </div>
      </div>
      <div className="card empty">
        <h2>Not set up yet</h2>
        <p className="muted">
          The shop does not collect reviews yet. Adding them needs a reviews table in the database and a review form on the product page. Reviews
          would then appear here for you to approve or hide.
        </p>
      </div>
    </>
  );
}
