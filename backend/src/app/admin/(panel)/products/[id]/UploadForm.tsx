'use client';

import { useActionState, useRef } from 'react';
import { uploadImages, type FormState } from '../../actions';

/** "Add photos": choosing files uploads them straight away. */
export default function UploadForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(uploadImages.bind(null, productId), null);
  const form = useRef<HTMLFormElement>(null);

  return (
    <form ref={form} action={action} className="upload">
      <label className={`upload__drop${pending ? ' is-busy' : ''}`}>
        <input
          type="file"
          name="photos"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          required
          disabled={pending}
          onChange={(e) => {
            if (e.currentTarget.files?.length) form.current?.requestSubmit();
          }}
        />
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 16V5M7.5 9.5 12 5l4.5 4.5M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15" />
        </svg>
        <span>{pending ? 'Uploading…' : 'Add photos'}</span>
        <span className="hint">JPEG, PNG, WebP or AVIF, up to 8 MB</span>
      </label>
      {state?.error && (
        <p className="upload__msg upload__msg--error" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="upload__msg" role="status">
          {state.ok}
        </p>
      )}
    </form>
  );
}
