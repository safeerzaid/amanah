'use client';

import { useActionState } from 'react';
import { loginAction } from './actions';

export default function LoginForm() {
  const [error, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="form">
      <label>
        Email
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}
      <button className="btn" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
