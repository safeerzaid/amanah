import { useEffect, useRef } from 'react';
import { useInView } from '../hooks/useInView';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Media from '../components/Media';
import ProductCard from '../components/ProductCard';
import NewsletterForm from '../components/Newsletter';
import { Monogram } from '../components/Logo';
import { Reveal, SectionHeading } from '../components/ui';
import { collections } from '../data/collections';
import { products } from '../data/products';
import { brandStory, site } from '../data/site';
import { media } from '../data/media';
import { Accent, isEdited, text } from '../data/content';

function Hero() {
  const videoRef = useRef(null);
  const customPhoto = isEdited('image.heroPoster');

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;

    const tryPlay = () => {
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };
    tryPlay();

    // If the phone held playback back, start on the first thing the visitor
    // does. No button is ever shown.
    const onFirstTouch = () => tryPlay();
    const events = ['touchstart', 'pointerdown', 'scroll', 'visibilitychange'];
    events.forEach((e) => window.addEventListener(e, onFirstTouch, { once: true, passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, onFirstTouch));
  }, []);

  return (
    <section className="hero" aria-label="Introduction">
      <div className="hero__bg">
        {/* The film plays silently behind the headline. Its poster is its own
            first frame, so nothing visibly swaps when playback starts; the same
            frame stands in when motion is turned down in the OS. */}
        {/* A hero photo chosen on the admin's Contents page replaces the film. */}
        {customPhoto ? (
          <Media id="heroPoster" eager className="hero__still hero__still--only" />
        ) : (
          <>
            <video
              ref={videoRef}
              className="media hero__video"
              controls={false}
              disablePictureInPicture
              disableRemotePlayback
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={media.heroPoster.src ?? undefined}
              aria-hidden="true"
            >
              <source src="/video/hero.mp4" type="video/mp4" />
            </video>
            <Media id="heroPoster" eager className="hero__still" />
          </>
        )}
      </div>
      <div className="hero__shade" aria-hidden="true" />

      <div className="hero__inner container">
        <h1 className="hero__title">
          <span className="hero__line">{text('home.heroLine1', 'crafted')}</span>
          <span className="hero__line hero__line--indent">{text('home.heroLine2', 'in trust')}</span>
          <span className="sr-only"> | {site.name}, {site.tagline}</span>
        </h1>

        <div className="hero__intro">
          <div className="hero__ctas">
            <Link to="/shop" className="btn btn--gold">
              {text('home.heroCta1', 'Shop collection')}
            </Link>
            <Link to="/about" className="btn btn--ghost-light">
              {text('home.heroCta2', 'Discover more')}
            </Link>
          </div>
        </div>

        <span className="hero__rule" aria-hidden="true" />
      </div>
    </section>
  );
}

