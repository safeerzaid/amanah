import { useSyncExternalStore } from 'react';
import { Route, Routes } from 'react-router-dom';
import { contentVersion, subscribeContent } from './data/content';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Product from './pages/Product';
import Collections from './pages/Collections';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import About from './pages/About';
import Contact from './pages/Contact';
import Wishlist from './pages/Wishlist';
import Account from './pages/Account';
import NotFound from './pages/NotFound';

export default function App() {
  // Re-renders the pages when the admin's live preview sends new text or photos.
  useSyncExternalStore(subscribeContent, contentVersion);
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="product/:slug" element={<Product />} />
        <Route path="collections" element={<Collections />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="account" element={<Account />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
