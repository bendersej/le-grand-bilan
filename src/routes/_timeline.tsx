import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import DecisionRow from '../components/DecisionRow'
import { formatMonthLabel } from '../data/format.ts'
import { categoriesById, timelineYears } from '../data/registry.ts'

export const Route = createFileRoute('/_timeline')({
  component: TimelineLayout,
  // Category filter lives in the URL (?categorie=travail) so filtered views are
  // shareable; it applies client-side (prerendered HTML is the unfiltered timeline).
  validateSearch: (search: Record<string, unknown>): { categorie?: string } => {
    const categorie = search.categorie
    return typeof categorie === 'string' && categorie !== '' ? { categorie } : {}
  },
})

// The timeline is the app: child routes (decision, politician, about) render as
// modals in the Outlet, above the always-visible timeline, so its scroll
// position survives navigation.
function TimelineLayout() {
  const { categorie } = Route.useSearch()
  const activeCategory = categorie ? (categoriesById.get(categorie) ?? null) : null
  const visibleYears = activeCategory
    ? timelineYears
        .map((timelineYear) => ({
          year: timelineYear.year,
          months: timelineYear.months
            .map((timelineMonth) => ({
              month: timelineMonth.month,
              decisions: timelineMonth.decisions.filter((decision) =>
                decision.category_ids.includes(activeCategory.id),
              ),
            }))
            .filter((timelineMonth) => timelineMonth.decisions.length > 0),
        }))
        .filter((timelineYear) => timelineYear.months.length > 0)
    : timelineYears

  return (
    <>
      <main className="page-wrap px-4 py-12">
        <h1 className="display-title m-0 text-3xl font-bold sm:text-4xl">Le Grand Bilan</h1>
        <p className="m-0 mt-2 text-[var(--sea-ink-soft)]">Qui a fait quoi. Quand.</p>

        {activeCategory ? (
          <p className="m-0 mt-6 flex items-center gap-2 text-sm">
            <span className="chip">{activeCategory.label.fr}</span>
            <Link to="/" resetScroll={false} className="text-xs">
              Effacer le filtre
            </Link>
          </p>
        ) : null}

        <div className="mt-10 space-y-14 border-l border-[var(--line)] pl-5 sm:pl-8">
          {visibleYears.map((timelineYear) => (
            <section key={timelineYear.year}>
              <h2 className="display-title m-0 text-4xl font-bold text-[var(--lagoon-deep)]">
                {timelineYear.year}
              </h2>
              {timelineYear.months.map((timelineMonth) => (
                <section
                  key={timelineMonth.month}
                  id={timelineMonth.month}
                  className="mt-6 scroll-mt-4"
                >
                  <p className="kicker m-0">{formatMonthLabel(timelineMonth.month)}</p>
                  <div className="mt-4 space-y-7">
                    {timelineMonth.decisions.map((decision) => (
                      <DecisionRow key={decision.id} decision={decision} showDate={false} />
                    ))}
                  </div>
                </section>
              ))}
            </section>
          ))}
        </div>
        {visibleYears.length === 0 ? (
          <p className="mt-10 text-sm text-[var(--sea-ink-soft)]">
            Aucune décision pour ce filtre.
          </p>
        ) : null}
      </main>
      <Outlet />
    </>
  )
}
