import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-semibold">We couldn&rsquo;t find that page</h1>
      <p className="mt-2 text-sm text-muted">The city may have moved or the link may be wrong. Try searching instead.</p>
      <Link href="/" className="mt-6 inline-block rounded-full bg-brand px-5 py-2 text-sm font-medium text-white">Go to the home page</Link>
    </div>
  );
}
