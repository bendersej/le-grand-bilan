import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import Footer from '../components/Footer'
import Header from '../components/Header'
import { LanguageProvider } from '../components/LanguageProvider'

import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `(function(){try{var match=document.cookie.match(/(?:^|; )theme=(dark|light)/);var stored=match?match[1]:null;var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=stored||(prefersDark?'dark':'light');var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(stored){root.setAttribute('data-theme',stored)}else{root.removeAttribute('data-theme')}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Le Grand Bilan — Qui a fait quoi. Quand.',
      },
      {
        name: 'description',
        content:
          'Le registre ouvert des décisions politiques françaises, mois par mois, sourcées et reliées à leurs responsables.',
      },
      {
        name: 'theme-color',
        content: '#000091',
      },
      { property: 'og:title', content: 'Le Grand Bilan — Qui a fait quoi. Quand.' },
      {
        property: 'og:description',
        content:
          'Le registre ouvert des décisions politiques françaises, mois par mois, sourcées et reliées à leurs responsables.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'fr_FR' },
      // Absolute URL required by crawlers — swap host when the custom domain lands.
      { property: 'og:image', content: 'https://le-grand-bilan.ben-24c.workers.dev/og-image.jpg' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { name: 'twitter:card', content: 'summary_large_image' },
      {
        name: 'twitter:image',
        content: 'https://le-grand-bilan.ben-24c.workers.dev/og-image.jpg',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/site.webmanifest' },
    ],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function NotFound() {
  return (
    <main className="page-wrap px-4 py-12">
      <h1 className="display-title m-0 text-3xl font-bold">Page introuvable</h1>
      <p className="mt-3 text-[var(--sea-ink-soft)]">
        <Link to="/">Retour à la timeline</Link>
      </p>
    </main>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(35,35,255,0.18)]">
        <LanguageProvider>
          <Header />
          {children}
          <Footer />
        </LanguageProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
