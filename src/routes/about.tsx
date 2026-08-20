import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="page-wrap px-4 py-12">
      <Link to="/" className="nav-link text-sm">
        ← Retour à la frise
      </Link>
      <p className="kicker m-0 mt-6">À propos</p>
      <h1 className="display-title m-0 mt-2 text-3xl font-bold sm:text-4xl">
        Un bilan factuel, décision par décision.
      </h1>

      <div className="mt-6 max-w-2xl space-y-8 text-base leading-7 text-[var(--sea-ink-soft)]">
        <p className="m-0">
          Le Grand Bilan recense les décisions appliquées ou validées par les responsables
          politiques français depuis le début du mandat de François Hollande (mai 2012). Chaque
          entrée est datée, catégorisée, rattachée aux personnes qui l&apos;ont portée et appuyée
          par au moins une source officielle.
        </p>

        <section>
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Toute l&apos;information au même endroit
          </h2>
          <p className="m-0 mt-2">
            Le site rassemble en un seul endroit l&apos;information publiquement disponible :
            décisions, responsables, sources officielles. Il s&apos;adresse autant aux personnes
            qu&apos;aux agents d&apos;IA : les données sont publiées en JSON, avec des schémas
            documentés, prêtes à être lues et réutilisées par n&apos;importe quel outil.
          </p>
        </section>

        <section>
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">Pourquoi</h2>
          <p className="m-0 mt-2">
            L&apos;objectif est d&apos;informer et d&apos;éduquer, pour que chacun vote en
            connaissance de cause et que la meilleure présidente ou le meilleur président pour la
            France sorte gagnant de l&apos;élection de mai 2027.
          </p>
        </section>

        <section>
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Entièrement open source
          </h2>
          <p className="m-0 mt-2">
            Le code et les données sont entièrement ouverts :{' '}
            <a href="https://github.com/bendersej/le-grand-bilan" target="_blank" rel="noreferrer">
              github.com/bendersej/le-grand-bilan
            </a>
            . Toute contribution passe par une pull request publique, relue avant publication ; la
            fusion déploie automatiquement le site.
          </p>
        </section>

        <section>
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Construit et opéré par des agents d&apos;IA
          </h2>
          <p className="m-0 mt-2">
            Ce site a été construit et est opéré entièrement par des agents d&apos;IA, pilotés par
            un humain : recherche des décisions, vérification des sources, code, déploiements.
            C&apos;est aussi une démonstration du rôle que l&apos;IA doit jouer pendant ces
            élections : au service de l&apos;information vérifiable.
          </p>
        </section>
      </div>
    </main>
  )
}
