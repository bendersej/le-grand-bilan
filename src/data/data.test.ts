import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { CategoriesFile, DecisionsMonthFile, PoliticiansFile } from './schema.ts'

const repositoryRoot = join(import.meta.dirname, '..', '..')
const dataDirectory = join(repositoryRoot, 'data')
const decisionsDirectory = join(dataDirectory, 'decisions')
const schemasDirectory = join(repositoryRoot, 'schemas')

const readJson = (filePath: string): unknown => JSON.parse(readFileSync(filePath, 'utf8'))

const categoriesFile = CategoriesFile.parse(readJson(join(dataDirectory, 'categories.json')))
const politiciansFile = PoliticiansFile.parse(readJson(join(dataDirectory, 'politicians.json')))

const decisionsMonthFileNames = readdirSync(decisionsDirectory).toSorted()
const decisionsMonthFiles = decisionsMonthFileNames.map((fileName) => ({
  fileName,
  parsed: DecisionsMonthFile.parse(readJson(join(decisionsDirectory, fileName))),
}))

const allDecisions = decisionsMonthFiles.flatMap(({ parsed }) => parsed.decisions)

describe('data files', () => {
  it('only contains yyyy-mm.json files in data/decisions', () => {
    for (const fileName of decisionsMonthFileNames) {
      expect(fileName).toMatch(/^\d{4}-(0[1-9]|1[0-2])\.json$/)
    }
  })

  it('has a month field matching each file name', () => {
    for (const { fileName, parsed } of decisionsMonthFiles) {
      expect(parsed.month).toBe(fileName.replace(/\.json$/, ''))
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
})

describe('generated JSON Schemas', () => {
  const expectedJsonSchemasByFileName = {
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
