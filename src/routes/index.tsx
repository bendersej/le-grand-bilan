import { createFileRoute } from '@tanstack/react-router'
import DecisionRow from '../components/DecisionRow'
import { formatMonthLabel } from '../data/format.ts'
import { timelineYears } from '../data/registry.ts'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="page-wrap px-4 py-12">
      <h1 className="display-title m-0 text-3xl font-bold sm:text-4xl">Le Grand Bilan</h1>
      <p className="m-0 mt-2 text-[var(--sea-ink-soft)]">Qui a fait quoi. Quand.</p>

      <div className="mt-10 space-y-14 border-l border-[var(--line)] pl-5 sm:pl-8">
        {timelineYears.map((timelineYear) => (
          <section key={timelineYear.year}>
            <h2 className="display-title m-0 text-4xl font-bold text-[var(--lagoon-deep)]">
              {timelineYear.year}
            </h2>
            {timelineYear.months.map((timelineMonth) => (
              <section key={timelineMonth.month} className="mt-6">
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
    </main>
  )
}
