'use client';

import { useActionState, useRef, useState } from 'react';
import { addCategory, type FormState } from '../actions';

/** One line: a name and an Add button. */
export default function AddCategoryForm() {
  const form = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [okShown, setOkShown] = useState(false);

  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, data) => {
    const result = await addCategory(prev, data);
    if (result?.ok) {
      // Clear the field for the next one, and show "Added …" for a few seconds only,
      // so it doesn't linger once the list has changed again.
      form.current?.reset();
      setOkShown(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setOkShown(false), 3000);
    }
    return result;
  }, null);

  return (
    <form ref={form} action={action} className="cat-add" data-tour="category-add">
      <div className="cat-add__row">
        <input name="name" required maxLength={60} placeholder="New category name, e.g. Anklets" aria-label="New category name" />
        <button className="btn" disabled={pending}>
          {pending ? 'Adding…' : 'Add'}
        </button>
      </div>
      {state?.error && (
        <p className="cat-add__msg cat-add__msg--error" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && okShown && (
        <p className="cat-add__msg" role="status">
          {state.ok}
        </p>
      )}
    </form>
  );
}
