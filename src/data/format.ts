import type { IsoDate, YearMonth } from './schema.ts'

// UTC keeps labels stable regardless of the build machine's timezone.
const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', timeZone: 'UTC' })
const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
  year: 'numeric',
})

const capitalize = (label: string): string => label.charAt(0).toUpperCase() + label.slice(1)

export const formatMonthLabel = (month: YearMonth): string =>
  capitalize(monthFormatter.format(new Date(`${month}-01T00:00:00Z`)))

export const formatDateLabel = (date: IsoDate): string =>
  dateFormatter.format(new Date(`${date}T00:00:00Z`))
