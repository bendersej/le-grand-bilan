import { createFileRoute, notFound } from '@tanstack/react-router'
import DecisionRow from '../components/DecisionRow'
import Modal from '../components/Modal'
import { formatDateLabel } from '../data/format.ts'
import { decisionsByPoliticianId, politiciansById } from '../data/registry.ts'

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

  return (
    <Modal label={politician.full_name}>
      <h1 className="display-title m-0 text-2xl font-bold sm:text-3xl">{politician.full_name}</h1>
      {politician.party ? (
        <p className="m-0 mt-1 text-[var(--sea-ink-soft)]">{politician.party}</p>
      ) : null}
      <ul className="m-0 mt-4 list-none p-0 text-sm text-[var(--sea-ink-soft)]">
        {politician.mandates.map((mandate) => (
          <li key={`${mandate.role.fr}-${mandate.from}`}>
            {mandate.role.fr} · {formatDateLabel(mandate.from)} –{' '}
            {mandate.to ? formatDateLabel(mandate.to) : "aujourd'hui"}
          </li>
        ))}
      </ul>

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
