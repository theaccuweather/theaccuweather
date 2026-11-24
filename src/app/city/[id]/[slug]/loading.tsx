// Shown instantly while a city page loads (skeleton placeholders).
export default function Loading() {
  const block = 'animate-pulse rounded-2xl bg-white border border-line';
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading city data">
      <div className="h-6 w-48 animate-pulse rounded bg-line" />
      <div className="h-8 w-80 max-w-full animate-pulse rounded bg-line" />
      <div className={`${block} h-72`} />
      <div className={`${block} h-32`} />
      <div className={`${block} h-48`} />
    </div>
  );
}
