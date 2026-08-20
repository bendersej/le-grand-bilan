import { createFileRoute, notFound } from '@tanstack/react-router'
import DecisionRow from '../components/DecisionRow'
import Modal from '../components/Modal'
import RichText from '../components/RichText'
import { formatDateLabel } from '../data/format.ts'
import {
  appearancesByPoliticianId,
  decisionsByPoliticianId,
  politiciansById,
} from '../data/registry.ts'

export const Route = createFileRoute('/_timeline/politiciens/$politicianId')({
  loader: ({ params }) => {
    const politician = politiciansById.get(params.politicianId)
    if (!politician) {
      throw notFound()
    }
    return politician
  },
  component: PoliticianPage,
})

function PoliticianPage() {
  const politician = Route.useLoaderData()
  const politicianDecisions = decisionsByPoliticianId.get(politician.id) ?? []
  const politicianAppearances = appearancesByPoliticianId.get(politician.id) ?? []
  const profile = politician.profile

  return (
    <Modal label={politician.full_name}>
      <div className="flex items-start gap-4">
        {profile ? (
          <img
            src={profile.photo.path}
            alt={politician.full_name}
            className="h-24 w-24 rounded-md object-cover"
          />
        ) : null}
        <div>
          <h1 className="display-title m-0 text-2xl font-bold sm:text-3xl">
            {politician.full_name}
          </h1>
          {politician.party ? (
            <p className="m-0 mt-1 text-[var(--sea-ink-soft)]">{politician.party}</p>
          ) : null}
          <ul className="m-0 mt-3 list-none p-0 text-sm text-[var(--sea-ink-soft)]">
            {politician.mandates.map((mandate) => (
              <li key={`${mandate.role.fr}-${mandate.from}`}>
                {mandate.role.fr} · {formatDateLabel(mandate.from)} –{' '}
                {mandate.to ? formatDateLabel(mandate.to) : "aujourd'hui"}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {profile ? (
        <>
          <p className="mt-5 text-sm leading-6 text-[var(--sea-ink-soft)]">
            <RichText text={profile.summary.fr} />
          </p>
          <p className="m-0 mt-2 text-xs text-[var(--sea-ink-soft)]">
            {'Texte : '}
            <a href={profile.wikipedia_url} target="_blank" rel="noreferrer">
              Wikipédia
            </a>
            {' (CC BY-SA) · Photo : '}
            <a href={profile.photo.source_url} target="_blank" rel="noreferrer">
              {profile.photo.author ?? 'Wikimedia Commons'}
            </a>
            {` (${profile.photo.license})`}
          </p>
        </>
      ) : null}

      {politicianAppearances.length > 0 ? (
        <section className="mt-8">
          <h2 className="kicker m-0">Interventions publiques</h2>
          <div className="mt-4 space-y-6">
            {politicianAppearances.map((appearance) => (
              <article key={appearance.id}>
                <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
                  {formatDateLabel(appearance.date)}
                </p>
                <h3 className="m-0 mt-0.5 text-sm font-semibold">
                  <a href={appearance.source_url} target="_blank" rel="noreferrer">
                    {appearance.title.fr}
                  </a>
                </h3>
                <p className="m-0 mt-1 text-xs text-[var(--sea-ink-soft)]">
                  {`Regarder sur ${new URL(appearance.source_url).hostname}`}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="kicker m-0">Décisions</h2>
        <div className="mt-4 space-y-7">
          {politicianDecisions.map((decision) => (
            <DecisionRow key={decision.id} decision={decision} showDate={true} />
          ))}
        </div>
      </section>
    </Modal>
  )
}
