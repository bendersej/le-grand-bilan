import { Link, Outlet, createFileRoute, useMatches, useParams } from '@tanstack/react-router'
import DecisionRow from '../components/DecisionRow'
import { useLocalized } from '../components/LanguageProvider'
import { formatDateLabel, formatMonthLabel } from '../data/format.ts'
import {
  allDecisions,
  appearancesByPoliticianId,
  buildTimelineYears,
  categoriesById,
  decisionsByPoliticianId,
} from '../data/registry.ts'
import type { Appearance } from '../data/schema.ts'
import { parseCategoryFilter, searchWithCategoryRemoved } from '../utils.ts'

export const Route = createFileRoute('/_timeline')({
  component: TimelineLayout,
  // Category filter lives in the URL (?categorie=travail) so filtered views are
  // shareable; it applies client-side (prerendered HTML is the unfiltered timeline).
  validateSearch: (search: Record<string, unknown>): { categorie?: string } => {
    const categorie = search.categorie
    return typeof categorie === 'string' && categorie !== '' ? { categorie } : {}
  },
})

function AppearanceRow({
  appearance,
  interactive,
}: {
  appearance: Appearance
  interactive: boolean
}) {
  const localize = useLocalized()
  const sourceHostname = new URL(appearance.source_url).hostname
  return (
    <article className="grid gap-2 sm:grid-cols-[240px_minmax(0,1fr)] sm:gap-6">
      <div className="flex items-start">
        {interactive ? (
          <span className="chip">Intervention publique</span>
        ) : (
          <span className="text-xs font-semibold text-[var(--sea-ink-soft)]">
            Intervention publique
          </span>
        )}
      </div>
      <div>
        <p className="m-0 text-xs text-[var(--sea-ink-soft)]">{formatDateLabel(appearance.date)}</p>
        <h3 className="m-0 text-base font-semibold">
          {interactive ? (
            <a
              href={appearance.source_url}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--sea-ink)] no-underline hover:text-[var(--lagoon-deep)]"
            >
              {localize(appearance.title)}
            </a>
          ) : (
            localize(appearance.title)
          )}
        </h3>
        <p className="m-0 mt-1 text-xs text-[var(--sea-ink-soft)]">
          {interactive ? `Regarder sur ${sourceHostname}` : `Source : ${sourceHostname}`}
        </p>
      </div>
    </article>
  )
}

// The timeline is the app: child routes (decision, politician, about) render as
// an in-flow panel at the TOP of the timeline. A politician's view scopes the
// timeline to their decisions and weaves their public appearances into it.
function TimelineLayout() {
  const { categorie } = Route.useSearch()
  const routeParams = useParams({ strict: false })
  const matches = useMatches()
  const hasPanel = matches.some(
    (match) => match.routeId.startsWith('/_timeline/') && match.routeId !== '/_timeline/',
  )
  const localize = useLocalized()
  const activeCategories = parseCategoryFilter(categorie).flatMap((categoryId) => {
    const category = categoriesById.get(categoryId)
    return category ? [category] : []
  })
  const activeCategoryIds = new Set(activeCategories.map((category) => category.id))
  const activePoliticianId = routeParams.politicianId

  const scopedDecisions = activePoliticianId
    ? (decisionsByPoliticianId.get(activePoliticianId) ?? [])
    : allDecisions
  const scopedAppearances = activePoliticianId
    ? (appearancesByPoliticianId.get(activePoliticianId) ?? [])
    : []
  const filteredDecisions =
    activeCategoryIds.size > 0
      ? scopedDecisions.filter((decision) =>
          decision.category_ids.some((categoryId) => activeCategoryIds.has(categoryId)),
        )
      : scopedDecisions
  const visibleYears = buildTimelineYears({
    decisions: filteredDecisions,
    appearances: scopedAppearances,
  })
  const showHero = activeCategories.length === 0 && !hasPanel

  return (
    <main className="page-wrap px-4 py-10">
      {showHero ? (
        <div className="mb-8">
          <h1 className="display-title m-0 text-3xl font-bold sm:text-4xl">Le Grand Bilan</h1>
          <p className="m-0 mt-2 text-[var(--sea-ink-soft)]">Qui a fait quoi. Quand.</p>
        </div>
      ) : null}

      <Outlet />

      <div
        data-timeline
        className="ml-20 mt-8 flex flex-col space-y-14 border-l border-[var(--line)] pl-5 sm:ml-24 sm:pl-8"
      >
        {activeCategories.length > 0 ? (
          // Flow slot sits just below the first month label (negative margin
          // gives it back), so the chips read "under the current month" at rest
          // AND when the stack is stuck; flex-col on the container prevents the
          // negative margin from collapsing into the first year's offset.
          <div className="sticky top-[9.85rem] z-10 -mb-[4.9rem] mt-[4.9rem] flex h-0 w-fit -translate-x-[calc(100%+2.3rem)] flex-col items-end gap-1 sm:-translate-x-[calc(100%+3rem)]">
            {activeCategories.map((category) => (
              <Link
                key={category.id}
                to="."
                search={(previousSearch) => searchWithCategoryRemoved(previousSearch, category.id)}
                resetScroll={false}
                className="chip chip-glass"
                aria-label={`Retirer le filtre ${category.label.fr}`}
              >
                {localize(category.label)} ✕
              </Link>
            ))}
          </div>
        ) : null}
        {visibleYears.map((timelineYear) => (
          <section key={timelineYear.year}>
            {/* Year and month live in the gutter LEFT of the rail (zero-height
                boxes translated across it) and stick under the header, so the
                current position reads "Août | [row]" at any scroll depth. */}
            <h2 className="display-title sticky top-20 z-20 m-0 w-fit -translate-x-[calc(100%+2.3rem)] text-2xl font-bold text-[var(--lagoon-deep)] sm:-translate-x-[calc(100%+3rem)] sm:text-3xl">
              {timelineYear.year}
            </h2>
            {timelineYear.months.map((timelineMonth) => (
              <section
                key={timelineMonth.month}
                id={timelineMonth.month}
                className="mt-[0.6rem] scroll-mt-4"
              >
                <p className="kicker month-marker sticky top-[7.6rem] z-10 m-0 h-0 w-fit -translate-x-[calc(100%+2.3rem)] sm:top-[7.85rem] sm:-translate-x-[calc(100%+3rem)]">
                  <span className="chip-glass rounded-md px-1.5 py-0.5">
                    {formatMonthLabel(timelineMonth.month)}
                  </span>
                </p>
                <div className="mt-4 space-y-7">
                  {timelineMonth.items.map((timelineItem) => {
                    switch (timelineItem.kind) {
                      case 'appearance':
                        return (
                          <AppearanceRow
                            key={`appearance-${timelineItem.appearance.id}`}
                            appearance={timelineItem.appearance}
                            interactive={false}
                          />
                        )
                      case 'decision':
                        return (
                          <DecisionRow
                            key={timelineItem.decision.id}
                            decision={timelineItem.decision}
                            showDate={false}
                          />
                        )
                      default: {
                        timelineItem satisfies never
                        return null
                      }
                    }
                  })}
                </div>
              </section>
            ))}
          </section>
        ))}
      </div>
      {visibleYears.length === 0 ? (
        <p className="mt-10 text-sm text-[var(--sea-ink-soft)]">Aucune décision pour ce filtre.</p>
      ) : null}
    </main>
  )
}
