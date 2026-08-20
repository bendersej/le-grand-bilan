import { Link } from '@tanstack/react-router'
import { formatDateLabel } from '../data/format.ts'
import { categoriesById, politiciansById } from '../data/registry.ts'
import type { Decision } from '../data/schema.ts'

export default function DecisionRow({
  decision,
  showDate,
}: {
  decision: Decision
  showDate: boolean
}) {
  const rowCategories = decision.category_ids.flatMap((categoryId) => {
    const category = categoriesById.get(categoryId)
    return category ? [category] : []
  })
  const rowPoliticians = decision.politician_ids.flatMap((politicianId) => {
    const politician = politiciansById.get(politicianId)
    return politician ? [politician] : []
  })
  // The month anchors the timeline scroll position in shared URLs: fresh loads
  // scroll to it natively, in-session clicks skip the jump (hashScrollIntoView).
  const decisionMonth = decision.date.slice(0, 7)

  return (
    <article className="grid gap-2 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6">
      <div className="flex flex-wrap content-start gap-1.5">
        {rowCategories.map((category) => (
          <Link
            key={category.id}
            to="/categories/$categoryId"
            params={{ categoryId: category.id }}
            hash={decisionMonth}
            hashScrollIntoView={false}
            resetScroll={false}
            className="chip"
          >
            {category.label.fr}
          </Link>
        ))}
        {rowPoliticians.map((politician) => (
          <Link
            key={politician.id}
            to="/politiciens/$politicianId"
            params={{ politicianId: politician.id }}
            hash={decisionMonth}
            hashScrollIntoView={false}
            resetScroll={false}
            className="chip"
          >
            {politician.full_name}
          </Link>
        ))}
      </div>
      <div>
        {showDate ? (
          <p className="m-0 text-xs text-[var(--sea-ink-soft)]">{formatDateLabel(decision.date)}</p>
        ) : null}
        <h3 className="m-0 text-base font-semibold">
          <Link
            to="/decisions/$decisionId"
            params={{ decisionId: decision.id }}
            hash={decisionMonth}
            hashScrollIntoView={false}
            resetScroll={false}
            className="text-[var(--sea-ink)] no-underline hover:text-[var(--lagoon-deep)]"
          >
            {decision.title.fr}
          </Link>
        </h3>
        <p className="m-0 mt-1 text-sm leading-6 text-[var(--sea-ink-soft)]">
          {decision.summary.fr}
        </p>
        <p className="m-0 mt-1.5 text-xs">
          {'Sources : '}
          {decision.sources.map((source, sourceIndex) => (
            <span key={source.url}>
              {sourceIndex > 0 ? ', ' : ''}
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.title}
              </a>
            </span>
          ))}
        </p>
      </div>
    </article>
  )
}
