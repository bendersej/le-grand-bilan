import { Link } from '@tanstack/react-router'

// In-flow detail panel rendered at the top of the timeline (no modal overlay).
export default function Panel({
  label,
  backLabel,
  bordered,
  children,
}: {
  label: string
  backLabel: string
  bordered: boolean
  children: React.ReactNode
}) {
  return (
    <section
      data-panel
      aria-label={label}
      className={bordered ? 'mt-2 rounded-lg border border-[var(--line)] p-5 sm:p-7' : 'mt-2'}
    >
      <Link to="/" search={(previousSearch) => previousSearch} className="nav-link text-sm">
        ← {backLabel}
      </Link>
      <div className="mt-4">{children}</div>
    </section>
  )
}
