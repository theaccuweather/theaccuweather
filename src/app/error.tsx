'use client';

// Shown if something unexpected breaks while rendering a page.
export default function ErrorPage({ reset }: { error: globalThis.Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong loading this page</h1>
      <p className="mt-2 text-sm text-muted">Our data provider may be busy. Please try again.</p>
      <button type="button" onClick={reset} className="mt-6 rounded-full bg-brand px-5 py-2 text-sm font-medium text-white">
        Try again
      </button>
    </div>
  );
}
