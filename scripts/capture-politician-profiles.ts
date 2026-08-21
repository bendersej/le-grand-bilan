import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { z } from 'zod'
import { Politician, PoliticianProfile } from '../src/data/schema.ts'
import { repositoryRoot, userAgent } from './utils.ts'
import type { Result } from './utils.ts'

// Captures politician profiles from Wikipedia at commit time (plans/P002):
// summary + lead image via the French Wikipedia REST API, image license via the
// Wikimedia Commons API. Photos are stored self-hosted under public/media/ (the
// site never hotlinks Wikipedia); the Wikipedia/Commons pages stay the cited
// sources. Wikipedia text is CC BY-SA — the site renders the attribution.
//
// Idempotent: politicians with a profile are skipped. `--force` re-checks them
// against Wikipedia but bails per politician when the content hash is unchanged.
// Positional args select specific politician ids; no args = all.
//   pnpm run capture:profiles [id ...] [--force]
//
// `summary` is EDITORIAL: the script seeds it from the article's lead section
// (truncated to ~300 words) only when capturing a new profile, and preserves it
// on every re-run — curate it by hand/agent with markdown highlights afterwards.

const EXIT_CODES = {
  capture_failed: 1,
  ok: 0,
} as const

const WikipediaSummary = z.object({
  content_urls: z.object({ desktop: z.object({ page: z.url() }) }),
  extract: z.string().min(1),
  originalimage: z.object({ source: z.url() }).optional(),
  thumbnail: z.object({ source: z.url() }).optional(),
})

const WikipediaExtract = z.object({
  query: z.object({
    pages: z.record(z.string(), z.object({ extract: z.string().min(1) })),
  }),
})

const CommonsImageInfo = z.object({
  query: z.object({
    pages: z.record(
      z.string(),
      z.object({
        imageinfo: z
          .array(
            z.object({
              descriptionurl: z.url(),
              extmetadata: z.object({
                Artist: z.object({ value: z.string() }).optional(),
                LicenseShortName: z.object({ value: z.string() }).optional(),
              }),
            }),
          )
          .min(1),
      }),
    ),
  }),
})

// Lenient read so schema evolutions (or hand-broken profiles) degrade to
// `null` and get recaptured instead of blocking the script.
const CapturablePolitician = Politician.extend({
  profile: PoliticianProfile.nullable().catch(null),
})

const CapturablePoliticiansFile = z.object({
  $schema: z.string().optional(),
  politicians: z.array(CapturablePolitician).min(1),
})

const politiciansFilePath = join(repositoryRoot, 'data', 'politicians.json')
const photosDirectory = join(repositoryRoot, 'public', 'media', 'politicians')

const sha256 = (content: string): string => createHash('sha256').update(content).digest('hex')

const fetchJson = async (url: string): Promise<Result<unknown, 'fetch_failed'>> => {
  try {
    const response = await fetch(url, { headers: { 'user-agent': userAgent } })
    if (!response.ok) {
      return {
        success: false,
        error: { code: 'fetch_failed', message: `${url} responded ${response.status}` },
      }
    }
    return { success: true, data: await response.json() }
  } catch (e) {
    const error = e as Error
    return {
      success: false,
      error: {
        code: 'fetch_failed',
        message: `fetching ${url} failed: ${error.name}: ${error.message}`,
      },
    }
  }
}

const stripHtml = (html: string): string => html.replace(/<[^>]+>/g, '').trim()

const truncateWords = (text: string, maxWords: number): string => {
  const words = text.split(/\s+/)
  return words.length <= maxWords ? text : `${words.slice(0, maxWords).join(' ')}…`
}

// Commons image URLs look like …/commons/a/ab/Name.jpg or …/commons/thumb/a/ab/Name.jpg/512px-Name.jpg
const commonsFileName = (imageUrl: string): string => {
  const segments = new URL(imageUrl).pathname.split('/')
  const thumbIndex = segments.indexOf('thumb')
  const fileName = thumbIndex === -1 ? segments[segments.length - 1] : segments[thumbIndex + 3]
  return decodeURIComponent(fileName ?? '')
}

