import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useScrolled } from '../hooks/useScrolled';
import { useLockBody } from '../hooks/useLockBody';
import { site } from '../data/site';
import { classNames } from '../utils/format';
import Logo from './Logo';
import SocialLinks from './SocialLinks';

export const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop' },
  { to: '/collections', label: 'Collections' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export function AnnouncementBar() {
  // One line at every width: the full line on wide screens, the short form
  // on narrow ones. Swapped in CSS so there is nothing to measure or animate.
  return (
    <div className="announce">
      <p className="announce__text announce__text--long">{site.announcement}</p>
      <p className="announce__text announce__text--short">{site.announcementShort}</p>
    </div>
  );
}

export default function Header({ overlay = false }) {
  const { cart, wishlist, setCartOpen, setSearchOpen } = useStore();
  const scrolled = useScrolled(40);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const closeMenu = () => setMenuOpen(false);
  useLockBody(menuOpen, closeMenu);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  // Once scrolled: white header on every page. Home page before scrolling: transparent over the hero.
  const headerTone = menuOpen
    ? 'header--menu'
    : scrolled
      ? 'header--solid header--white'
      : overlay
        ? 'header--clear'
        : 'header--solid';
  const darkHeader = menuOpen || (overlay && !scrolled);

  return (
    <>
      <header
        className={classNames('header', headerTone, scrolled && 'is-scrolled')}
      >
        <div className="header__inner">
          <button
            type="button"
            className="icon-btn header__burger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={22} strokeWidth={1.3} /> : <Menu size={22} strokeWidth={1.3} />}
          </button>

          <Logo className="header__logo" tone={darkHeader ? 'ivory' : 'burgundy'} />

          <nav className="pillnav" aria-label="Main">
            {navLinks.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => classNames('pillnav__link', isActive && 'is-active')}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="header__tools">
            <button type="button" className="tool" onClick={() => setSearchOpen(true)} aria-label="Search">
              <Search size={17} strokeWidth={1.3} />
            </button>
            <Link to="/account" className="tool tool--hide-sm" aria-label="Account">
              <User size={17} strokeWidth={1.3} />
            </Link>
            <Link to="/wishlist" className="tool tool--hide-sm" aria-label={`Wishlist, ${wishlist.length} saved`}>
              <Heart size={17} strokeWidth={1.3} />
              {wishlist.length > 0 && <span className="tool__dot" aria-hidden="true" />}
            </Link>
            <button type="button" className="tool" onClick={() => setCartOpen(true)} aria-label={`Shopping bag, ${cart.count} items`}>
              <ShoppingBag size={17} strokeWidth={1.3} />
              {cart.count > 0 && (
                <span className="tool__count" aria-hidden="true">
                  {cart.count > 99 ? '99+' : cart.count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div id="mobile-menu" className={classNames('mmenu', menuOpen && 'is-open')} aria-hidden={!menuOpen}>
        <nav aria-label="Mobile">
          <ul className="mmenu__links">
            {navLinks.map((l, i) => (
              <li key={l.to} style={{ '--i': i }}>
                <NavLink to={l.to} end={l.end} onClick={closeMenu} className={({ isActive }) => classNames(isActive && 'is-active')}>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <ul className="mmenu__sub">
            <li>
              <Link to="/account" onClick={closeMenu}>
                <User size={16} strokeWidth={1.3} /> Account
              </Link>
            </li>
            <li>
              <Link to="/wishlist" onClick={closeMenu}>
                <Heart size={16} strokeWidth={1.3} /> Wishlist ({wishlist.length})
              </Link>
            </li>
          </ul>
        </nav>
        <div className="mmenu__foot">
          <p className="mmenu__tag">{site.tagline}</p>
          <SocialLinks variant="dark" />
        </div>
      </div>
    </>
  );
}
