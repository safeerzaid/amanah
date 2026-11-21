import { Fragment } from 'react';
import { media } from './media';
import { API_URL, site } from './site';

/**
 * Text and photos edited on the admin's Contents page. Filled once at start-up
 * from the backend; anything not edited keeps the copy written in the pages.
 */
const edits = {};

// The built-in values, kept so a preview can start again from a clean slate.
const original = {
  site: { announcement: site.announcement, announcementShort: site.announcementShort, tagline: site.tagline },
  contact: { ...site.contact },
  social: { ...site.social },
  media: Object.fromEntries(Object.entries(media).map(([k, v]) => [k, v.src])),
};

// Lets the app re-render when previewed content arrives.
let version = 0;
const listeners = new Set();
export const subscribeContent = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const contentVersion = () => version;

/** Replaces every edit with `values` (used by the admin's live preview). */
function replaceContent(values) {
  for (const key of Object.keys(edits)) delete edits[key];
  Object.assign(site, original.site);
  Object.assign(site.contact, original.contact);
  Object.assign(site.social, original.social);
  for (const [k, src] of Object.entries(original.media)) media[k].src = src;
  setContent(values);
  version += 1;
  listeners.forEach((l) => l());
}

/**
 * Preview mode: when the admin's Contents page shows this shop in its preview
 * window (?preview in the URL), it sends the unsaved text and photos here.
 * Only messages from the backend's own origin are accepted.
 */
export function startPreview() {
  if (window.parent === window || !API_URL || !new URLSearchParams(window.location.search).has('preview')) return;
  const admin = new URL(API_URL).origin;
  window.addEventListener('message', (e) => {
    if (e.origin !== admin || e.data?.type !== 'amanah-preview' || typeof e.data.content !== 'object') return;
    replaceContent(e.data.content);
  });
  window.parent.postMessage({ type: 'amanah-preview-ready' }, admin);
}

/** The edited value for `key`, or the page's own `fallback`. */
export const text = (key, fallback) => edits[key] ?? fallback;

/** True when the owner has changed `key` from the built-in copy. */
export const isEdited = (key) => key in edits;

/** Renders a heading where *stars* mark the gold italic accent, e.g. "The beauty *of trust*". */
export function Accent({ value }) {
  return value.split(/(\*[^*]+\*)/).map((part, i) =>
    part.startsWith('*') && part.endsWith('*') && part.length > 2 ? <em key={i}>{part.slice(1, -1)}</em> : <Fragment key={i}>{part}</Fragment>,
  );
}

/** Applies the backend's edits to the shared site and media settings. */
export function setContent(values = {}) {
  Object.assign(edits, values);

  for (const key of ['announcement', 'announcementShort', 'tagline']) {
    if (values[`site.${key}`]) site[key] = values[`site.${key}`];
  }
  // Contact details: an empty value means "not set" (the shop shows "Coming soon").
  const contact = { email: 'contactEmail', phone: 'contactPhone', whatsapp: 'contact.whatsapp', address: 'contact.address', hours: 'contact.hours' };
  for (const [field, key] of Object.entries(contact)) {
    if (key in values) site.contact[field] = values[key] || null;
  }
  if (site.contact.whatsapp) site.contact.whatsapp = site.contact.whatsapp.replace(/\D/g, '');
  for (const network of Object.keys(site.social)) {
    if (`social.${network}` in values) site.social[network] = values[`social.${network}`] || null;
  }
  // Photos: an empty value shows the brand placeholder instead.
  for (const [key, value] of Object.entries(values)) {
    const slot = key.startsWith('image.') && media[key.slice(6)];
    if (slot) slot.src = value || null;
  }
}
