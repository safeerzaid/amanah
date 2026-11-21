'use client';

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { ContentField, ContentSection } from '@/lib/content';
import { saveContent, uploadContentPhoto, type FormState } from '../actions';
import PreviewPanel from './PreviewPanel';

type LibraryImage = { value: string; preview: string };

type Props = {
  section: ContentSection;
  saved: Record<string, string>;
  previewHref: string;
  library: LibraryImage[];
  shopOrigin: string;
  uploadsLocal: boolean;
};

export default function ContentForm({ section, saved, previewHref, library, shopOrigin, uploadsLocal }: Props) {
  const fields = section.groups.flatMap((g) => g.fields);
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.key, saved[f.key] ?? f.default])));
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, data) => {
    const result = await saveContent(section.id, prev, data);
    // A required text saved blank went back to the original wording; show that.
    if (result?.ok) setValues((v) => ({ ...v, ...Object.fromEntries(fields.filter((f) => f.type !== 'image' && !f.optional && !v[f.key].trim()).map((f) => [f.key, f.default])) }));
    return result;
  }, null);
  const set = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));
  // Photo paths like /images/x.jpg belong to the storefront.
  const resolve = (src: string) => (src.startsWith('/') ? `${shopOrigin}${src}` : src);
  const changed = fields.filter((f) => values[f.key] !== (saved[f.key] ?? f.default)).length;
  const [previewing, setPreviewing] = useState(false);
  // What the shop would show: everything saved, with this tab's unsaved values on top.
  const previewContent = useMemo(() => {
    const next = { ...saved };
    for (const f of fields) {
      if (values[f.key] !== f.default) next[f.key] = values[f.key];
      else delete next[f.key];
    }
    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fields come from the section, which keys this form
  }, [saved, values]);

  return (
    <form action={action} className="content-form">
      <p className="content-form__intro muted">
        {section.intro}{' '}
        <a href={previewHref} target="_blank" rel="noopener noreferrer">
          View on the shop ↗
        </a>
        {uploadsLocal && <span className="content-form__note">Uploaded photos are kept on this server (S3 is not set up).</span>}
      </p>

      {section.groups.map((group, i) => {
        const texts = group.fields.filter((f) => f.type !== 'image');
        const photos = group.fields.filter((f) => f.type === 'image');
        const edited = group.fields.filter((f) => values[f.key] !== f.default).length;
        const summary = [texts.length && `${texts.length} ${texts.length === 1 ? 'text' : 'texts'}`, photos.length && `${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}`]
          .filter(Boolean)
          .join(' · ');
        return (
          // Closed sections still send their fields when saving.
          <details key={group.title} className="card content-group" open={i === 0} data-tour="content-group">
            <summary>
              <span className="content-group__title">{group.title}</span>
              <span className="content-group__meta">{summary}</span>
              {edited > 0 && <span className="badge badge--PAID">{edited} edited</span>}
              <svg className="content-group__chev" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <div className="content-group__body">
              {texts.length > 0 && (
                <div className="content-group__fields">
                  {texts.map((f) => (
                    <TextField key={f.key} field={f} value={values[f.key]} onChange={(v) => set(f.key, v)} />
                  ))}
                </div>
              )}
              {photos.length > 0 && (
                <div className="content-photos">
                  {photos.map((f) => (
                    <ImageField key={f.key} field={f} value={values[f.key]} onChange={(v) => set(f.key, v)} resolve={resolve} library={library} />
                  ))}
                </div>
              )}
            </div>
          </details>
        );
      })}

      <div className="pform__bar">
        <span className={`pform__msg${state?.error ? ' pform__msg--error' : ''}`} role={state?.error ? 'alert' : 'status'}>
          {pending ? '' : (state?.error ?? (changed ? `${changed} unsaved ${changed === 1 ? 'change' : 'changes'}` : (state?.ok ?? '')))}
        </span>
        <button type="button" className="btn btn--ghost" onClick={() => setPreviewing(true)} data-tour="preview">
          Preview
        </button>
        <button className="btn" disabled={pending} data-tour="save">
          {pending ? 'Saving…' : `Save ${section.title.toLowerCase()}`}
        </button>
      </div>
      {previewing && <PreviewPanel shopOrigin={shopOrigin} startPath={section.preview} content={previewContent} onClose={() => setPreviewing(false)} />}
    </form>
  );
}

