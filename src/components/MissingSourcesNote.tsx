import { useLocalized } from './LanguageProvider'
import type { LocalizedText, MissingSources, MissingSourcesReason } from '../data/schema.ts'

const REASON_LABELS: Record<MissingSourcesReason, LocalizedText> = {
  link_rot: { fr: 'lien officiel expiré', en: 'official link expired' },
  never_published: {
    fr: 'acte jamais publié officiellement',
    en: 'act never officially published',
  },
  no_official_document: { fr: 'aucun document officiel', en: 'no official document' },
}

const HEADING: LocalizedText = { fr: 'Sources manquantes', en: 'Missing sources' }

// The red sourcing caveat for decisions the registry surfaces without a
// citable official document. When the cause is link rot, the heading links to
// the dead official location as proof.
export default function MissingSourcesNote({ missingSources }: { missingSources: MissingSources }) {
  const localize = useLocalized()
  const heading = `${localize(HEADING)} (${localize(REASON_LABELS[missingSources.reason])})`

  return (
    <span className="text-[var(--kicker)]">
      {missingSources.expired_url !== null ? (
        <a
          href={missingSources.expired_url}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--kicker)] decoration-[rgba(201,25,30,0.4)] hover:text-[var(--kicker)]"
        >
          {heading}
        </a>
      ) : (
        heading
      )}
      {' : '}
      {localize(missingSources.note)}
    </span>
  )
}
