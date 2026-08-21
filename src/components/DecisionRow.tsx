import { Link } from '@tanstack/react-router'
import MissingSourcesNote from './MissingSourcesNote'
import RichText from './RichText'
import { formatDateLabel } from '../data/format.ts'
import { useLocalized } from './LanguageProvider'
import { categoriesById, politiciansById } from '../data/registry.ts'
import type { Decision } from '../data/schema.ts'
import { searchWithCategoryAdded } from '../utils.ts'

const initialsOf = (fullName: string): string =>
  fullName
    .split(' ')
    .map((namePart) => namePart.charAt(0))
    .slice(0, 2)
    .join('')

export default function DecisionRow({
  decision,
  showDate,
}: {
  decision: Decision
  showDate: boolean
}) {
  const localize = useLocalized()
  const rowCategories = decision.category_ids.flatMap((categoryId) => {
    const category = categoriesById.get(categoryId)
    return category ? [category] : []
  })
  const rowPoliticians = decision.politician_ids.flatMap((politicianId) => {
    const politician = politiciansById.get(politicianId)
    return politician ? [politician] : []
  })
  const mainPolitician = rowPoliticians[0] ?? null
  const otherPoliticians = rowPoliticians.slice(1)
  // The row below the main photo holds exactly 3 tiles: all others when they
  // fit, otherwise 2 photos + a "+N" tile.
  const visibleOtherPoliticians =
    otherPoliticians.length <= 3 ? otherPoliticians : otherPoliticians.slice(0, 2)
  const overflowCount = otherPoliticians.length - visibleOtherPoliticians.length

  return (
    <article className="grid gap-2 sm:grid-cols-[240px_minmax(0,1fr)] sm:gap-6">
      <div className="flex items-start gap-3">
        {mainPolitician ? (
          <div className="flex w-[4.5rem] flex-none flex-col gap-0.5">
            <Link
              to="/politiciens/$politicianId"
              params={{ politicianId: mainPolitician.id }}
              search={(previousSearch) => previousSearch}
              aria-label={mainPolitician.full_name}
              title={mainPolitician.full_name}
              className="photo-chip photo-chip-main"
            >
              {mainPolitician.profile ? (
                <img src={mainPolitician.profile.photo.path} alt="" />
              ) : (
                <span aria-hidden="true">{initialsOf(mainPolitician.full_name)}</span>
              )}
            </Link>
            {otherPoliticians.length > 0 ? (
              <div className="flex">
                {visibleOtherPoliticians.map((politician) => (
                  <Link
                    key={politician.id}
                    to="/politiciens/$politicianId"
                    params={{ politicianId: politician.id }}
                    search={(previousSearch) => previousSearch}
                    aria-label={politician.full_name}
                    title={politician.full_name}
                    className="photo-chip photo-chip-small"
                  >
                    {politician.profile ? (
                      <img src={politician.profile.photo.path} alt="" />
                    ) : (
                      <span aria-hidden="true">{initialsOf(politician.full_name)}</span>
                    )}
                  </Link>
                ))}
                {overflowCount > 0 ? (
                  <Link
                    to="/decisions/$decisionId"
                    params={{ decisionId: decision.id }}
                    search={(previousSearch) => previousSearch}
                    aria-label={`${overflowCount} autres décisionnaires`}
                    className="photo-chip photo-chip-small"
                  >
                    <span>+{overflowCount}</span>
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="flex flex-col items-start gap-1.5">
          {mainPolitician ? (
            <Link
              to="/politiciens/$politicianId"
              params={{ politicianId: mainPolitician.id }}
              search={(previousSearch) => previousSearch}
              className="chip"
            >
              {mainPolitician.full_name}
            </Link>
          ) : null}
          {rowCategories.map((category) => (
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
        </div>
      </div>
      <div>
        {showDate ? (
          <p className="m-0 text-xs text-[var(--sea-ink-soft)]">{formatDateLabel(decision.date)}</p>
        ) : null}
        <h3 className="m-0 text-base font-semibold">
          <Link
            to="/decisions/$decisionId"
            params={{ decisionId: decision.id }}
            search={(previousSearch) => previousSearch}
            className="text-[var(--sea-ink)] no-underline hover:text-[var(--lagoon-deep)]"
          >
            {localize(decision.title)}
          </Link>
        </h3>
        <p className="m-0 mt-1 text-sm leading-6 text-[var(--sea-ink-soft)]">
          <RichText text={localize(decision.summary)} />
        </p>
        <p className="m-0 mt-1.5 text-xs">
          {decision.sources.length > 0 ? (
            <>
              {'Sources : '}
              {decision.sources.map((source, sourceIndex) => (
                <span key={source.url}>
                  {sourceIndex > 0 ? ', ' : ''}
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.title}
                  </a>
                </span>
              ))}
            </>
          ) : null}
          {decision.missing_sources !== undefined ? (
            <>
              {decision.sources.length > 0 ? ' · ' : ''}
              <MissingSourcesNote missingSources={decision.missing_sources} />
            </>
          ) : null}
        </p>
      </div>
    </article>
  )
}
