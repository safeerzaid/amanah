import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Media from '../components/Media';
import { PageHeader } from '../components/ui';
import { collections } from '../data/collections';
import { products } from '../data/products';
import { site } from '../data/site';
import { text } from '../data/content';

export default function Collections() {
  useEffect(() => {
    document.title = `Collections | ${site.name}`;
  }, []);

  return (
    <>
      {/* PageHeader includes the scroll animation on its title. */}
      <PageHeader
        title={text('collections.title', 'Collections')}
        intro={text('collections.intro', 'Each collection is a chapter: a sentiment, a tale and an enduring bond.')}
        crumbs={[{ label: 'Collections' }]}
      />

      <section className="container cgrid page-pad-b">
        {collections.map((c, i) => {
          const count = products.filter((p) => p.category === c.id).length;
          const url = `/shop?category=${c.id}`;
          return (
            <article key={c.id} className={`ccard${i < 2 ? ' ccard--lg' : ''}`}>
              <Link to={url} className="ccard__img" tabIndex={-1} aria-hidden="true">
                <Media {...c.media} alt="" eager={i < 2} />
              </Link>
              <div className="ccard__body">
                <div className="ccard__head">
                  <h2 className="ccard__name">
                    <Link to={url}>{c.name}</Link>
                  </h2>
                  <span className="ccard__count">
                    {count} {count === 1 ? 'piece' : 'pieces'}
                  </span>
                </div>
                <p className="ccard__text">{c.description}</p>
                <Link to={url} className="ccard__link">
                  Shop {c.name.toLowerCase()} <ArrowRight size={14} strokeWidth={1.4} />
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
