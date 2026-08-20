import { Link } from '@tanstack/react-router'

// In-flow detail panel rendered at the top of the timeline (no modal overlay).
export default function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section
      data-panel
      aria-label={label}
      className="relative mt-2 rounded-lg border border-[var(--line)] p-5 pr-10 sm:p-7"
    >
      <Link
        to="/"
        search={(previousSearch) => previousSearch}
        className="nav-link absolute right-4 top-4 text-sm"
        aria-label="Fermer"
      >
        ✕
      </Link>
      {children}
    </section>
  )
}
