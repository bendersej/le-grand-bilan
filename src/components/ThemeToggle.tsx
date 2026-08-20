import { useCallback, useEffect, useState } from 'react'

type ResolvedTheme = 'dark' | 'light'

// Auto = no cookie: the site follows the system preference. Toggling makes the
// choice explicit and persists it as the `theme` cookie (read pre-hydration by
// the init script in __root.tsx).
const readThemeCookie = (): ResolvedTheme | null => {
  const cookieMatch = document.cookie.match(/(?:^|; )theme=(dark|light)/)
  const storedTheme = cookieMatch?.[1]
  return storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : null
}

const applyTheme = (theme: ResolvedTheme, options?: { explicit?: boolean }): void => {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(theme)
  if (options?.explicit) {
    root.setAttribute('data-theme', theme)
  } else {
    root.removeAttribute('data-theme')
  }
  root.style.colorScheme = theme
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M22 12L23 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 2V1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 23V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 20L19 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 4L19 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 20L5 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 4L5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M1 12L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 11.5066C3 16.7497 7.25034 21 12.4934 21C16.2209 21 19.4466 18.8518 21 15.7259C12.4934 15.7259 8.27411 11.5066 8.27411 3C5.14821 4.55344 3 7.77915 3 11.5066Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function ThemeToggle() {
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')

  useEffect(() => {
    const storedTheme = readThemeCookie()
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setResolvedTheme(storedTheme ?? (prefersDark ? 'dark' : 'light'))
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onSystemChange = () => {
      if (readThemeCookie() !== null) {
        return
      }
      const systemTheme: ResolvedTheme = media.matches ? 'dark' : 'light'
      applyTheme(systemTheme)
      setResolvedTheme(systemTheme)
    }

    media.addEventListener('change', onSystemChange)
    return () => {
      media.removeEventListener('change', onSystemChange)
    }
  }, [])

  const handleToggleClick = useCallback(() => {
    const nextTheme: ResolvedTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    document.cookie = `theme=${nextTheme}; path=/; max-age=31536000; samesite=lax`
    applyTheme(nextTheme, { explicit: true })
    setResolvedTheme(nextTheme)
  }, [resolvedTheme])

  return (
    <button
      type="button"
      role="switch"
      aria-checked={resolvedTheme === 'dark'}
      aria-label="Thème sombre"
      onClick={handleToggleClick}
      data-resolved={resolvedTheme}
      className="theme-toggle"
    >
      <span className="theme-toggle-knob" aria-hidden="true" />
      <span className="theme-toggle-icon theme-toggle-icon-sun" aria-hidden="true">
        <SunIcon />
      </span>
      <span className="theme-toggle-icon theme-toggle-icon-moon" aria-hidden="true">
        <MoonIcon />
      </span>
    </button>
  )
}
