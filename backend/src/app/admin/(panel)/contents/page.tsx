import type { Metadata } from 'next';
import { CONTENT, savedContent, SITE_IMAGES } from '@/lib/content';
import { previewUrl, storefrontOrigins } from '@/lib/env';
import { storageConfigured } from '@/lib/storage';
import FilterTabs from '../FilterTabs';
import ContentForm from './ContentForm';

export const metadata: Metadata = { title: 'Contents' };

export default async function ContentsPage({ searchParams }: PageProps<'/admin/contents'>) {
  const { s } = await searchParams;
  const section = CONTENT.find((c) => c.id === s) ?? CONTENT[0];
  const saved = await savedContent();
  const shop = storefrontOrigins()[0] ?? '';
  const edited = (id: string) =>
    CONTENT.find((c) => c.id === id)!
      .groups.flatMap((g) => g.fields)
      .filter((f) => f.key in saved && saved[f.key] !== f.default).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Contents</h1>
          <p className="muted">The words and photos on your shop, page by page. Products and categories have their own pages.</p>
        </div>
      </div>

      <FilterTabs
        label="Site sections"
        tabs={CONTENT.map((c) => {
          const n = edited(c.id);
          return { href: `/admin/contents?s=${c.id}`, label: n ? `${c.title} · ${n} edited` : c.title, active: c.id === section.id };
        })}
      />

      {/* Keyed by section, so switching tabs starts that section's form fresh. */}
      <ContentForm
        key={section.id}
        section={section}
        saved={saved}
        previewHref={`${shop}${section.preview}`}
        library={SITE_IMAGES.map((src) => ({ value: src, preview: previewUrl(src) }))}
        shopOrigin={shop}
        uploadsLocal={!storageConfigured()}
      />
    </>
  );
}
