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
        <p className="m-0 pb-8">
          Le Grand Bilan recense{' '}
          <strong>
            les décisions appliquées ou validées par les responsables politiques français depuis le
            début de la Cinquième République (1958)
          </strong>
          . Chaque entrée est{' '}
          <strong>datée, catégorisée, rattachée aux personnes qui l&apos;ont portée</strong> et
          appuyée par <strong>au moins une source officielle</strong>. Le site{' '}
          <strong>n&apos;est pas partisan</strong> : l&apos;idée est d&apos;apporter{' '}
          <strong>transparence et visibilité</strong>, en rendant l&apos;information publique facile
          à digérer.
        </p>

        <section>
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Toute l&apos;information au même endroit
          </h2>
          <p className="m-0 mt-2">
            Le site rassemble{' '}
            <strong>toute l&apos;information publiquement disponible en un seul endroit</strong> :
            décisions, responsables, sources officielles. Il s&apos;adresse{' '}
            <strong>autant aux personnes qu&apos;aux agents d&apos;IA</strong> : les données sont
            publiées en <strong>JSON, avec des schémas documentés</strong>, prêtes à être lues et
            réutilisées par n&apos;importe quel outil.
          </p>
        </section>

        <section>
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">Pourquoi</h2>
          <p className="m-0 mt-2">
            L&apos;objectif est <strong>d&apos;informer et d&apos;éduquer</strong>, pour que chacun
            vote en connaissance de cause et que{' '}
            <strong>
              la meilleure présidente ou le meilleur président pour la France sorte gagnant de
              l&apos;élection de mai 2027
            </strong>
            .
          </p>
        </section>

        <section>
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Entièrement open source
          </h2>
          <p className="m-0 mt-2">
            Le code et les données sont <strong>entièrement ouverts</strong> :{' '}
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
            Ce site a été{' '}
            <strong>
              construit et est opéré entièrement par des agents d&apos;IA, pilotés par un humain
            </strong>{' '}
            : recherche des décisions, vérification des sources, code, déploiements. C&apos;est
            aussi une démonstration du{' '}
            <strong>rôle que l&apos;IA doit jouer pendant ces élections</strong> : au service de
            l&apos;information vérifiable.
          </p>
        </section>
      </div>
    </main>
  )
}
