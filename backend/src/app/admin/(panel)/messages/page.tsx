import type { Metadata } from 'next';
import { db } from '@/lib/db';

export const metadata: Metadata = { title: 'Enquiries' };

export default async function EnquiriesPage() {
  const [messages, subscribers] = await Promise.all([
    db.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
    db.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);

  return (
    <>
      <div className="page-head">
        <h1>Enquiries</h1>
      </div>

      {messages.length === 0 ? (
        <div className="card muted">No enquiries yet. Messages sent through the contact form appear here.</div>
      ) : (
        messages.map((m) => (
          <article key={m.id} className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong>
                {m.name} · <a href={`mailto:${m.email}`}>{m.email}</a>
              </strong>
              <span className="muted small">
                {m.topic && <span className="badge">{m.topic}</span>} {m.createdAt.toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
            <p className="pre">{m.message}</p>
          </article>
        ))
      )}

      <section className="card">
        <h2>Newsletter subscribers ({subscribers.length})</h2>
        {subscribers.length === 0 ? (
          <p className="muted">No sign-ups yet.</p>
        ) : (
          <>
            <p className="muted small">Copy this list into your email tool.</p>
            <textarea readOnly rows={Math.min(12, subscribers.length + 1)} value={subscribers.map((s) => s.email).join('\n')} aria-label="Subscriber emails" />
          </>
        )}
      </section>
    </>
  );
}
