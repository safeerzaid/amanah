'use server';

import { redirect } from 'next/navigation';
import { login, logout } from '@/lib/auth';

export async function loginAction(_prev: string | null, formData: FormData): Promise<string | null> {
  const error = await login(String(formData.get('email') ?? ''), String(formData.get('password') ?? ''));
  if (error) return error;
  redirect('/admin');
}

export async function logoutAction() {
  await logout();
  redirect('/admin/login');
}
