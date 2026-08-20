import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CategoriesFile, DecisionsMonthFile, PoliticiansFile } from '../src/data/schema.ts'
import { repositoryRoot } from './utils.ts'

// Validates the prerendered build output so an accidentally-empty site can never
// go green in CI. Run AFTER `pnpm run build` (CI runs it in checks AND in deploy,
// on the exact artifact wrangler ships).
// Expectations derive from the data registry itself: the homepage timeline must
// list every decision inside <main>, and every reachable entity page must render
// its content inside its modal (role="dialog") — the always-visible timeline
// satisfies naive whole-page markers on every URL, so only the dialog slice
// proves the entity route rendered (a throwing route can emit a shell and still
// exit 0).

const EXIT_CODES = {
  empty_registry: 4,
  missing_dialog: 5,
  missing_main: 3,
  missing_marker: 2,
  missing_page: 1,
  ok: 0,
} as const

const clientDirectory = join(repositoryRoot, 'dist', 'client')
const dataDirectory = join(repositoryRoot, 'data')

const readJson = (filePath: string): unknown => JSON.parse(readFileSync(filePath, 'utf8'))

const categories = CategoriesFile.parse(readJson(join(dataDirectory, 'categories.json'))).categories
const politicians = PoliticiansFile.parse(
  readJson(join(dataDirectory, 'politicians.json')),
).politicians
const decisions = readdirSync(join(dataDirectory, 'decisions'))
  .toSorted()
  .flatMap(
    (fileName) =>
      DecisionsMonthFile.parse(readJson(join(dataDirectory, 'decisions', fileName))).decisions,
  )

// Pages only exist when the prerender crawler can reach them through a link, so
// only entities referenced by at least one decision are expected to have a page.
const referencedCategoryIds = new Set(decisions.flatMap((decision) => decision.category_ids))
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
  dialogMarkers: string[]
}

const pageExpectations: PageExpectation[] = [
  {
    path: 'index.html',
    documentMarkers: ['lang="fr"'],
    mainMarkers: [
      'Qui a fait quoi. Quand.',
      ...decisions.map((decision) => escapeHtml(decision.title.fr)),
    ],
    dialogMarkers: [],
  },
  {
    path: 'about/index.html',
    documentMarkers: ['lang="fr"'],
    mainMarkers: [],
    dialogMarkers: ['Un bilan factuel'],
  },
  ...decisions.map((decision) => ({
    path: `decisions/${decision.id}/index.html`,
    documentMarkers: ['lang="fr"'],
    mainMarkers: [],
    dialogMarkers: [escapeHtml(decision.title.fr), ...decision.sources.map((source) => source.url)],
  })),
  ...politicians
    .filter((politician) => referencedPoliticianIds.has(politician.id))
    .map((politician) => ({
      path: `politiciens/${politician.id}/index.html`,
      documentMarkers: [],
      mainMarkers: [],
      dialogMarkers: [escapeHtml(politician.full_name)],
    })),
  ...categories
    .filter((category) => referencedCategoryIds.has(category.id))
    .map((category) => ({
      path: `categories/${category.id}/index.html`,
      documentMarkers: [],
      mainMarkers: [],
      dialogMarkers: [escapeHtml(category.label.fr)],
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

  if (pageExpectation.dialogMarkers.length === 0) {
    return
  }

  const dialogStart = pageHtml.indexOf('role="dialog"')
  if (dialogStart === -1) {
    failures.push({
      exitCode: EXIT_CODES.missing_dialog,
      message: `smoketest: ${pageExpectation.path} has no modal (role="dialog") — the route likely failed to render`,
    })
    return
  }

  const dialogHtml = pageHtml.slice(dialogStart)
  for (const marker of pageExpectation.dialogMarkers) {
    if (!dialogHtml.includes(marker)) {
      failures.push({
        exitCode: EXIT_CODES.missing_marker,
        message: `smoketest: modal of ${pageExpectation.path} does not contain "${marker}"`,
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
    `smoketest: ${pageExpectations.length} pages ok (${decisions.length} decisions, ${referencedPoliticianIds.size} politicians, ${referencedCategoryIds.size} categories)`,
  )
}
