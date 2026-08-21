import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { isAbsolute, join, relative } from 'node:path'
import { DecisionsMonthFile } from '../src/data/schema.ts'
import { repositoryRoot, userAgent } from './utils.ts'
import type { Result } from './utils.ts'

// Review-gate verifier for the sourcing batches (plans/P003): fetches every
// source URL in the given decision month files and checks the document matches
// its citation. VERIFIED requires a strong signal — act numbers from the source
// title, or half its words, found in the page headline (<title>/<h1>) with
// word boundaries; matches found only in the page body demote to REACHABLE
// (spot-check), because same-site chrome and listing pages that cite many acts
// would otherwise "verify" the wrong document. A word-based VERIFIED is still
// weaker than an act-number one: near-identical sibling documents (déclaration
// vs conférence de presse on one event) can swap undetected — the sourcing
// agent's own fetch-verification stays the primary gate. Hosts that block automated
// fetches (Légifrance's Datadome wall) are not failures: they come back as a
// WALLED list to verify via an agent's web-fetch tool, next to the data's own
// bot_walled sources awaiting a human pass. Only mismatches and unreachable
// documents fail the run.
//   pnpm run verify:sources                          → the git-changed/untracked month files
//   pnpm run verify:sources 2013                     → every data/decisions/2013-*.json
//   pnpm run verify:sources data/decisions/2014-10.json

const EXIT_CODES = {
  crash: 4,
  mismatch: 2,
  no_files: 3,
  ok: 0,
  unreachable: 1,
} as const

// Statuses bot walls answer with (Datadome, Cloudflare, WAFs); anything else
// non-200 means the document genuinely is not there. 503 lands here too: a
// briefly-down host should surface as "verify by hand", not fail the batch.
const WALLED_STATUSES = new Set([401, 403, 406, 503])

const MAX_BODY_BYTES = 50_000_000

const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

type FetchedDocument = {
  bytes: ArrayBuffer
  contentType: string | null
  finalUrl: string
  status: number
}

type FetchErrorCode = 'network_error' | 'oversize_body'

const fetchDocument = async (url: string): Promise<Result<FetchedDocument, FetchErrorCode>> => {
  const attempt = async (): Promise<Result<FetchedDocument, FetchErrorCode>> => {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': userAgent },
        redirect: 'follow',
        signal: AbortSignal.timeout(20000),
      })
      const contentLength = Number(response.headers.get('content-length') ?? '0')
      if (contentLength > MAX_BODY_BYTES) {
        return {
          success: false,
          error: { code: 'oversize_body', message: `${url} announces ${contentLength} bytes` },
        }
      }
      return {
        success: true,
        data: {
          bytes: await response.arrayBuffer(),
          contentType: response.headers.get('content-type'),
          finalUrl: response.url,
          status: response.status,
        },
      }
    } catch (e) {
      const error = e as Error
      return {
        success: false,
        error: { code: 'network_error', message: `${error.name}: ${error.message}` },
      }
    }
  }

  const firstAttempt = await attempt()
  if (!firstAttempt.success) {
    if (firstAttempt.error.code === 'oversize_body') {
      return firstAttempt
    }
    await sleep(2000)
    return attempt()
  }
  if (firstAttempt.data.status === 429) {
    await sleep(60000)
    return attempt()
  }
  return firstAttempt
}

const NAMED_ENTITIES: Record<string, string> = {
  agrave: 'à',
  amp: '&',
  ccedil: 'ç',
  eacute: 'é',
  ecirc: 'ê',
  egrave: 'è',
  gt: '>',
  icirc: 'î',
  lt: '<',
  nbsp: ' ',
  ocirc: 'ô',
  oelig: 'œ',
  quot: '"',
  rsquo: '’',
  ucirc: 'û',
  ugrave: 'ù',
}

const decodeEntities = (text: string): string =>
  text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z]+);/gi, (match, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? match)

const htmlToText = (html: string): string => {
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, ' ')
  const withoutBlocks = withoutComments.replace(/<(script|style)[\s\S]*?<\/\1\s*>/gi, ' ')
  const withoutTags = withoutBlocks.replace(/<[^>]+>/g, ' ')
  return decodeEntities(withoutTags)
}

// The page's own claim of identity: <title> and <h1> content. Matching the
// citation here is the strong signal; body text is shared chrome and listings.
const htmlHeadline = (html: string): string => {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title\s*>/i)
  const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1\s*>/gi)]
  const rawHeadline = [titleMatch?.[1] ?? '', ...h1Matches.map((h1Match) => h1Match[1] ?? '')].join(
    ' ',
  )
  return htmlToText(rawHeadline)
}

const normalizeText = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')

