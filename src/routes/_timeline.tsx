import {
  Link,
  Outlet,
  createFileRoute,
  useMatches,
  useNavigate,
  useParams,
} from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { fr } from 'date-fns/locale'
import DecisionRow from '../components/DecisionRow'
import { useLocalized } from '../components/LanguageProvider'
import { Button } from '../components/ui/button'
import { Calendar } from '../components/ui/calendar'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '../components/ui/combobox'
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover'
import { formatDateLabel, formatMonthLabel } from '../data/format.ts'
import {
  allDecisions,
  appearancesByPoliticianId,
  buildTimelineYears,
  categoriesById,
  decisionsByPoliticianId,
  politiciansById,
} from '../data/registry.ts'
import type { Appearance, Politician } from '../data/schema.ts'
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

const politiciansByName = [...politiciansById.values()].toSorted((a, b) =>
  a.full_name.localeCompare(b.full_name, 'fr'),
)

// Search-normalized: lowercase, no diacritics, no spaces/hyphens/apostrophes,
// so "lemaire" matches "Le Maire" and "oudeacastera" matches "Oudéa-Castéra".
const searchNormalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]/g, '')

const normalizedNamesById = new Map(
  politiciansByName.map((politician) => [politician.id, searchNormalize(politician.full_name)]),
)

const matchesPoliticianQuery = (politician: Politician, query: string): boolean => {
  const normalizedQuery = searchNormalize(query)
  if (normalizedQuery === '') return true
  return (normalizedNamesById.get(politician.id) ?? '').includes(normalizedQuery)
}

