import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { LocalizedText } from '../data/schema.ts'

type Language = 'en' | 'fr'

// French is the default; the cookie only exists once the reader chose a language.
const readLanguageCookie = (): Language | null => {
  const cookieMatch = document.cookie.match(/(?:^|; )lang=(en|fr)/)
  const storedLanguage = cookieMatch?.[1]
  return storedLanguage === 'en' || storedLanguage === 'fr' ? storedLanguage : null
}

const LanguageContext = createContext<{ language: Language; onToggle: () => void } | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('fr')

  useEffect(() => {
    const storedLanguage = readLanguageCookie()
    if (storedLanguage !== null) {
      document.documentElement.lang = storedLanguage
      setLanguage(storedLanguage)
    }
  }, [])

  const handleToggle = useCallback(() => {
    const nextLanguage: Language = language === 'fr' ? 'en' : 'fr'
    document.cookie = `lang=${nextLanguage}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.lang = nextLanguage
    setLanguage(nextLanguage)
  }, [language])

  const contextValue = useMemo(
    () => ({ language, onToggle: handleToggle }),
    [language, handleToggle],
  )

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>
}

export const useLanguage = (): { language: Language; onToggle: () => void } => {
  const languageContext = useContext(LanguageContext)
  if (languageContext === null) {
    throw new Error('useLanguage requires a LanguageProvider ancestor')
  }
  return languageContext
}

// Localized fields fall back to French when no English translation exists.
export const useLocalized = (): ((text: LocalizedText) => string) => {
  const { language } = useLanguage()
  return useCallback(
    (text: LocalizedText) => (language === 'en' && text.en !== null ? text.en : text.fr),
    [language],
  )
}
