import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { StoreProvider } from './context/StoreContext';
import { loadCatalogue } from './utils/api';
import { startPreview } from './data/content';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/home.css';
import './styles/pages.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

function CatalogueError({ onRetry }) {
  return (
    <main className="container page-pad-b" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--ff-display)', fontWeight: 400 }}>Amanah Jewellery</h1>
        <p>We could not load the collection just now. Please try again in a moment.</p>
        <button type="button" className="btn btn--primary" onClick={onRetry}>
          Try again
        </button>
      </div>
    </main>
  );
}

// The catalogue loads before the app renders, because the cart and wishlist
// (restored from this device) are checked against it on start-up.
function start() {
  loadCatalogue()
    .then(() => {
      root.render(
        <React.StrictMode>
          <BrowserRouter>
            <StoreProvider>
              <App />
            </StoreProvider>
          </BrowserRouter>
        </React.StrictMode>,
      );
      startPreview();
    })
    .catch((err) => {
      console.error(err);
      root.render(<CatalogueError onRetry={start} />);
    });
}

start();
