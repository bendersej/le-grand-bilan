import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

export const userAgent = 'le-grand-bilan/1.0 (open-data registry of French political decisions)'

export type Result<TData, TErrorCode extends string> =
  | { success: true; data: TData }
  | { success: false; error: { code: TErrorCode; message: string } }