// Hero-side politician search: selecting one jumps to their scoped timeline.
// Uncontrolled on purpose: the politician route owns the "current politician"
// state, and the hero (combobox included) is not rendered on that route.
function PoliticianCombobox() {
  const navigate = useNavigate()
  const handleValueChange = useCallback(
    (politician: Politician | null) => {
      if (politician === null) return
      void navigate({ to: '/politiciens/$politicianId', params: { politicianId: politician.id } })
    },
    [navigate],
  )

  return (
    <Combobox<Politician>
      items={politiciansByName}
      itemToStringLabel={(politician) => politician.full_name}
      filter={matchesPoliticianQuery}
      onValueChange={handleValueChange}
    >
      <ComboboxInput
        placeholder="Responsable politique"
        className="w-64 border-[var(--lagoon-deep)] has-[[data-slot=input-group-control]:focus-visible]:border-[var(--lagoon-deep)] has-[[data-slot=input-group-control]:focus-visible]:ring-[var(--lagoon-deep)]/30"
      />
      <ComboboxContent>
        <ComboboxEmpty>Aucun responsable politique trouvé.</ComboboxEmpty>
        <ComboboxList>
          {(politician: Politician) => (
            <ComboboxItem key={politician.id} value={politician}>
              {politician.full_name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

// Registry months are 'yyyy-mm'; the picker works in month ordinals (year * 12
// + month) so "nearest existing month" is a plain distance comparison.
const TIMELINE_START = new Date(1958, 0)

const monthOrdinal = (month: string): number => {
  const [yearPart, monthPart] = month.split('-')
  return Number(yearPart) * 12 + (Number(monthPart) - 1)
}

const monthStartDate = (month: string): Date => {
  const [yearPart, monthPart] = month.split('-')
  return new Date(Number(yearPart), Number(monthPart) - 1, 1)
}

const nearestAvailableMonth = (months: string[], target: Date): string | null => {
  const targetOrdinal = target.getFullYear() * 12 + target.getMonth()
  return months.reduce<string | null>((best, candidate) => {
    if (best === null) return candidate
    const bestDistance = Math.abs(monthOrdinal(best) - targetOrdinal)
    const candidateDistance = Math.abs(monthOrdinal(candidate) - targetOrdinal)
    return candidateDistance < bestDistance ? candidate : best
  }, null)
}

const monthKeyOf = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

// A sticky year/month marker that opens a month+year picker (the day grid is
// hidden: the registry's grain is the month). The dropdowns and chevrons only
// browse; the button commits the jump to the nearest month that has entries,
// closing first because the jump scrolls the popover's own anchor away.
function TimelineMonthPicker({
  months,
  month,
  triggerClassName,
  children,
}: {
  months: string[]
  month: string
  triggerClassName: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => monthStartDate(month))

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen)
      if (nextOpen) setVisibleMonth(monthStartDate(month))
    },
    [month],
  )
  const handleMonthChange = useCallback((nextMonth: Date) => {
    setVisibleMonth(nextMonth)
  }, [])
  const handleJump = useCallback(() => {
    const targetMonth = nearestAvailableMonth(months, visibleMonth)
    if (targetMonth === null) return
    setOpen(false)
    document.getElementById(targetMonth)?.scrollIntoView()
  }, [months, visibleMonth])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger className={triggerClassName}>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-auto">
        <Calendar
          captionLayout="dropdown"
          locale={fr}
          month={visibleMonth}
          onMonthChange={handleMonthChange}
          startMonth={TIMELINE_START}
          endMonth={new Date()}
          classNames={{ month_grid: 'hidden' }}
        />
        <Button size="sm" onClick={handleJump}>
          {`Aller à ${formatMonthLabel(monthKeyOf(visibleMonth))} ${visibleMonth.getFullYear()}`}
        </Button>
      </PopoverContent>
    </Popover>
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
  const availableMonths = visibleYears.flatMap((timelineYear) =>
    timelineYear.months.map((timelineMonth) => timelineMonth.month),
  )
  const showHero = activeCategories.length === 0 && !hasPanel

  return (
    <main className="page-wrap px-4 py-10">
      {showHero ? (
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="display-title m-0 text-3xl font-bold sm:text-4xl">Le Grand Bilan</h1>
            <p className="m-0 mt-2 text-[var(--sea-ink-soft)]">Qui a fait quoi. Quand.</p>
          </div>
          <PoliticianCombobox />
        </div>
      ) : null}

      <Outlet />

      <div
        data-timeline
        className="ml-1 mt-8 flex flex-col space-y-14 border-l border-[var(--line)] pl-4 sm:ml-24 sm:pl-8"
      >
        {activeCategories.length > 0 ? (
          // Mobile: chips flow above the timeline and stick just under the
          // year/month line. Desktop (sm:): a zero-height flow slot sits just
          // below the first month label in the gutter (negative margin gives it
          // back), so the chips read "under the current month" at rest AND when
          // the stack is stuck.
          <div className="sticky top-[2.7rem] z-10 flex w-fit flex-wrap gap-1 sm:-mb-[4.9rem] sm:mt-[4.9rem] sm:h-0 sm:-translate-x-[calc(100%+3rem)] sm:flex-col sm:flex-nowrap sm:items-end sm:top-[5.8rem]">
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
            {/* Desktop: year and month live in the gutter LEFT of the rail
                (zero-height boxes translated across it) and stick near the top
                of #app-scroll, so the current position reads "Août | [row]" at
                any scroll depth. Mobile: both flow inline above the rows and
                stick as one "2022 [mai]" line. The sm: top offsets assume the
                header sits OUTSIDE the scroll container (they are container-
                relative, not viewport-relative). */}
            {/* Font classes sit on the trigger buttons, not the wrappers: the
                shadcn base stylesheet resets button typography, so inherited
                marker styles do not survive into the <button>. */}
            {/* sm:h-0 keeps the year label out of the flow (it lives in the
                gutter), so the first rows start at the top of the section. */}
            <h2 className="chip-glass sticky top-2 z-20 m-0 w-fit max-sm:rounded-md sm:top-4 sm:h-0 sm:-translate-x-[calc(100%+3rem)]">
              <TimelineMonthPicker
                months={availableMonths}
                month={timelineYear.months[0]?.month ?? `${timelineYear.year}-01`}
                triggerClassName="display-title cursor-pointer text-2xl font-bold text-[var(--lagoon-deep)] max-sm:px-1.5 sm:text-3xl"
              >
                {timelineYear.year}
              </TimelineMonthPicker>
            </h2>
            {timelineYear.months.map((timelineMonth, monthIndex) => (
              <section
                key={timelineMonth.month}
                id={timelineMonth.month}
                // Mobile: the year's first month pill is pulled up onto the year
                // line. The pull-up is the year line-height (2rem) minus the
                // stuck-state top delta (top-[0.85rem] minus top-2 = 0.35rem),
                // so the "2022 [mai]" pair rests exactly where it sticks and
                // scrolling causes no jump.
                className={
                  monthIndex === 0
                    ? 'mt-[0.6rem] scroll-mt-12 max-sm:-mt-[1.65rem] sm:scroll-mt-4'
                    : 'mt-[0.6rem] scroll-mt-12 sm:scroll-mt-4'
                }
              >
                {/* Mobile: the marker flows above the rows, indented to land
                    beside the stuck year so the pair reads "2022 [mai]" on one
                    line. Desktop (sm:) keeps the zero-height gutter placement. */}
                {/* The first month's gutter label shifts down (net-zero flow
                    margins on a zero-height box) to clear the year text resting
                    above it in the gutter. */}
                <p
                  className={
                    monthIndex === 0
                      ? 'sticky top-[0.85rem] z-10 m-0 w-fit pl-[4.5rem] sm:top-[3.8rem] sm:mt-[2.2rem] sm:-mb-[2.2rem] sm:h-0 sm:-translate-x-[calc(100%+3rem)] sm:pl-0'
                      : 'sticky top-[0.85rem] z-10 m-0 w-fit pl-[4.5rem] sm:top-[3.8rem] sm:h-0 sm:-translate-x-[calc(100%+3rem)] sm:pl-0'
                  }
                >
                  <TimelineMonthPicker
                    months={availableMonths}
                    month={timelineMonth.month}
                    triggerClassName="kicker month-marker chip-glass cursor-pointer rounded-md px-1.5 py-0.5"
                  >
                    {formatMonthLabel(timelineMonth.month)}
                  </TimelineMonthPicker>
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
