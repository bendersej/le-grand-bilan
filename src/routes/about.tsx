import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="page-wrap px-4 py-12">
      <p className="kicker m-0">À propos</p>
      <h1 className="display-title m-0 mt-2 text-3xl font-bold sm:text-4xl">
        Un bilan factuel, décision par décision.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--sea-ink-soft)]">
        Le Grand Bilan recense les décisions appliquées ou validées par les responsables politiques
        français depuis le début du mandat de François Hollande (mai 2012). Chaque entrée est datée,
        catégorisée, rattachée aux personnes qui l&apos;ont portée et appuyée par au moins une
        source officielle. Les données sont ouvertes : toute contribution passe par une pull request
        publique, relue avant publication.
      </p>
    </main>
  )
}
