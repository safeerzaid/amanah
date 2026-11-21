import Image from 'next/image';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { logoutAction } from '../login/actions';
import NavLinks from './NavLinks';
import ScrollReset from './ScrollReset';
import TopBar from './TopBar';
import TourProvider from './tour/TourProvider';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <TourProvider userId={admin}>
      <div className="admin">
        <nav className="side" aria-label="Admin" data-tour="sidebar">
          <Link href="/admin" className="side__brand">
            <Image className="side__logo" src="/brand/logo-ivory.png" alt="Amanah Jewellery" width={550} height={163} priority />
            <Image className="side__mark" src="/brand/mark-gold.png" alt="Amanah Jewellery" width={153} height={162} />
          </Link>
          <NavLinks />
          <form action={logoutAction} className="side__out">
            <button className="side__link">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 4.5h3.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H14M10 16l-4-4 4-4M6 12h9.5" />
              </svg>
              <span>Sign out</span>
            </button>
          </form>
        </nav>
        <main className="admin__main">
          <ScrollReset />
          <TopBar />
          {children}
        </main>
      </div>
    </TourProvider>
  );
}
