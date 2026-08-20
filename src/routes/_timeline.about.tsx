import { createFileRoute } from '@tanstack/react-router'
import Panel from '../components/Panel'

export const Route = createFileRoute('/_timeline/about')({
  component: About,
})

function About() {
  return (
    <Panel label="À propos">
      <p className="kicker m-0">À propos</p>
      <h1 className="display-title m-0 mt-2 text-2xl font-bold sm:text-3xl">
        Un bilan factuel, décision par décision.
      </h1>
      <p className="mt-4 text-base leading-7 text-[var(--sea-ink-soft)]">
        Le Grand Bilan recense les décisions appliquées ou validées par les responsables politiques
        français depuis le début du mandat de François Hollande (mai 2012). Chaque entrée est datée,
        catégorisée, rattachée aux personnes qui l&apos;ont portée et appuyée par au moins une
        source officielle. Les données sont ouvertes : toute contribution passe par une pull request
        publique, relue avant publication.
      </p>
    </Panel>
  )
}
