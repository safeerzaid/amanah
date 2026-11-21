import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { storeName } from '@/lib/env';
import ContactForm from './ContactForm';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const rows = await db.setting.findMany({ where: { key: { in: ['contactEmail', 'contactPhone'] } } });
  const get = (key: string) => rows.find((r) => r.key === key)?.value ?? '';

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p className="muted">Your shop&apos;s details.</p>
        </div>
      </div>

      <section className="card">
        <h2>Store</h2>
        <dl className="details">
          <dt>Store name</dt>
          <dd>{storeName()}</dd>
        </dl>
      </section>

      <ContactForm email={get('contactEmail')} phone={get('contactPhone')} />
    </>
  );
}