const capturePhoto = async (
  politician: Politician,
  imageUrl: string,
): Promise<Result<PoliticianProfile['photo'], 'fetch_failed' | 'no_image' | 'no_license'>> => {
  const fileName = commonsFileName(imageUrl)
  if (fileName === '') {
    return {
      success: false,
      error: {
        code: 'no_image',
        message: `${politician.id}: cannot derive Commons file name from ${imageUrl}`,
      },
    }
  }

  const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=extmetadata%7Curl&titles=${encodeURIComponent(`File:${fileName}`)}`
  const imageInfoResult = await fetchJson(imageInfoUrl)
  if (!imageInfoResult.success) {
    return imageInfoResult
  }

  const imageInfoParsed = CommonsImageInfo.safeParse(imageInfoResult.data)
  const imageInfo = imageInfoParsed.success
    ? Object.values(imageInfoParsed.data.query.pages)[0]?.imageinfo[0]
    : undefined
  if (!imageInfo || !imageInfo.extmetadata.LicenseShortName) {
    return {
      success: false,
      error: {
        code: 'no_license',
        message: `${politician.id}: no license metadata on Commons for ${fileName}`,
      },
    }
  }

  const photoResponse = await ((): Promise<Result<ArrayBuffer, 'fetch_failed'>> => {
    return fetch(imageUrl, { headers: { 'user-agent': userAgent } }).then(
      async (response): Promise<Result<ArrayBuffer, 'fetch_failed'>> => {
        if (!response.ok) {
          return {
            success: false,
            error: { code: 'fetch_failed', message: `${imageUrl} responded ${response.status}` },
          }
        }
        return { success: true, data: await response.arrayBuffer() }
      },
      (e: unknown): Result<ArrayBuffer, 'fetch_failed'> => {
        const error = e as Error
        return {
          success: false,
          error: {
            code: 'fetch_failed',
            message: `downloading ${imageUrl} failed: ${error.name}: ${error.message}`,
          },
        }
      },
    )
  })()
  if (!photoResponse.success) {
    return photoResponse
  }

  const extension =
    extname(new URL(imageUrl).pathname)
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '') || '.jpg'
  const photoFileName = `${politician.id}${extension}`
  mkdirSync(photosDirectory, { recursive: true })
  writeFileSync(join(photosDirectory, photoFileName), Buffer.from(photoResponse.data))

  const artist = imageInfo.extmetadata.Artist ? stripHtml(imageInfo.extmetadata.Artist.value) : ''
  // Commons Artist values are sometimes full license/credit blobs, not a name;
  // past that length the site's fallback credit ("Wikimedia Commons") is better.
  const author = artist === '' || artist.length > 120 ? null : artist
  return {
    success: true,
    data: {
      path: `/media/politicians/${photoFileName}`,
      source_url: imageInfo.descriptionurl,
      license: imageInfo.extmetadata.LicenseShortName.value,
      author,
    },
  }
}

type CaptureOutcome = { changed: false } | { changed: true; profile: PoliticianProfile }

const captureProfile = async (
  politician: Politician,
): Promise<
  Result<CaptureOutcome, 'fetch_failed' | 'invalid_summary' | 'no_image' | 'no_license'>
> => {
  const summaryUrl = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(politician.full_name)}`
  const summaryResult = await fetchJson(summaryUrl)
  if (!summaryResult.success) {
    return summaryResult
  }

  const summaryParsed = WikipediaSummary.safeParse(summaryResult.data)
  if (!summaryParsed.success) {
    return {
      success: false,
      error: {
        code: 'invalid_summary',
        message: `${politician.id}: unexpected Wikipedia summary shape (${summaryParsed.error.message})`,
      },
    }
  }

  const imageUrl = ((): string | null => {
    const rawImageUrl =
      summaryParsed.data.thumbnail?.source ?? summaryParsed.data.originalimage?.source ?? null
    if (rawImageUrl === null) {
      return null
    }
    // upload.wikimedia.org rejects the utm_* query the summary API appends.
    const cleanedUrl = new URL(rawImageUrl)
    cleanedUrl.search = ''
    return cleanedUrl.toString()
  })()

  if (imageUrl === null) {
    return {
      success: false,
      error: { code: 'no_image', message: `${politician.id}: Wikipedia page has no lead image` },
    }
  }

  const extractUrl = `https://fr.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=1&explaintext=1&redirects=1&titles=${encodeURIComponent(politician.full_name)}`
  const extractResult = await fetchJson(extractUrl)
  if (!extractResult.success) {
    return extractResult
  }

  const extractParsed = WikipediaExtract.safeParse(extractResult.data)
  const introText = extractParsed.success
    ? Object.values(extractParsed.data.query.pages)[0]?.extract
    : undefined
  if (introText === undefined) {
    return {
      success: false,
      error: {
        code: 'invalid_summary',
        message: `${politician.id}: no lead-section extract from Wikipedia`,
      },
    }
  }

  const contentHash = sha256(`${introText}\n${imageUrl}`)
  if (politician.profile?.content_hash === contentHash) {
    return { success: true, data: { changed: false } }
  }

  const photoResult = await capturePhoto(politician, imageUrl)
  if (!photoResult.success) {
    return photoResult
  }

  return {
    success: true,
    data: {
      changed: true,
      profile: {
        content_hash: contentHash,
        photo: photoResult.data,
        retrieved_at: new Date().toISOString().slice(0, 10),
        // Editorial field: preserved once set, only seeded on first capture.
        summary: politician.profile?.summary ?? { fr: truncateWords(introText, 300), en: null },
        wikipedia_url: summaryParsed.data.content_urls.desktop.page,
      },
    },
  }
}

const commandArguments = process.argv.slice(2)
const forceRefresh = commandArguments.includes('--force')
const selectedIds = new Set(commandArguments.filter((argument) => !argument.startsWith('--')))

const politiciansFile = CapturablePoliticiansFile.parse(
  JSON.parse(readFileSync(politiciansFilePath, 'utf8')),
)

const captureFailures: string[] = []
const capturedPoliticians: Politician[] = []

for (const politician of politiciansFile.politicians) {
  const isSelected = selectedIds.size === 0 || selectedIds.has(politician.id)
  const shouldCapture = isSelected && (politician.profile === null || forceRefresh)
  if (!shouldCapture) {
    capturedPoliticians.push(politician)
    continue
  }

  // Wikimedia rate-limits bursts (429): pace the requests per politician.
  await new Promise((resolve) => setTimeout(resolve, 1500))
  const captureResult = await captureProfile(politician)
  if (!captureResult.success) {
    captureFailures.push(`${captureResult.error.code}: ${captureResult.error.message}`)
    capturedPoliticians.push(politician)
    continue
  }

  if (!captureResult.data.changed) {
    console.info(`unchanged: ${politician.id}`)
    capturedPoliticians.push(politician)
    continue
  }

  console.info(
    `captured profile for ${politician.id} (${captureResult.data.profile.photo.license})`,
  )
  capturedPoliticians.push({ ...politician, profile: captureResult.data.profile })
}

writeFileSync(
  politiciansFilePath,
  `${JSON.stringify({ ...politiciansFile, politicians: capturedPoliticians }, null, 2)}\n`,
)

if (captureFailures.length > 0) {
  for (const captureFailure of captureFailures) {
    console.error(captureFailure)
  }
  process.exitCode = EXIT_CODES.capture_failed
}
