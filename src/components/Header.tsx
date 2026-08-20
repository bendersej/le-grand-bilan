import { Link } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="border-b border-[var(--line)] px-4">
      <nav className="page-wrap flex items-center gap-6 py-4 text-sm">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-semibold text-[var(--sea-ink)] no-underline"
        >
          <span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#000091_33%,#ffffff_33%,#ffffff_66%,#e1000f_66%)]" />
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
