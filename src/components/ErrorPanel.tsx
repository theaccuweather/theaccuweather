// Friendly message when one part of the page can't load. The rest of the page still shows.
export default function ErrorPanel({ title, detail = 'Please refresh the page in a few minutes.' }: { title: string; detail?: string }) {
  return (
    <div role="status" className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-ink">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-muted">{detail}</p>
    </div>
  );
}
