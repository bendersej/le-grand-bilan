import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  AppearancesMonthFile,
  CategoriesFile,
  DecisionsMonthFile,
  PoliticiansFile,
} from './schema.ts'

const repositoryRoot = join(import.meta.dirname, '..', '..')
const dataDirectory = join(repositoryRoot, 'data')
const appearancesDirectory = join(dataDirectory, 'appearances')
const decisionsDirectory = join(dataDirectory, 'decisions')
const publicDirectory = join(repositoryRoot, 'public')
const schemasDirectory = join(repositoryRoot, 'schemas')

const readJson = (filePath: string): unknown => JSON.parse(readFileSync(filePath, 'utf8'))

const categoriesFile = CategoriesFile.parse(readJson(join(dataDirectory, 'categories.json')))
const politiciansFile = PoliticiansFile.parse(readJson(join(dataDirectory, 'politicians.json')))

const decisionsMonthFileNames = readdirSync(decisionsDirectory).toSorted()
const decisionsMonthFiles = decisionsMonthFileNames.map((fileName) => ({
  fileName,
  parsed: DecisionsMonthFile.parse(readJson(join(decisionsDirectory, fileName))),
}))

const appearancesMonthFileNames = readdirSync(appearancesDirectory).toSorted()
const appearancesMonthFiles = appearancesMonthFileNames.map((fileName) => ({
  fileName,
  parsed: AppearancesMonthFile.parse(readJson(join(appearancesDirectory, fileName))),
}))

const allDecisions = decisionsMonthFiles.flatMap(({ parsed }) => parsed.decisions)
const allAppearances = appearancesMonthFiles.flatMap(({ parsed }) => parsed.appearances)

describe('data files', () => {
  it('only contains yyyy-mm.json files in data/decisions', () => {
    for (const fileName of decisionsMonthFileNames) {
      expect(fileName).toMatch(/^\d{4}-(0[1-9]|1[0-2])\.json$/)
    }
  })

  it('only contains yyyy-mm.json files in data/appearances', () => {
    for (const fileName of appearancesMonthFileNames) {
      expect(fileName).toMatch(/^\d{4}-(0[1-9]|1[0-2])\.json$/)
    }
  })

  it('has a month field matching each file name', () => {
    for (const { fileName, parsed } of [...decisionsMonthFiles, ...appearancesMonthFiles]) {
      expect(parsed.month).toBe(fileName.replace(/\.json$/, ''))
    }
  })

  it('only contains appearances dated within their file month', () => {
    for (const { parsed } of appearancesMonthFiles) {
      for (const appearance of parsed.appearances) {
        expect(appearance.date.startsWith(`${parsed.month}-`)).toBe(true)
      }
    }
  })

  it('has globally unique appearance ids', () => {
    const appearanceIds = allAppearances.map((appearance) => appearance.id)
    expect(new Set(appearanceIds).size).toBe(appearanceIds.length)
  })

  it('stores every profile photo in public/', () => {
    for (const politician of politiciansFile.politicians) {
      if (politician.profile === null) {
        continue
      }
      expect(
        existsSync(join(publicDirectory, politician.profile.photo.path)),
        `photo ${politician.profile.photo.path} of ${politician.id} is missing from public/`,
      ).toBe(true)
    }
  })

  it('only contains decisions dated within their file month', () => {
    for (const { parsed } of decisionsMonthFiles) {
      for (const decision of parsed.decisions) {
        expect(decision.date.startsWith(`${parsed.month}-`)).toBe(true)
      }
    }
  })

  it('has globally unique decision ids', () => {
    const decisionIds = allDecisions.map((decision) => decision.id)
    expect(new Set(decisionIds).size).toBe(decisionIds.length)
  })

  it('has unique category and politician ids', () => {
    const categoryIds = categoriesFile.categories.map((category) => category.id)
    const politicianIds = politiciansFile.politicians.map((politician) => politician.id)
    expect(new Set(categoryIds).size).toBe(categoryIds.length)
    expect(new Set(politicianIds).size).toBe(politicianIds.length)
  })

  it('contains no em dashes in content text fields', () => {
    const contentTexts: Array<{ owner: string; text: string }> = [
      ...allDecisions.flatMap((decision) => [
        {
          owner: `decision ${decision.id} title`,
          text: `${decision.title.fr} ${decision.title.en ?? ''}`,
        },
        {
          owner: `decision ${decision.id} summary`,
          text: `${decision.summary.fr} ${decision.summary.en ?? ''}`,
        },
      ]),
      ...allAppearances.map((appearance) => ({
        owner: `appearance ${appearance.id} title`,
        text: `${appearance.title.fr} ${appearance.title.en ?? ''}`,
      })),
      ...categoriesFile.categories.map((category) => ({
        owner: `category ${category.id} label`,
        text: `${category.label.fr} ${category.label.en ?? ''}`,
      })),
      ...politiciansFile.politicians.flatMap((politician) => [
        ...politician.mandates.map((mandate) => ({
          owner: `politician ${politician.id} mandate role`,
          text: `${mandate.role.fr} ${mandate.role.en ?? ''}`,
        })),
        ...(politician.profile
          ? [
              {
                owner: `politician ${politician.id} profile summary`,
                text: `${politician.profile.summary.fr} ${politician.profile.summary.en ?? ''}`,
              },
            ]
          : []),
      ]),
    ]

    for (const contentText of contentTexts) {
      expect(contentText.text.includes('—'), `${contentText.owner} contains an em dash`).toBe(false)
    }
  })

  it('lists categories and politicians in lexicographic id order', () => {
    const categoryIds = categoriesFile.categories.map((category) => category.id)
    const politicianIds = politiciansFile.politicians.map((politician) => politician.id)
    expect(categoryIds).toEqual(categoryIds.toSorted())
    expect(politicianIds).toEqual(politicianIds.toSorted())
  })
})

