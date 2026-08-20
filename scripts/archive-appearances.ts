import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { z } from 'zod'
import { Appearance, AppearanceMedia } from '../src/data/schema.ts'
import { repositoryRoot } from './utils.ts'

// Archives appearance media to R2 ("never forget", plans/P002): every appearance
// with `media: null` is downloaded from its source (yt-dlp) and uploaded to the
// le-grand-bilan-media bucket, then the data file records the asset (with its
// sha256). Run locally at commit time — commit the updated data file with the entry.
//
// Idempotent: archived appearances are skipped. `--force` re-downloads them but
// bails per appearance when the file's sha256 is unchanged (no re-upload).
// Positional args select specific appearance ids; no args = all.
//   pnpm run archive:appearances [id ...] [--force]

const EXIT_CODES = {
  archive_failed: 1,
  ok: 0,
} as const

const R2_BUCKET = 'le-grand-bilan-media'

// Lenient read so schema evolutions degrade to `null` and get re-archived
// instead of blocking the script.
const ArchivableAppearance = Appearance.extend({
  media: AppearanceMedia.nullable().catch(null),
})

const ArchivableAppearancesMonthFile = z.object({
  $schema: z.string().optional(),
  month: z.string(),
  appearances: z.array(ArchivableAppearance).min(1),
})

const appearancesDirectory = join(repositoryRoot, 'data', 'appearances')
const downloadDirectory = mkdtempSync(join(tmpdir(), 'lgb-appearances-'))

const commandArguments = process.argv.slice(2)
const forceRefresh = commandArguments.includes('--force')
const selectedIds = new Set(commandArguments.filter((argument) => !argument.startsWith('--')))

const archiveFailures: string[] = []

const runCommand = (command: string, args: string[]): boolean => {
  const commandResult = spawnSync(command, args, { stdio: 'inherit' })
  return commandResult.status === 0
}

for (const fileName of readdirSync(appearancesDirectory).toSorted()) {
  const filePath = join(appearancesDirectory, fileName)
  const appearancesFile = ArchivableAppearancesMonthFile.parse(
    JSON.parse(readFileSync(filePath, 'utf8')),
  )

  const archivedAppearances = appearancesFile.appearances.map((appearance) => {
    const isSelected = selectedIds.size === 0 || selectedIds.has(appearance.id)
    const shouldArchive = isSelected && (appearance.media === null || forceRefresh)
    if (!shouldArchive) {
      return appearance
    }

    console.info(`archiving ${appearance.id} from ${appearance.source_url}`)
    const downloadPath = join(downloadDirectory, `${appearance.id}.mp4`)
    // web_embedded is the client that currently works without a PO token; the
    // duration cap keeps full-session recordings (and R2 storage) in check.
    const downloaded = runCommand('yt-dlp', [
      '--extractor-args',
      'youtube:player_client=web_embedded',
      '--format',
      'bv*[height<=480]+ba/b[height<=480]/b',
      '--merge-output-format',
      'mp4',
      '--match-filter',
      'duration<=1200',
      '--output',
      downloadPath,
      appearance.source_url,
    ])
    if (!downloaded) {
      archiveFailures.push(`${appearance.id}: yt-dlp failed for ${appearance.source_url}`)
      return appearance
    }

    const fileSha256 = createHash('sha256').update(readFileSync(downloadPath)).digest('hex')
    if (appearance.media !== null && appearance.media.sha256 === fileSha256) {
      console.info(`unchanged: ${appearance.id}`)
      return appearance
    }

    const r2Key = `appearances/${appearance.id}.mp4`
    const uploaded = runCommand('pnpm', [
      'exec',
      'wrangler',
      'r2',
      'object',
      'put',
      `${R2_BUCKET}/${r2Key}`,
      '--file',
      downloadPath,
      '--content-type',
      'video/mp4',
      '--remote',
    ])
    if (!uploaded) {
      archiveFailures.push(`${appearance.id}: R2 upload failed for ${r2Key}`)
      return appearance
    }

    return {
      ...appearance,
      media: {
        archived_at: new Date().toISOString().slice(0, 10),
        content_type: 'video/mp4',
        r2_key: r2Key,
        sha256: fileSha256,
      },
    }
  })

  writeFileSync(
    filePath,
    `${JSON.stringify({ ...appearancesFile, appearances: archivedAppearances }, null, 2)}\n`,
  )
}

rmSync(downloadDirectory, { recursive: true, force: true })

if (archiveFailures.length > 0) {
  for (const archiveFailure of archiveFailures) {
    console.error(archiveFailure)
  }
  process.exitCode = EXIT_CODES.archive_failed
}
