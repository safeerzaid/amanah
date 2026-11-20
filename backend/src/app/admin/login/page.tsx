import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/auth';
import LoginForm from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage() {
  if (await getAdmin()) redirect('/admin');
  return (
    <main className="center-card">
      <div className="card">
        <h1>Amanah admin</h1>
        <p className="muted small">Sign in to manage products and orders.</p>
        <LoginForm />
      </div>
    </main>
  );
}
