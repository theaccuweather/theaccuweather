// Shown instantly while a city page loads (placeholders in the same shape as the page).
export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading city data">
      <div>
        <div className="-mt-4 ml-[calc(50%-50vw)] h-56 w-screen animate-pulse bg-raised sm:h-72" />
        <div className="relative z-10 -mt-16 h-80 animate-pulse rounded-3xl border border-line bg-card sm:mx-6 sm:-mt-24" />
      </div>
      <div className="h-32 animate-pulse rounded-2xl border border-line bg-card" />
      <div className="h-48 animate-pulse rounded-2xl border border-line bg-card" />
    </div>
  );
}
