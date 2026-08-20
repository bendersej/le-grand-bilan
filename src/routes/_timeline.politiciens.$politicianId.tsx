import { createFileRoute, notFound } from '@tanstack/react-router'
import Panel from '../components/Panel'
import RichText from '../components/RichText'
import { useLocalized } from '../components/LanguageProvider'
import { formatDateLabel } from '../data/format.ts'
import { politiciansById } from '../data/registry.ts'

export const Route = createFileRoute('/_timeline/politiciens/$politicianId')({
  loader: ({ params }) => {
    const politician = politiciansById.get(params.politicianId)
    if (!politician) {
      throw notFound()
    }
    return politician
  },
  component: PoliticianPage,
})

// The profile renders at the top of the timeline; the timeline below is scoped
// to this politician (decisions + public appearances) by the _timeline layout.
function PoliticianPage() {
  const politician = Route.useLoaderData()
  const localize = useLocalized()
  const profile = politician.profile

  return (
    <Panel label={politician.full_name} backLabel="Retour à la frise" bordered={false}>
      <div className="flex items-start gap-4">
        {profile ? (
          <img
            src={profile.photo.path}
            alt={politician.full_name}
            className="h-24 w-24 rounded-md object-cover"
          />
        ) : null}
        <div>
          <h1 className="display-title m-0 text-2xl font-bold sm:text-3xl">
            {politician.full_name}
          </h1>
          {politician.party ? (
            <p className="m-0 mt-1 text-[var(--sea-ink-soft)]">{politician.party}</p>
          ) : null}
          <ul className="m-0 mt-3 list-none p-0 text-sm text-[var(--sea-ink-soft)]">
            {politician.mandates.map((mandate) => (
              <li key={`${mandate.role.fr}-${mandate.from}`}>
                {localize(mandate.role)} · {formatDateLabel(mandate.from)} –{' '}
                {mandate.to ? formatDateLabel(mandate.to) : "aujourd'hui"}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {profile ? (
        <>
          <p className="mt-5 text-sm leading-6 text-[var(--sea-ink-soft)]">
            <RichText text={localize(profile.summary)} />
          </p>
          <p className="m-0 mt-2 text-xs text-[var(--sea-ink-soft)]">
            {'Texte : '}
            <a href={profile.wikipedia_url} target="_blank" rel="noreferrer">
              Wikipédia
            </a>
            {' (CC BY-SA) · Photo : '}
            <a href={profile.photo.source_url} target="_blank" rel="noreferrer">
              {profile.photo.author ?? 'Wikimedia Commons'}
            </a>
            {` (${profile.photo.license})`}
          </p>
        </>
      ) : null}
    </Panel>
  )
}