const isYear = (part: string): boolean => /^(?:19|20)\d{2}$/.test(part)

// French act numbers ("2013-404", "86-1067", "2015-713 DC" → "2015-713").
// An explicit "n°" marker always wins (décrets sequence past 1900, so
// "n° 2015-1904" is a real number, not a year range); bare candidates drop
// year ranges ("2014-2019") and zero-padded date fragments ("2015-05").
const actNumberTokens = (sourceTitle: string): string[] => {
  const markedNumbers = [...sourceTitle.matchAll(/n[°o]\s*(\d{2,4}-\d{1,6})\b/gi)].map(
    (markedMatch) => markedMatch[1] ?? '',
  )
  const bareCandidates = sourceTitle.match(/\b\d{2,4}-\d{1,6}\b/g) ?? []
  const bareNumbers = bareCandidates.filter((candidate) => {
    const [leftPart, rightPart] = candidate.split('-')
    if (leftPart === undefined || rightPart === undefined) {
      return false
    }
    if (isYear(leftPart) && isYear(rightPart)) {
      return false
    }
    return !/^(?:19|20)\d{2}-0\d$/.test(candidate)
  })
  return [...new Set([...markedNumbers, ...bareNumbers])].filter((token) => token.length > 0)
}

// Boundary-checked: "2015-71" must not match inside "2015-713" or "78-1712".
const containsActNumber = (params: { normalizedText: string; token: string }): boolean =>
  new RegExp(`(?<![\\d-])${params.token}(?![\\d-])`).test(params.normalizedText)

const significantWords = (sourceTitle: string): string[] => [
  ...new Set(
    normalizeText(sourceTitle)
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 4),
  ),
]

const wordSet = (normalizedText: string): Set<string> => new Set(normalizedText.split(/[^a-z0-9]+/))