describe('referential integrity', () => {
  const knownCategoryIds = new Set(categoriesFile.categories.map((category) => category.id))
  const knownPoliticianIds = new Set(politiciansFile.politicians.map((politician) => politician.id))
  const knownDecisionIds = new Set(allDecisions.map((decision) => decision.id))

  it('only references known category ids', () => {
    for (const decision of allDecisions) {
      for (const categoryId of decision.category_ids) {
        expect(
          knownCategoryIds,
          `decision ${decision.id} references category ${categoryId}`,
        ).toContain(categoryId)
      }
    }
  })

  it('only references known politician ids', () => {
    for (const decision of allDecisions) {
      for (const politicianId of decision.politician_ids) {
        expect(
          knownPoliticianIds,
          `decision ${decision.id} references politician ${politicianId}`,
        ).toContain(politicianId)
      }
    }
  })

  it('only relates decisions to other known decisions', () => {
    for (const decision of allDecisions) {
      for (const relation of decision.relations) {
        expect(
          knownDecisionIds,
          `decision ${decision.id} relates to ${relation.decision_id}`,
        ).toContain(relation.decision_id)
        expect(relation.decision_id, `decision ${decision.id} relates to itself`).not.toBe(
          decision.id,
        )
      }
    }
  })

  it('only references known ids from appearances', () => {
    for (const appearance of allAppearances) {
      for (const politicianId of appearance.politician_ids) {
        expect(
          knownPoliticianIds,
          `appearance ${appearance.id} references politician ${politicianId}`,
        ).toContain(politicianId)
      }
      for (const decisionId of appearance.decision_ids) {
        expect(
          knownDecisionIds,
          `appearance ${appearance.id} references decision ${decisionId}`,
        ).toContain(decisionId)
      }
    }
  })
})

describe('generated JSON Schemas', () => {
  const expectedJsonSchemasByFileName = {
    'appearances-month.schema.json': z.toJSONSchema(AppearancesMonthFile),
    'categories.schema.json': z.toJSONSchema(CategoriesFile),
    'decisions-month.schema.json': z.toJSONSchema(DecisionsMonthFile),
    'politicians.schema.json': z.toJSONSchema(PoliticiansFile),
  } as const

  it.each(Object.entries(expectedJsonSchemasByFileName))(
    'has an up-to-date committed schemas/%s (run pnpm generate:json-schemas)',
    (fileName, expectedJsonSchema) => {
      const committedJsonSchema = readJson(join(schemasDirectory, fileName))
      expect(committedJsonSchema).toEqual(expectedJsonSchema)
    },
  )
})
