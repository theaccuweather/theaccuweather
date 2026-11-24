import Link from 'next/link';
import GlobeLogo from './GlobeLogo';
import SearchBox from './SearchBox';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-3 py-2.5 sm:px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="theaccuweather home">
          <GlobeLogo size={42} />
          <span className="text-lg font-semibold tracking-tight">
            theaccu<span className="text-brand">weather</span>
          </span>
        </Link>
        <nav className="hidden gap-4 text-sm text-muted sm:flex">
          <Link href="/ranking" className="hover:text-brand">Ranking</Link>
          <Link href="/about" className="hover:text-brand">About</Link>
        </nav>
        <div className="order-last w-full sm:order-none sm:ml-auto sm:w-80">
          <SearchBox />
        </div>
      </div>
    </header>
  );
}
