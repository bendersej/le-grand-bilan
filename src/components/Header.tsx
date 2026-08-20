import { Link } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="border-b border-[var(--line)] px-4">
      <nav className="page-wrap flex items-center gap-6 py-3 text-sm">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 font-semibold text-[var(--sea-ink)] no-underline"
        >
          <img src="/icon-192.png" alt="Marianne" className="h-9 w-9 rounded-md object-cover" />
          Le Grand Bilan
        </Link>
        <Link to="/about" className="nav-link" activeProps={{ className: 'nav-link is-active' }}>
          À propos
        </Link>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
