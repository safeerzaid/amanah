import { Link } from 'react-router-dom';
import { site } from '../data/site';
import Logo from './Logo';
import SocialLinks from './SocialLinks';

const columns = [
  {
    title: 'Menu',
    links: [
      { to: '/shop', label: 'Shop' },
      { to: '/collections', label: 'Collections' },
      { to: '/about', label: 'About us' },
      { to: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Jewellery',
    links: [
      { to: '/shop?category=necklaces', label: 'Necklaces' },
      { to: '/shop?category=earrings', label: 'Earrings' },
      { to: '/shop?category=rings', label: 'Rings' },
      { to: '/shop?category=bracelets', label: 'Bracelets' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <Logo tone="ivory" className="footer__logo" />

          {columns.map((col) => (
            <nav key={col.title} className="footer__col" aria-label={col.title}>
              <p className="footer__title">{col.title}</p>
              <ul>
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <SocialLinks variant="round" className="footer__social" />
        </div>

        <div className="footer__bottom">
          <p>
            © {new Date().getFullYear()} {site.name}
          </p>
          <ul className="footer__legal">
            <li>
              <Link to="/wishlist">Wishlist</Link>
            </li>
            <li>
              <Link to="/account">Account</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
