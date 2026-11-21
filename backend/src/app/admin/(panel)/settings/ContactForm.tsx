'use client';

import { useActionState, useState } from 'react';
import { saveContact, type FormState } from '../actions';

export default function ContactForm({ email, phone }: { email: string; phone: string }) {
  // Controlled, so a failed save keeps what was typed (React resets uncontrolled fields).
  const [values, setValues] = useState({ contactEmail: email, contactPhone: phone });
  const bind = (name: keyof typeof values) => ({ name, value: values[name], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValues({ ...values, [name]: e.target.value }) });
  const [state, action, pending] = useActionState<FormState, FormData>(saveContact, null);

  return (
    <form action={action} className="card contact-form">
      <h2>Contact</h2>
      <div className="contact-form__grid">
        <label>
          Email
          <input {...bind('contactEmail')} type="email" maxLength={200} placeholder="hello@amanah.com" />
        </label>
        <label>
          Phone
          <input {...bind('contactPhone')} type="tel" maxLength={30} placeholder="+91 98765 43210" />
        </label>
        <button className="btn" disabled={pending}>
          {pending ? 'Saving…' : 'Save'}
        </button>
      </div>
      {state?.error && (
        <p className="cat-add__msg cat-add__msg--error" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="cat-add__msg" role="status">
          {state.ok}
        </p>
      )}
    </form>
  );
}
