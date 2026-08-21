import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { AppearancesMonthFile, DecisionsMonthFile, PoliticiansFile } from '../src/data/schema.ts'
import { repositoryRoot } from './utils.ts'

// Validates the prerendered build output so an accidentally-empty site can never
// go green in CI. Run AFTER `pnpm run build` (CI runs it in checks AND in deploy,
// on the exact artifact wrangler ships).
// Expectations derive from the data registry itself: the homepage timeline must
// list every decision inside <main>, and every entity page must render its
// content in the in-flow panel at the top of the timeline — sliced between the
// data-panel and data-timeline sentinels, because the always-visible timeline
// satisfies naive whole-page markers on every URL (a throwing route can emit a
// shell and still exit 0).

const EXIT_CODES = {
  empty_registry: 4,
  missing_main: 3,
  missing_marker: 2,
  missing_page: 1,
  missing_panel: 5,
  ok: 0,
} as const

const clientDirectory = join(repositoryRoot, 'dist', 'client')
const dataDirectory = join(repositoryRoot, 'data')

const readJson = (filePath: string): unknown => JSON.parse(readFileSync(filePath, 'utf8'))

const politicians = PoliticiansFile.parse(
  readJson(join(dataDirectory, 'politicians.json')),
).politicians
const decisions = readdirSync(join(dataDirectory, 'decisions'))
  .toSorted()
  .flatMap(
    (fileName) =>
      DecisionsMonthFile.parse(readJson(join(dataDirectory, 'decisions', fileName))).decisions,
  )
const appearances = readdirSync(join(dataDirectory, 'appearances'))
  .toSorted()
  .flatMap(
    (fileName) =>
      AppearancesMonthFile.parse(readJson(join(dataDirectory, 'appearances', fileName)))
        .appearances,
  )

// Pages only exist when the prerender crawler can reach them through a link, so
// only entities referenced by at least one decision are expected to have a page.
// Categories have no pages: they filter the timeline client-side (?categorie=).
const referencedPoliticianIds = new Set(decisions.flatMap((decision) => decision.politician_ids))

// React escapes text content, so markers derived from data must match its escaping.
const escapeHtml = (text: string): string =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#x27;')

type PageExpectation = {
  path: string
  documentMarkers: string[]
  mainMarkers: string[]
  panelMarkers: string[]
}

const pageExpectations: PageExpectation[] = [
  {
    path: 'index.html',
    documentMarkers: ['lang="fr"'],
    mainMarkers: [
      'Qui a fait quoi. Quand.',
      ...decisions.map((decision) => escapeHtml(decision.title.fr)),
    ],
    panelMarkers: [],
  },
  // About is a standalone page (no timeline below), so its content lives in <main>.
  {
    path: 'about/index.html',
    documentMarkers: ['lang="fr"'],
    mainMarkers: ['Un bilan factuel', 'github.com/bendersej/le-grand-bilan'],
    panelMarkers: [],
  },
  ...decisions.map((decision) => ({
    path: `decisions/${decision.id}/index.html`,
    documentMarkers: ['lang="fr"'],
    mainMarkers: [],
    // bot_walled sources are recorded but not rendered (pending human verification).
    panelMarkers: [
      escapeHtml(decision.title.fr),
      ...decision.sources
        .filter((source) => source.bot_walled === undefined)
        .map((source) => source.url),
    ],
  })),
  ...politicians
    .filter((politician) => referencedPoliticianIds.has(politician.id))
    .map((politician) => ({
      path: `responsables/${politician.id}/index.html`,
      documentMarkers: [],
      // Appearances render in the politician's scoped timeline (main), not the panel.
      mainMarkers: appearances
        .filter((appearance) => appearance.politician_ids.includes(politician.id))
        .map((appearance) => escapeHtml(appearance.title.fr)),
      panelMarkers: [
        escapeHtml(politician.full_name),
        ...(politician.profile ? [politician.profile.photo.path] : []),
      ],
    })),
]

const failures: Array<{ exitCode: number; message: string }> = []

if (decisions.length === 0) {
  failures.push({
    exitCode: EXIT_CODES.empty_registry,
    message: 'smoketest: the decisions registry is empty — nothing to validate',
  })
}

const checkPage = (pageExpectation: PageExpectation): void => {
  const pageHtml = ((): string | null => {
    try {
      return readFileSync(join(clientDirectory, pageExpectation.path), 'utf8')
    } catch (e) {
      const error = e as Error
      failures.push({
        exitCode: EXIT_CODES.missing_page,
        message: `smoketest: cannot read ${pageExpectation.path} (${error.name}: ${error.message}) — did the build run?`,
      })
      return null
    }
  })()

  if (pageHtml === null) {
    return
  }

  for (const marker of pageExpectation.documentMarkers) {
    if (!pageHtml.includes(marker)) {
      failures.push({
        exitCode: EXIT_CODES.missing_marker,
        message: `smoketest: ${pageExpectation.path} does not contain "${marker}"`,
      })
    }
  }

  const mainStart = pageHtml.indexOf('<main')
  const mainEnd = pageHtml.lastIndexOf('</main>')
  if (mainStart === -1 || mainEnd === -1) {
    failures.push({
      exitCode: EXIT_CODES.missing_main,
      message: `smoketest: ${pageExpectation.path} has no <main> — the route likely failed to render`,
    })
    return
  }

  const mainHtml = pageHtml.slice(mainStart, mainEnd)
  for (const marker of pageExpectation.mainMarkers) {
    if (!mainHtml.includes(marker)) {
      failures.push({
        exitCode: EXIT_CODES.missing_marker,
        message: `smoketest: <main> of ${pageExpectation.path} does not contain "${marker}"`,
      })
    }
  }

  if (pageExpectation.panelMarkers.length === 0) {
    return
  }

  const panelStart = pageHtml.indexOf('data-panel')
  const timelineStart = pageHtml.indexOf('data-timeline')
  if (panelStart === -1 || timelineStart === -1 || panelStart > timelineStart) {
    failures.push({
      exitCode: EXIT_CODES.missing_panel,
      message: `smoketest: ${pageExpectation.path} has no content panel above the timeline — the route likely failed to render`,
    })
    return
  }

  const panelHtml = pageHtml.slice(panelStart, timelineStart)
  for (const marker of pageExpectation.panelMarkers) {
    if (!panelHtml.includes(marker)) {
      failures.push({
        exitCode: EXIT_CODES.missing_marker,
        message: `smoketest: panel of ${pageExpectation.path} does not contain "${marker}"`,
      })
    }
  }
}

for (const pageExpectation of pageExpectations) {
  checkPage(pageExpectation)
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(failure.message)
  }
  process.exitCode = failures[0]?.exitCode ?? EXIT_CODES.missing_marker
} else {
  console.info(
    `smoketest: ${pageExpectations.length} pages ok (${decisions.length} decisions, ${referencedPoliticianIds.size} politicians)`,
  )
}
