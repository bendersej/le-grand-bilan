import { z } from 'zod'

// Single source of truth for the data model. Consumed by:
// - the site (data loading at build time)
// - the data validation tests (src/data/data.test.ts)
// - the JSON Schema generation script (scripts/generate-json-schemas.ts)
// - later phases: MCP server + submission API input validation (plans/P001)

const Slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a lowercase-dash-separated slug')
type Slug = z.infer<typeof Slug>

const IsoDate = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, 'must be yyyy-mm-dd')
type IsoDate = z.infer<typeof IsoDate>

const YearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'must be yyyy-mm')
type YearMonth = z.infer<typeof YearMonth>

// Cited URLs must point to the EXACT document (e.g. a Légifrance jorf/id page),
// never a site root or search page; the pathname check rejects the obvious violations.
const ExactUrl = z.url().refine((url) => new URL(url).pathname !== '/', {
  message: 'must point to the exact document URL, not a site root',
})
type ExactUrl = z.infer<typeof ExactUrl>

const LocalizedText = z.object({
  fr: z.string().min(1),
  en: z.string().min(1).nullable(),
})
type LocalizedText = z.infer<typeof LocalizedText>

const Category = z.object({
  id: Slug,
  label: LocalizedText,
})
type Category = z.infer<typeof Category>

const CategoriesFile = z.object({
  $schema: z.string().optional(),
  categories: z.array(Category).min(1),
})
type CategoriesFile = z.infer<typeof CategoriesFile>

const Mandate = z.object({
  role: LocalizedText,
  from: IsoDate,
  to: IsoDate.nullable(),
})
type Mandate = z.infer<typeof Mandate>

// Captured by scripts/capture-politician-profiles.ts from Wikipedia — never
// hand-written. The photo is self-hosted (public/media/politicians/), the
// Wikipedia/Commons URLs stay as the cited sources (plans/P002).
const PoliticianPhoto = z.object({
  path: z.string().regex(/^\/media\/politicians\/[a-z0-9-]+\.[a-z0-9]+$/, {
    message: 'must be a self-hosted /media/politicians/ path',
  }),
  source_url: ExactUrl,
  license: z.string().min(1),
  author: z.string().min(1).nullable(),
})
type PoliticianPhoto = z.infer<typeof PoliticianPhoto>

const PoliticianProfile = z.object({
  // sha256 of the captured Wikipedia content; lets re-runs bail without
  // re-downloading when nothing changed upstream.
  content_hash: z.string().length(64),
  photo: PoliticianPhoto,
  retrieved_at: IsoDate,
  summary: LocalizedText,
  wikipedia_url: ExactUrl,
})
type PoliticianProfile = z.infer<typeof PoliticianProfile>

const Politician = z.object({
  id: Slug,
  full_name: z.string().min(1),
  party: z.string().min(1).nullable(),
  mandates: z.array(Mandate).min(1),
  profile: PoliticianProfile.nullable(),
})
type Politician = z.infer<typeof Politician>

const PoliticiansFile = z.object({
  $schema: z.string().optional(),
  politicians: z.array(Politician).min(1),
})
type PoliticiansFile = z.infer<typeof PoliticiansFile>

const DecisionRelationType = z.enum(['amends', 'implements', 'related', 'repeals'])
type DecisionRelationType = z.infer<typeof DecisionRelationType>

const DecisionRelation = z.object({
  type: DecisionRelationType,
  decision_id: Slug,
})
type DecisionRelation = z.infer<typeof DecisionRelation>

const DecisionSource = z.object({
  url: ExactUrl,
  title: z.string().min(1),
})
type DecisionSource = z.infer<typeof DecisionSource>

const Decision = z.object({
  id: Slug,
  date: IsoDate,
  title: LocalizedText,
  summary: LocalizedText,
  category_ids: z.array(Slug).min(1),
  politician_ids: z.array(Slug).min(1),
  // Open-data registry: at least one source is mandatory, the more the better.
  sources: z.array(DecisionSource).min(1),
  relations: z.array(DecisionRelation),
})
type Decision = z.infer<typeof Decision>

// One file per month: data/decisions/yyyy-mm.json, `month` must match the filename.
const DecisionsMonthFile = z.object({
  $schema: z.string().optional(),
  month: YearMonth,
  decisions: z.array(Decision).min(1),
})
type DecisionsMonthFile = z.infer<typeof DecisionsMonthFile>

// Public appearances (speeches, TV shows) of politicians. The INA/YouTube link
// is the cited source; the media itself is archived to R2 ("never forget") by
// scripts/archive-appearances.ts, which fills `media` (plans/P002).
const AppearanceMedia = z.object({
  archived_at: IsoDate,
  content_type: z.string().min(1),
  r2_key: z.string().min(1),
  // sha256 of the archived file: integrity record for the "never forget"
  // archive, and the idempotence check for forced re-runs.
  sha256: z.string().length(64),
})
type AppearanceMedia = z.infer<typeof AppearanceMedia>

const Appearance = z.object({
  id: Slug,
  date: IsoDate,
  title: LocalizedText,
  politician_ids: z.array(Slug).min(1),
  decision_ids: z.array(Slug),
  source_url: ExactUrl,
  media: AppearanceMedia.nullable(),
})
type Appearance = z.infer<typeof Appearance>

// One file per month: data/appearances/yyyy-mm.json, `month` must match the filename.
const AppearancesMonthFile = z.object({
  $schema: z.string().optional(),
  month: YearMonth,
  appearances: z.array(Appearance).min(1),
})
type AppearancesMonthFile = z.infer<typeof AppearancesMonthFile>

export {
  Appearance,
  AppearanceMedia,
  AppearancesMonthFile,
  CategoriesFile,
  Category,
  Decision,
  DecisionRelation,
  DecisionRelationType,
  DecisionSource,
  DecisionsMonthFile,
  IsoDate,
  LocalizedText,
  Mandate,
  Politician,
  PoliticianProfile,
  PoliticiansFile,
  Slug,
  YearMonth,
}
