import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import {
  AppearancesMonthFile,
  CategoriesFile,
  DecisionsMonthFile,
  PoliticiansFile,
} from '../src/data/schema.ts'
import { repositoryRoot } from './utils.ts'

// Emits the JSON Schemas referenced by the `$schema` key of the data files,
// giving editor autocomplete + validation to external contributors (open data).
// CI verifies the emitted files are committed and in sync (src/data/data.test.ts).

const schemasDirectory = join(repositoryRoot, 'schemas')

const jsonSchemasByFileName = {
  'appearances-month.schema.json': z.toJSONSchema(AppearancesMonthFile),
  'categories.schema.json': z.toJSONSchema(CategoriesFile),
  'decisions-month.schema.json': z.toJSONSchema(DecisionsMonthFile),
  'politicians.schema.json': z.toJSONSchema(PoliticiansFile),
} as const

mkdirSync(schemasDirectory, { recursive: true })

for (const [fileName, jsonSchema] of Object.entries(jsonSchemasByFileName)) {
  const filePath = join(schemasDirectory, fileName)
  writeFileSync(filePath, `${JSON.stringify(jsonSchema, null, 2)}\n`)
  console.info(`generated ${filePath}`)
}
