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

const Politician = z.object({
  id: Slug,
  full_name: z.string().min(1),
  party: z.string().min(1).nullable(),
  mandates: z.array(Mandate).min(1),
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

// Sources must cite the EXACT document (e.g. a Légifrance jorf/id page), never a
// site root or search page; the pathname check rejects the obvious violations.
const DecisionSource = z.object({
  url: z.url().refine((url) => new URL(url).pathname !== '/', {
    message: 'must point to the exact document URL, not a site root',
  }),
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

export {
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
  PoliticiansFile,
  Slug,
  YearMonth,
}
