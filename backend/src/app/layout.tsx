import type { Metadata } from 'next';
import { Cormorant_Garamond, Jost } from 'next/font/google';
import './globals.css';

// The storefront's fonts: Cormorant Garamond for headings, Jost for everything else.
const display = Cormorant_Garamond({ subsets: ['latin'], weight: ['500', '600'], variable: '--ff-display' });
const body = Jost({ subsets: ['latin'], weight: ['400', '500'], variable: '--ff-body' });

export const metadata: Metadata = {
  title: { default: 'Amanah admin', template: '%s | Amanah admin' },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // data-scroll-behavior: page switches jump to the top; only in-page scrolling is smooth.
    <html lang="en" className={`${display.variable} ${body.variable}`} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
