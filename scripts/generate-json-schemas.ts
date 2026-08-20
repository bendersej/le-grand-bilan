import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { CategoriesFile, DecisionsMonthFile, PoliticiansFile } from '../src/data/schema.ts'

// Emits the JSON Schemas referenced by the `$schema` key of the data files,
// giving editor autocomplete + validation to external contributors (open data).
// CI verifies the emitted files are committed and in sync (src/data/data.test.ts).

const EXIT_CODES = {
  ok: 0,
} as const

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const schemasDirectory = join(repositoryRoot, 'schemas')

const jsonSchemasByFileName = {
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

process.exit(EXIT_CODES.ok)