const decodeBody = (params: { bytes: ArrayBuffer; contentType: string | null }): string => {
  const { bytes, contentType } = params
  const headerCharset = contentType?.match(/charset=([\w-]+)/i)?.[1] ?? null
  // Legacy pages (AN /14/cri/…) declare their charset in a meta tag only.
  const asciiPrefix = new TextDecoder('latin1').decode(bytes.slice(0, 2048))
  const metaCharset = asciiPrefix.match(/charset=["']?([\w-]+)/i)?.[1] ?? null
  try {
    return new TextDecoder(headerCharset ?? metaCharset ?? 'utf-8').decode(bytes)
  } catch {
    return new TextDecoder().decode(bytes)
  }
}

type Verdict =
  | { kind: 'manual'; detail: string }
  | { kind: 'mismatch'; detail: string }
  | { kind: 'reachable'; detail: string }
  | { kind: 'unreachable'; detail: string }
  | { kind: 'verified'; detail: string }
  | { kind: 'walled'; detail: string }

const judgeHtml = (params: {
  bodyText: string
  headlineText: string
  sourceTitle: string
  url: string
}): Verdict => {
  const { bodyText, headlineText, sourceTitle, url } = params
  const normalizedBody = normalizeText(bodyText)
  const normalizedHeadline = normalizeText(headlineText)
  const numberTokens = actNumberTokens(sourceTitle)

  if (numberTokens.length > 0) {
    const allInHeadline = numberTokens.every((token) =>
      containsActNumber({ normalizedText: normalizedHeadline, token }),
    )
    if (allInHeadline) {
      return { kind: 'verified', detail: `matched ${numberTokens.join(', ')} in the page headline` }
    }
    const missingFromBody = numberTokens.filter(
      (token) => !containsActNumber({ normalizedText: normalizedBody, token }),
    )
    if (missingFromBody.length > 0) {
      return { kind: 'mismatch', detail: `page does not contain ${missingFromBody.join(', ')}` }
    }
    return {
      kind: 'reachable',
      detail: `${numberTokens.join(', ')} in the body only (listing pages cite many acts) — spot-check`,
    }
  }

  // Host-derived words ("Sénat" in every senat.fr title) prove the site, not
  // the document: they never count toward the match.
  const hostWords = wordSet(normalizeText(new URL(url).host))
  const titleWords = significantWords(sourceTitle).filter((word) => !hostWords.has(word))
  if (titleWords.length === 0) {
    return { kind: 'reachable', detail: 'no matchable tokens in the source title — spot-check' }
  }
  const headlineWords = wordSet(normalizedHeadline)
  const matchedInHeadline = titleWords.filter((word) => headlineWords.has(word)).length
  const strongHeadlineMatch =
    matchedInHeadline >= Math.min(2, titleWords.length) &&
    matchedInHeadline / titleWords.length >= 0.5
  if (strongHeadlineMatch) {
    return {
      kind: 'verified',
      detail: `matched ${matchedInHeadline}/${titleWords.length} title words in the page headline`,
    }
  }
  const bodyWords = wordSet(normalizedBody)
  const matchedInBody = titleWords.filter((word) => bodyWords.has(word)).length
  if (matchedInBody / titleWords.length >= 0.5) {
    return {
      kind: 'reachable',
      detail: `${matchedInBody}/${titleWords.length} title words in the body only — spot-check`,
    }
  }
  return {
    kind: 'mismatch',
    detail: `only ${matchedInBody}/${titleWords.length} title words on the page`,
  }
}

// A PDF has no headline to hold it to, and a wrong document can cite the act
// (circulaires, rapports): even a number match stays a spot-check, never VERIFIED.
const judgePdf = (params: { rawText: string; sourceTitle: string }): Verdict => {
  const { rawText, sourceTitle } = params
  const normalizedText = normalizeText(rawText)
  const numberTokens = actNumberTokens(sourceTitle)
  const allNumbersPresent =
    numberTokens.length > 0 &&
    numberTokens.every((token) => containsActNumber({ normalizedText, token }))
  if (allNumbersPresent) {
    return {
      kind: 'reachable',
      detail: `PDF fetched, ${numberTokens.join(', ')} present in its text — spot-check`,
    }
  }
  return { kind: 'reachable', detail: 'PDF fetched; content not text-verifiable — spot-check' }
}

const judgeDocument = (params: { document: FetchedDocument; sourceTitle: string }): Verdict => {
  const { document, sourceTitle } = params

  if (WALLED_STATUSES.has(document.status) || document.status === 429) {
    return { kind: 'walled', detail: `HTTP ${document.status}` }
  }
  if (document.status !== 200) {
    return { kind: 'unreachable', detail: `HTTP ${document.status}` }
  }
  if (new URL(document.finalUrl).pathname === '/') {
    return {
      kind: 'unreachable',
      detail: `redirected to site root ${document.finalUrl} (link rot)`,
    }
  }

  const isPdfBody = new TextDecoder('latin1').decode(document.bytes.slice(0, 5)) === '%PDF-'
  const claimsPdfUrl = new URL(document.finalUrl).pathname.toLowerCase().endsWith('.pdf')
  const claimsHtml = document.contentType?.includes('html') ?? false
  // Captcha walls answer 200 HTML even on PDF URLs (sante.gouv.fr pattern).
  if (claimsPdfUrl && claimsHtml && !isPdfBody) {
    return { kind: 'walled', detail: 'a .pdf URL answered HTML (captcha wall pattern)' }
  }

  if (isPdfBody) {
    return judgePdf({ rawText: new TextDecoder('latin1').decode(document.bytes), sourceTitle })
  }
  const html = decodeBody({ bytes: document.bytes, contentType: document.contentType })
  return judgeHtml({
    bodyText: htmlToText(html),
    headlineText: htmlHeadline(html),
    sourceTitle,
    url: document.finalUrl,
  })
}

type SourceCheck = {
  decisionId: string
  filePath: string
  flaggedBotWalled: boolean
  sourceTitle: string
  url: string
}

const resolveTargetFiles = (cliArguments: string[]): string[] => {
  const decisionsDirectory = join(repositoryRoot, 'data', 'decisions')

  if (cliArguments.length === 0) {
    const gitStatus = execFileSync('git', ['status', '--porcelain', '--', 'data/decisions'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
    })
    return gitStatus
      .split('\n')
      .filter((line) => line.length > 3 && !line.slice(0, 2).includes('D'))
      .map((line) => line.slice(3).trim().split(' -> ').pop() ?? '')
      .filter((path) => path.endsWith('.json'))
      .toSorted()
      .map((path) => join(repositoryRoot, path))
  }

  return cliArguments.flatMap((argument) => {
    if (/^\d{4}$/.test(argument)) {
      return readdirSync(decisionsDirectory)
        .filter((fileName) => fileName.startsWith(`${argument}-`) && fileName.endsWith('.json'))
        .toSorted()
        .map((fileName) => join(decisionsDirectory, fileName))
    }
    return [isAbsolute(argument) ? argument : join(repositoryRoot, argument)]
  })
}

const verdictSymbol = (verdict: Verdict): string => {
  switch (verdict.kind) {
    case 'manual':
      return '◌'
    case 'mismatch':
      return '✗'
    case 'reachable':
      return '~'
    case 'unreachable':
      return '✗'
    case 'verified':
      return '✓'
    case 'walled':
      return '◌'
    default:
      verdict satisfies never
      return '?'
  }
}

const runVerification = async (cliArguments: string[]): Promise<number> => {
  const targetFiles = resolveTargetFiles(cliArguments)

  if (targetFiles.length === 0) {
    console.error(
      'verify-sources: no decision files to verify (no git changes under data/decisions)',
    )
    return EXIT_CODES.no_files
  }

  const checks: SourceCheck[] = targetFiles.flatMap((filePath) => {
    const monthFile = DecisionsMonthFile.parse(JSON.parse(readFileSync(filePath, 'utf8')))
    return monthFile.decisions.flatMap((decision) =>
      decision.sources.map((source) => ({
        decisionId: decision.id,
        filePath,
        flaggedBotWalled: source.bot_walled === true,
        sourceTitle: source.title,
        url: source.url,
      })),
    )
  })

  const verdicts = new Map<SourceCheck, Verdict>()
  const pendingByHost = new Map<string, SourceCheck[]>()

  for (const check of checks) {
    if (check.flaggedBotWalled) {
      verdicts.set(check, {
        kind: 'manual',
        detail: 'flagged bot_walled in data — human verification pass',
      })
      continue
    }
    const host = new URL(check.url).host
    const hostChecks = pendingByHost.get(host) ?? []
    hostChecks.push(check)
    pendingByHost.set(host, hostChecks)
  }

  // Hosts run in parallel; within a host, sequential with a delay (politeness,
  // and bot walls rate-trigger on bursts). Identical URLs are fetched once.
  await Promise.all(
    [...pendingByHost.values()].map(async (hostChecks) => {
      const documentCache = new Map<string, Result<FetchedDocument, FetchErrorCode>>()
      for (const check of hostChecks) {
        const cachedDocument = documentCache.get(check.url)
        const fetchedDocument = cachedDocument ?? (await fetchDocument(check.url))
        if (cachedDocument === undefined) {
          documentCache.set(check.url, fetchedDocument)
          await sleep(800)
        }
        const verdict = ((): Verdict => {
          if (fetchedDocument.success) {
            return judgeDocument({ document: fetchedDocument.data, sourceTitle: check.sourceTitle })
          }
          switch (fetchedDocument.error.code) {
            case 'network_error':
              return { kind: 'unreachable', detail: fetchedDocument.error.message }
            case 'oversize_body':
              return {
                kind: 'reachable',
                detail: `${fetchedDocument.error.message} — too large to verify, spot-check`,
              }
            default:
              fetchedDocument.error.code satisfies never
              return { kind: 'unreachable', detail: fetchedDocument.error.message }
          }
        })()
        verdicts.set(check, verdict)
      }
    }),
  )

  const reportedFiles = new Set<string>()
  for (const check of checks) {
    const verdict = verdicts.get(check)
    if (verdict === undefined) {
      continue
    }
    if (!reportedFiles.has(check.filePath)) {
      reportedFiles.add(check.filePath)
      console.info(`\n${relative(repositoryRoot, check.filePath)}`)
    }
    console.info(`  ${verdictSymbol(verdict)} [${check.decisionId}] ${check.url}`)
    console.info(`      ${verdict.kind}: ${verdict.detail}`)
  }

  const countByKind = (kind: Verdict['kind']): number =>
    [...verdicts.values()].filter((verdict) => verdict.kind === kind).length

  const walledChecks = checks.filter((check) => verdicts.get(check)?.kind === 'walled')
  const manualChecks = checks.filter((check) => verdicts.get(check)?.kind === 'manual')

  console.info(
    `\nverify-sources: ${checks.length} sources — ${countByKind('verified')} verified, ` +
      `${countByKind('reachable')} reachable (spot-check), ${countByKind('walled')} walled, ` +
      `${countByKind('manual')} manual, ${countByKind('mismatch')} mismatched, ` +
      `${countByKind('unreachable')} unreachable`,
  )

  if (walledChecks.length > 0) {
    console.info('\nverify via web-fetch (bot-walled to plain HTTP):')
    for (const check of walledChecks) {
      console.info(`  [${check.decisionId}] ${check.url}`)
    }
  }
  if (manualChecks.length > 0) {
    console.info('\nawaiting the human verification pass (bot_walled in data):')
    for (const check of manualChecks) {
      console.info(`  [${check.decisionId}] ${check.url}`)
    }
  }

  if (countByKind('mismatch') > 0) {
    return EXIT_CODES.mismatch
  }
  if (countByKind('unreachable') > 0) {
    return EXIT_CODES.unreachable
  }
  return EXIT_CODES.ok
}

try {
  process.exit(await runVerification(process.argv.slice(2)))
} catch (e) {
  const error = e as Error
  console.error(`verify-sources: crashed: ${error.name}: ${error.message}`)
  process.exit(EXIT_CODES.crash)
}
