// A white rounded panel with an optional heading, used for every page section.
export default function Section({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-line bg-white p-4 sm:p-5 ${className}`}>
      {title && <h2 className="mb-3 text-lg font-semibold tracking-tight">{title}</h2>}
      {children}
    </section>
  );
}
