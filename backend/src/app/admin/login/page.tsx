import type { Metadata } from 'next';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/auth';
import LoginForm from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage() {
  if (await getAdmin()) redirect('/admin');
  return (
    <main className="center-card">
      <div className="card">
        <Image className="login__logo" src="/brand/logo-burgundy.png" alt="Amanah Jewellery" width={550} height={163} priority />
        <h1>Amanah admin</h1>
        <p className="muted small">Sign in to manage products and orders.</p>
        <LoginForm />
      </div>
    </main>
  );
}
