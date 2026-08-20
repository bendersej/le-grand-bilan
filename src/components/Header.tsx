import { Link } from '@tanstack/react-router'
import { useLanguage } from './LanguageProvider'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const { language, onToggle } = useLanguage()

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg-base)] px-4">
      <nav className="page-wrap flex items-center gap-6 py-3 text-sm">
        <Link to="/" className="inline-flex items-center no-underline">
          <img src="/logo-header.png" alt="Le Grand Bilan" className="h-10 w-auto rounded-md" />
        </Link>
        <Link to="/about" className="nav-link" activeProps={{ className: 'nav-link is-active' }}>
          À propos
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onToggle}
            aria-label={language === 'fr' ? 'Switch to English' : 'Passer en français'}
            className="nav-link cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold"
          >
            {language === 'fr' ? 'EN' : 'FR'}
          </button>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
