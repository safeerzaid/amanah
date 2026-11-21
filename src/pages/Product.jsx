import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Gem } from 'lucide-react';
import ProductGallery from '../components/ProductGallery';
import PurchasePanel from '../components/PurchasePanel';
import ProductCard from '../components/ProductCard';
import { EmptyState, Price, SectionHeading } from '../components/ui';
import { getCollection } from '../data/collections';
import { getProductBySlug, products } from '../data/products';
import { site } from '../data/site';

export default function Product() {
  const { slug } = useParams();
  const product = getProductBySlug(slug);
  const collection = product && getCollection(product.category);

  useEffect(() => {
    document.title = `${product ? product.name : 'Piece not found'} | ${site.name}`;
  }, [product]);

  if (!product) {
    return (
      <div className="container page-pad">
        <EmptyState
          icon={Gem}
          title="This piece could not be found"
          text="It may have been renamed or is no longer part of the collection."
          action={
            <Link to="/shop" className="btn btn--primary">
              Browse the collection
            </Link>
          }
        />
      </div>
    );
  }

  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const fill = related.length < 4 ? products.filter((p) => p.category !== product.category && p.featured).slice(0, 4 - related.length) : [];

  return (
    <>
      <section className="pdp container">
        <nav aria-label="Breadcrumb" className="crumbs pdp__crumbs">
          <Link to="/">Home</Link>
          <span aria-hidden="true" className="crumbs__sep">/</span>
          <Link to="/shop">Shop</Link>
          <span aria-hidden="true" className="crumbs__sep">/</span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="pdp__grid">
          <div className="pdp__gallery">
            <ProductGallery product={product} key={product.id} />
          </div>

          <div className="pdp__info">
            <div className="pdp__sticky">
              {collection && (
                <Link to={`/shop?category=${product.category}`} className="pdp__cat">
                  {collection.name}
                </Link>
              )}
              <h1 className="pdp__name">{product.name}</h1>
              <Price product={product} className="price--lg pdp__price" />
              <p className="pdp__desc">{product.description}</p>

              <PurchasePanel product={product} key={product.id} />

              <div className="pdp__details">
                <h2 className="pdp__details-title">Details</h2>
                <dl className="specs">
                  {product.specs.map((s) => (
                    <div key={s.label}>
                      <dt>{s.label}</dt>
                      <dd className={s.value === 'To be confirmed' ? 'is-tbc' : undefined}>{s.value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="pdp__note">
                  {site.shippingNote} Questions? <Link to="/contact">Contact us</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <SectionHeading title="You may also like" link={{ to: '/shop', label: 'Shop all' }} />
          <div className="product-grid product-grid--4">
            {[...related, ...fill].map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
