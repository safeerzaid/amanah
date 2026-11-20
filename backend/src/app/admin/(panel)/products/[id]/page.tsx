import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { previewUrl, storeCurrency } from '@/lib/env';
import { toUnits } from '@/lib/money';
import { parseVariants, specsSchema } from '@/lib/products';
import { deleteImage, deleteProduct, makePrimaryImage, updateImageDetails } from '../../actions';
import ConfirmButton from '../../ConfirmButton';
import ProductForm from '../ProductForm';
import UploadForm from './UploadForm';

export const metadata: Metadata = { title: 'Edit product' };

export default async function EditProductPage({ params }: PageProps<'/admin/products/[id]'>) {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id }, include: { images: { orderBy: { position: 'asc' } } } });
  if (!product) notFound();

  const specs = specsSchema.catch([]).parse(product.specs);

  return (
    <>
      <div className="page-head">
        <h1>{product.name}</h1>
        <div className="row">
          <Link className="btn btn--ghost" href="/admin/products">
            Back to products
          </Link>
          <form action={deleteProduct.bind(null, product.id)}>
            <ConfirmButton className="btn btn--danger" message={`Delete ${product.name} and its photos? This cannot be undone.`}>
              Delete product
            </ConfirmButton>
          </form>
        </div>
      </div>

      <ProductForm
        productId={product.id}
        currency={storeCurrency()}
        values={{
          name: product.name,
          slug: product.slug,
          category: product.category,
          short: product.short,
          description: product.description,
          price: String(toUnits(product.price)),
          salePrice: product.salePrice == null ? '' : String(toUnits(product.salePrice)),
          tone: product.tone,
          sortOrder: String(product.sortOrder),
          inStock: product.inStock,
          featured: product.featured,
          isNew: product.isNew,
          variants: parseVariants(product.variants)
            .map((v) => `${v.name}: ${v.options.join(', ')}`)
            .join('\n'),
          specs: specs.map((s) => `${s.label}: ${s.value}`).join('\n'),
        }}
      />

      <section className="card">
        <h2>Photos</h2>
        <p className="muted small">The first photo is the main image on the storefront. JPEG, PNG, WebP or AVIF, up to 8 MB each.</p>
        {product.images.length > 0 && (
          <div className="gallery" style={{ marginBottom: 16 }}>
            {product.images.map((img, i) => (
              <figure key={img.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl(img.url)} alt={img.alt || product.name} />
                <figcaption>
                  <form action={updateImageDetails.bind(null, img.id)} className="form" style={{ gap: 6 }}>
                    <input name="view" defaultValue={img.view} placeholder="View, e.g. Worn" aria-label="View" />
                    <input name="alt" defaultValue={img.alt} placeholder="Alt text" aria-label="Alt text" />
                    <button className="btn btn--ghost btn--sm">Save</button>
                  </form>
                  <div className="row">
                    {i === 0 ? (
                      <span className="badge">Main</span>
                    ) : (
                      <form action={makePrimaryImage.bind(null, img.id)}>
                        <button className="btn btn--ghost btn--sm">Make main</button>
                      </form>
                    )}
                    <form action={deleteImage.bind(null, img.id)}>
                      <ConfirmButton className="btn btn--danger btn--sm" message="Delete this photo?">
                        Delete
                      </ConfirmButton>
                    </form>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
        <UploadForm productId={product.id} />
      </section>
    </>
  );
}
