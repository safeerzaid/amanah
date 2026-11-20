'use client';

import { useActionState } from 'react';
import { uploadImages, type FormState } from '../../actions';

export default function UploadForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(uploadImages.bind(null, productId), null);
  return (
    <form action={action} className="form">
      <div className="form-grid">
        <label>
          Photos
          <input type="file" name="photos" accept="image/jpeg,image/png,image/webp,image/avif" multiple required />
        </label>
        <label>
          View <span className="hint">Optional, e.g. &quot;Front view&quot; or &quot;Worn&quot;.</span>
          <input name="view" maxLength={60} />
        </label>
      </div>
      {state?.error && (
        <p className="alert alert--error" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="alert alert--ok" role="status">
          {state.ok}
        </p>
      )}
      <div>
        <button className="btn" disabled={pending}>
          {pending ? 'Uploading…' : 'Upload'}
        </button>
      </div>
    </form>
  );
}
