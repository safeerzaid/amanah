import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listCategories } from '@/lib/categories';
import { db } from '@/lib/db';
import { previewUrl, storeCurrency, storefrontOrigins } from '@/lib/env';
import { toUnits } from '@/lib/money';
import { parseVariants, specsSchema } from '@/lib/products';
import { deleteImage, deleteProduct, makePrimaryImage } from '../../actions';
import ConfirmButton from '../../ConfirmButton';
import ProductForm from '../ProductForm';
import UploadForm from './UploadForm';

export const metadata: Metadata = { title: 'Edit product' };

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" />
  </svg>
);

export default async function EditProductPage({ params }: PageProps<'/admin/products/[id]'>) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { images: { orderBy: { position: 'asc' } } } }),
    listCategories(),
  ]);
  if (!product) notFound();

  const specs = specsSchema.catch([]).parse(product.specs);
  const [main, ...rest] = product.images;
  const shopUrl = `${storefrontOrigins()[0] ?? ''}/product/${product.slug}`;

  return (
    <>
      <div className="phead">
        <Link href="/admin/products" className="icon-btn" aria-label="Back to products" title="Back to products">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <div className="phead__title">
          <h1>{product.name}</h1>
          <a href={shopUrl} target="_blank" rel="noreferrer" className="small">
            View in shop ↗
          </a>
        </div>
        <form action={deleteProduct.bind(null, product.id)} data-tour="product-delete">
          <ConfirmButton
            className="icon-btn icon-btn--danger"
            label={`Delete ${product.name}`}
            title="Delete product"
            message={`Delete ${product.name} and its photos? This cannot be undone.`}
          >
            <TrashIcon />
          </ConfirmButton>
        </form>
      </div>

      <div className="pedit">
        <section className="card pphotos" data-tour="product-photos">
          <h2>Photos</h2>
          {main ? (
            <div className="pphotos__main">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl(main.url)} alt={main.alt || product.name} />
              <span className="badge badge--featured pphotos__tag">Main photo</span>
              <form action={deleteImage.bind(null, main.id)} className="pphotos__del">
                <ConfirmButton className="icon-btn icon-btn--danger" label="Delete main photo" title="Delete photo" message="Delete this photo?">
                  <TrashIcon />
                </ConfirmButton>
              </form>
            </div>
          ) : (
            <div className="pphotos__empty">No photos yet</div>
          )}

          {rest.length > 0 && (
            <ul className="pphotos__grid">
              {rest.map((img) => (
                <li key={img.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl(img.url)} alt={img.alt || product.name} />
                  <div className="pphotos__actions">
                    <form action={makePrimaryImage.bind(null, img.id)}>
                      <button className="icon-btn" aria-label="Make this the main photo" title="Make main photo">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
                        </svg>
                      </button>
                    </form>
                    <form action={deleteImage.bind(null, img.id)}>
                      <ConfirmButton className="icon-btn icon-btn--danger" label="Delete photo" title="Delete photo" message="Delete this photo?">
                        <TrashIcon />
                      </ConfirmButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <UploadForm productId={product.id} />
        </section>

        <ProductForm
          productId={product.id}
          currency={storeCurrency()}
          categories={categories}
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
      </div>
    </>
  );
}
