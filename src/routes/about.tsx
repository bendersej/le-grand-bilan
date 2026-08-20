import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">À propos</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
          Un bilan factuel, décision par décision.
        </h1>
        <p className="m-0 max-w-3xl text-base leading-8 text-[var(--sea-ink-soft)]">
          Le Grand Bilan recense les décisions appliquées ou validées par les responsables
          politiques français depuis le début du mandat de François Hollande (mai 2012). Chaque
          entrée est datée, catégorisée, rattachée aux personnes qui l&apos;ont portée et appuyée
          par au moins une source officielle. Les données sont ouvertes : toute contribution passe
          par une pull request publique, relue avant publication.
        </p>
      </section>
    </main>
  )
}
