import 'server-only';

/** Reads an optional setting; empty strings count as unset. */
export function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

export const storeCurrency = () => env('STORE_CURRENCY') ?? 'CAD';
export const storeName = () => env('STORE_NAME') ?? 'Amanah Jewellery';

/** Origins allowed to call the public API from a browser (comma-separated). */
export const storefrontOrigins = () =>
  (env('STOREFRONT_ORIGIN') ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);

/** Turns a storefront-relative image path (e.g. /images/x.jpg) into a full URL for admin previews. */
export const previewUrl = (url: string) => (url.startsWith('/') ? `${storefrontOrigins()[0] ?? ''}${url}` : url);
