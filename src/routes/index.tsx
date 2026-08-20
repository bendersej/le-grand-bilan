import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(35,35,255,0.22),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(225,0,15,0.14),transparent_66%)]" />
        <p className="island-kicker mb-3">Qui a fait quoi. Quand.</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          Le Grand Bilan
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          Le registre ouvert des décisions politiques françaises : mois par mois, depuis mai 2012,
          chaque décision est sourcée, catégorisée et reliée aux responsables qui l&apos;ont portée.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/about"
            className="rounded-full border border-[rgba(0,0,145,0.3)] bg-[rgba(35,35,255,0.1)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(35,35,255,0.18)]"
          >
            À propos
          </a>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          [
            'Décisions sourcées',
            'Chaque décision cite au moins une source officielle : Légifrance, Journal officiel, vie-publique.fr.',
          ],
          [
            'Données ouvertes',
            'Un registre en JSON, versionné publiquement, avec un schéma documenté que chacun peut réutiliser.',
          ],
          [
            'Contributions par pull request',
            'Toute entrée soumise, via le site ou le serveur MCP, devient une pull request relue avant publication.',
          ],
        ].map(([title, desc], index) => (
          <article
            key={title}
            className="island-shell feature-card rise-in rounded-2xl p-5"
            style={{ animationDelay: `${index * 90 + 80}ms` }}
          >
            <h2 className="mb-2 text-base font-semibold text-[var(--sea-ink)]">{title}</h2>
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{desc}</p>
          </article>
        ))}
      </section>

      <section className="island-shell mt-8 rounded-2xl p-6 text-center">
        <p className="island-kicker m-0">Plus de visibilité pour les élections de mai 2027.</p>
      </section>
    </main>
  )
}