function FieldHead({ field, value, onReset }: { field: ContentField; value: string; onReset: () => void }) {
  const edited = value !== field.default;
  return (
    <span className="content-field__head">
      <span>{field.label}</span>
      {field.optional && !value && <span className="hint">Optional</span>}
      {edited && field.default !== '' && (
        <button type="button" className="content-field__reset" onClick={onReset} title={`Back to: ${field.default || 'no photo'}`}>
          Reset to original
        </button>
      )}
    </span>
  );
}

function TextField({ field, value, onChange }: { field: ContentField; value: string; onChange: (v: string) => void }) {
  const long = field.type === 'textarea';
  const props = {
    name: field.key,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    placeholder: field.optional ? 'Not shown on the shop' : field.default,
  };
  return (
    <label className={`content-field${long ? ' content-field--wide' : ''}`}>
      <FieldHead field={field} value={value} onReset={() => onChange(field.default)} />
      {long ? (
        <textarea {...props} rows={Math.min(8, Math.max(2, Math.ceil(field.default.length / 90)))} maxLength={4000} />
      ) : (
        <input {...props} type={field.type === 'text' ? 'text' : field.type} maxLength={500} autoComplete="off" />
      )}
      {field.hint && <span className="hint">{field.hint}</span>}
    </label>
  );
}

function ImageField({
  field,
  value,
  onChange,
  resolve,
  library,
}: {
  field: ContentField;
  value: string;
  onChange: (v: string) => void;
  resolve: (src: string) => string;
  library: LibraryImage[];
}) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [error, setError] = useState('');
  const [uploading, startUpload] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!libraryOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setLibraryOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLibraryOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [libraryOpen]);

  const upload = (file: File) => {
    setError('');
    const data = new FormData();
    data.append('photo', file);
    startUpload(async () => {
      const result = await uploadContentPhoto(data);
      if (result.url) onChange(result.url);
      else setError(result.error ?? 'The photo could not be uploaded.');
    });
  };

  return (
    <div className="photo-tile" ref={box}>
      <input type="hidden" name={field.key} value={value} />
      <button type="button" className={`photo-tile__img${value ? '' : ' is-empty'}`} onClick={() => setLibraryOpen((o) => !o)} title="Choose a photo">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- any host, including the storefront's own /images
          <img src={resolve(value)} alt="" />
        ) : (
          <span>No photo</span>
        )}
        {uploading && <span className="photo-tile__busy">Uploading…</span>}
      </button>

      <div className="photo-tile__body">
        <span className="photo-tile__name">{field.label}</span>
        {field.hint && <span className="hint">{field.hint}</span>}
        <div className="photo-tile__actions">
          <button type="button" className="photo-tile__btn" onClick={() => fileInput.current?.click()} disabled={uploading}>
            Upload
          </button>
          <button type="button" className="photo-tile__btn" onClick={() => setLibraryOpen((o) => !o)} aria-expanded={libraryOpen}>
            Choose
          </button>
          {value && (
            <button type="button" className="photo-tile__btn photo-tile__btn--danger" onClick={() => onChange('')} aria-label={`Remove ${field.label}`}>
              Remove
            </button>
          )}
        </div>
        {value !== field.default && field.default !== '' && (
          <button type="button" className="content-field__reset" onClick={() => onChange(field.default)}>
            Reset to original
          </button>
        )}
        {error && (
          <span className="content-image__error" role="alert">
            {error}
          </span>
        )}
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = '';
        }}
      />
      {libraryOpen && (
        <div className="content-library" role="dialog" aria-label="Choose a photo">
          <p className="content-library__title">Photos on your site</p>
          <div className="content-library__grid">
            {library.map((img) => (
              <button
                key={img.value}
                type="button"
                className={`content-library__item${img.value === value ? ' is-current' : ''}`}
                onClick={() => {
                  onChange(img.value);
                  setLibraryOpen(false);
                }}
                aria-label={img.value.split('/').pop()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- storefront photo */}
                <img src={img.preview} alt="" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
