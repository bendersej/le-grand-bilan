import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import MissingSourcesNote from '../components/MissingSourcesNote'
import Panel from '../components/Panel'
import RichText from '../components/RichText'
import { useLocalized } from '../components/LanguageProvider'
import { formatDateLabel } from '../data/format.ts'
import {
  categoriesById,
  decisionsById,
  incomingRelationsByDecisionId,
  politiciansById,
} from '../data/registry.ts'
import type { DecisionRelationType } from '../data/schema.ts'
import { searchWithCategoryAdded } from '../utils.ts'

const outgoingRelationLabelFr = (relationType: DecisionRelationType): string => {
  switch (relationType) {
    case 'amends':
      return 'Modifie'
    case 'implements':
      return 'Applique'
    case 'related':
      return 'Liée à'
    case 'repeals':
      return 'Abroge'
    default: {
      relationType satisfies never
      return relationType
    }
  }
}

const incomingRelationLabelFr = (relationType: DecisionRelationType): string => {
  switch (relationType) {
    case 'amends':
      return 'Modifiée par'
    case 'implements':
      return 'Appliquée par'
    case 'related':
      return 'Liée à'
    case 'repeals':
      return 'Abrogée par'
    default: {
      relationType satisfies never
      return relationType
    }
  }
}

export const Route = createFileRoute('/_timeline/decisions/$decisionId')({
  loader: ({ params }) => {
    const decision = decisionsById.get(params.decisionId)
    if (!decision) {
      throw notFound()
    }
    return decision
  },
  component: DecisionPage,
})

function DecisionPage() {
  const decision = Route.useLoaderData()
  const localize = useLocalized()
  const decisionCategories = decision.category_ids.flatMap((categoryId) => {
    const category = categoriesById.get(categoryId)
    return category ? [category] : []
  })
  const decisionPoliticians = decision.politician_ids.flatMap((politicianId) => {
    const politician = politiciansById.get(politicianId)
    return politician ? [politician] : []
  })
  const outgoingRelations = decision.relations.flatMap((relation) => {
    const relatedDecision = decisionsById.get(relation.decision_id)
    return relatedDecision ? [{ type: relation.type, decision: relatedDecision }] : []
  })
  const incomingRelations = incomingRelationsByDecisionId.get(decision.id) ?? []
  const hasRelations = outgoingRelations.length > 0 || incomingRelations.length > 0

  return (
    <Panel label={localize(decision.title)} backLabel="Retour à la frise" bordered={true}>
      <p className="kicker m-0">{formatDateLabel(decision.date)}</p>
      <h1 className="display-title m-0 mt-2 text-2xl font-bold sm:text-3xl">
        {localize(decision.title)}
      </h1>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {decisionCategories.map((category) => (
          <Link
            key={category.id}
            to="."
            search={(previousSearch) => searchWithCategoryAdded(previousSearch, category.id)}
            resetScroll={false}
            className="chip"
          >
            {localize(category.label)}
          </Link>
        ))}
        {decisionPoliticians.map((politician) => (
          <Link
            key={politician.id}
            to="/politiciens/$politicianId"
            params={{ politicianId: politician.id }}
            search={(previousSearch) => previousSearch}
            className="chip"
          >
            {politician.full_name}
          </Link>
        ))}
      </div>
      <p className="mt-6 text-base leading-7 text-[var(--sea-ink-soft)]">
        <RichText text={localize(decision.summary)} />
      </p>

      <section className="mt-8">
        <h2 className="m-0 text-sm font-semibold">Sources</h2>
        <ul className="m-0 mt-2 list-disc pl-5 text-sm">
          {decision.sources
            .filter((source) => source.bot_walled === undefined)
            .map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.title}
                </a>
              </li>
            ))}
          {decision.missing_sources !== undefined ? (
            <li className="marker:text-[var(--kicker)]">
              <MissingSourcesNote missingSources={decision.missing_sources} />
            </li>
          ) : null}
        </ul>
      </section>

      {hasRelations ? (
        <section className="mt-8">
          <h2 className="m-0 text-sm font-semibold">Décisions liées</h2>
          <ul className="m-0 mt-2 list-disc pl-5 text-sm">
            {outgoingRelations.map((relation) => (
              <li key={`out-${relation.type}-${relation.decision.id}`}>
                {outgoingRelationLabelFr(relation.type)}
                {' : '}
                <Link
                  to="/decisions/$decisionId"
                  params={{ decisionId: relation.decision.id }}
                  search={(previousSearch) => previousSearch}
                >
                  {localize(relation.decision.title)}
                </Link>
              </li>
            ))}
            {incomingRelations.map((relation) => (
              <li key={`in-${relation.type}-${relation.decision.id}`}>
                {incomingRelationLabelFr(relation.type)}
                {' : '}
                <Link
                  to="/decisions/$decisionId"
                  params={{ decisionId: relation.decision.id }}
                  search={(previousSearch) => previousSearch}
                >
                  {localize(relation.decision.title)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Panel>
  )
}
