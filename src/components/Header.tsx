import Link from 'next/link';
import GlobeLogo from './GlobeLogo';
import SearchBox from './SearchBox';
import ScaleSelect from './ScaleSelect';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-3 py-2.5 sm:px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="theaccuweather home">
          <GlobeLogo size={42} />
          <span className="text-lg font-semibold tracking-tight">
            theaccu<span className="text-link">weather</span>
          </span>
        </Link>
        <div className="order-last w-full md:order-none md:w-auto md:max-w-md md:flex-1">
          <SearchBox />
        </div>
        <nav className="hidden items-center gap-5 text-sm font-medium sm:flex">
          <Link href="/country" className="hover:text-link">Countries</Link>
          <Link href="/ranking" className="hover:text-link">Ranking</Link>
          <Link href="/about" className="hover:text-link">About</Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <ScaleSelect />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