function FeaturedCollections() {
  const [ref, inView] = useInView();
  return (
    <section className="section section--ivory">
      <div className="container">
        <ul className={`circles${inView ? ' is-in' : ''}`} ref={ref}>
          {collections.map((c, i) => {
            const count = products.filter((p) => p.category === c.id).length;
            return (
              <li key={c.id} className="circle" style={{ '--i': i }}>
                <Link to={`/shop?category=${c.id}`} className="circle__link">
                  <span className="circle__wrap">
                    <span className="circle__ring" aria-hidden="true" />
                    <span className="circle__img">
                      <Media {...c.media} alt="" />
                    </span>
                  </span>
                  <span className="circle__name">{c.name}</span>
                  <span className="circle__count">
                    {count} {count === 1 ? 'piece' : 'pieces'}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function FeaturedProducts() {
  const featured = products.filter((p) => p.featured).slice(0, 4);
  return (
    <section className="section section--white">
      <div className="container">
        <Reveal>
          <SectionHeading
            title={text('home.featuredTitle', 'Pieces to treasure')}
            intro={text('home.featuredIntro', 'Signature pieces from the Amanah collection, each one made to be gifted and kept.')}
            link={{ to: '/shop', label: 'Shop all' }}
          />
        </Reveal>
        <div className="showcase">
          {featured.map((p, i) => (
            <Reveal key={p.id} delay={i * 80}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function BrandStory() {
  return (
    <section className="section section--ivory story">
      <div className="container">
        <div className="story__intro">
          <h2 className="section-title">
            <Accent value={text('home.storyTitle', 'The beauty *of trust*')} />
          </h2>
          <p className="story__lead">{text('brandStory', brandStory)}</p>
          <Link to="/about" className="btn btn--primary">
            {text('home.storyCta', 'Read our story')} <ArrowRight size={15} strokeWidth={1.3} />
          </Link>
        </div>
        <div className="story__photos">
          <div className="story__photo">
            <Media id="storyDetail" />
          </div>
          <div className="story__photo story__photo--main">
            <Media id="storyMain" />
          </div>
          <div className="story__photo">
            <Media id="storyThird" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Editorial() {
  const frames = [
    { id: 'editorialTall', no: '01', caption: text('home.editCaption1', 'Sculpted gold') },
    { id: 'editorialWide', no: '02', caption: text('home.editCaption2', 'Held close') },
    { id: 'editorialSmall', no: '03', caption: text('home.editCaption3', 'Little hearts') },
  ];
  return (
    <section className="section section--deep editorial">
      <div className="container">
        <Reveal className="editorial__head">
          <h2 className="editorial__title">
            <Accent value={text('home.editTitle', 'The Amanah *edit*')} />
          </h2>
          <div className="editorial__intro">
            <p>
              {text(
                'home.editIntro',
                'Light, texture and quiet confidence. A study of pieces designed to be lived in and handed on, every moment framed with elegance.',
              )}
            </p>
            <Link to="/collections" className="btn btn--gold">
              {text('home.editCta', 'Explore the collections')} <ArrowRight size={15} strokeWidth={1.3} />
            </Link>
          </div>
        </Reveal>

        <div className="lookbook">
          {frames.map((f, i) => (
            <Reveal key={f.id} delay={i * 110} className={`lookbook__frame lookbook__frame--${i + 1}`}>
              <Media id={f.id} />
              <span className="lookbook__cap">
                <span className="lookbook__no">{f.no}</span>
                {f.caption}
              </span>
            </Reveal>
          ))}
          {/* Plain element (no scroll reveal) so the card is always visible. */}
          <div className="lookbook__quote">
            <Monogram tone="burgundy" className="lookbook__mark" />
            <div>
              <p className="lookbook__line">{text('home.editQuote', '“Each piece carries a sentiment, a tale and an enduring bond.”')}</p>
              <Link to="/shop" className="btn btn--primary btn--sm lookbook__cta">
                {text('home.editQuoteCta', 'Shop the edit')} <ArrowRight size={14} strokeWidth={1.4} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Promo() {
  return (
    <section className="promo" aria-label="Gifting">
      <div className="promo__bg">
        <Media id="promo" />
      </div>
      <div className="promo__shade" aria-hidden="true" />
      <Reveal className="promo__content container">
        <h2 className="promo__title">
          <Accent value={text('home.promoTitle', 'Gifts that *carry meaning*')} />
        </h2>
        <p className="promo__text">{text('home.promoText', 'An unforgettable gift that preserves moments of feeling for many years to come.')}</p>
        <Link to="/shop" className="btn btn--gold">
          {text('home.promoCta', 'Find the perfect gift')}
        </Link>
      </Reveal>
    </section>
  );
}

function Newsletter() {
  return (
    <section className="section newsletter">
      <div className="container">
        <Reveal className="nl-card">
          <div className="nl-card__img">
            <Media id="newsletter" />
          </div>
          <div className="nl-card__body">
            <h2 className="nl-card__title">
              <Accent value={text('home.newsletterTitle', 'Join the *Amanah* list')} />
            </h2>
            <p className="nl-card__text">{text('home.newsletterText', 'New collections, campaign stories and invitations, sent with care.')}</p>
            <NewsletterForm id="home-newsletter" variant="pill" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  useEffect(() => {
    document.title = `${site.name} | ${site.tagline}`;
  }, []);
  return (
    <>
      <Hero />
      <FeaturedCollections />
      <FeaturedProducts />
      <BrandStory />
      <Editorial />
      <Promo />
      <Newsletter />
    </>
  );
}
