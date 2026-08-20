import { z } from 'zod'
import categoriesJson from '../../data/categories.json'
import politiciansJson from '../../data/politicians.json'
import {
  AppearancesMonthFile,
  CategoriesFile,
  DecisionsMonthFile,
  PoliticiansFile,
} from './schema.ts'
import type { Decision, DecisionRelationType, IsoDate, YearMonth } from './schema.ts'

// Build-time load of the whole registry: parsing happens at module init, so a data
// file that breaks the schema fails the build (on top of the vitest data suite).
// Trade-off: every page ships the full registry in the client bundle — fine at the
// current corpus size, revisit with route loaders/server functions once backfill
// grows the data (plans/P001).

const decisionsMonthModules = import.meta.glob('../../data/decisions/*.json', { eager: true })

const DecisionsMonthModule = z.object({ default: DecisionsMonthFile })

const decisionsMonthFiles = Object.values(decisionsMonthModules).map(
  (module) => DecisionsMonthModule.parse(module).default,
)

const appearancesMonthModules = import.meta.glob('../../data/appearances/*.json', { eager: true })

const AppearancesMonthModule = z.object({ default: AppearancesMonthFile })

const appearancesMonthFiles = Object.values(appearancesMonthModules).map(
  (module) => AppearancesMonthModule.parse(module).default,
)

const categories = CategoriesFile.parse(categoriesJson).categories
const politicians = PoliticiansFile.parse(politiciansJson).politicians
const allDecisions = decisionsMonthFiles.flatMap((monthFile) => monthFile.decisions)
const allAppearances = appearancesMonthFiles.flatMap((monthFile) => monthFile.appearances)

const categoriesById = new Map(categories.map((category) => [category.id, category]))
const politiciansById = new Map(politicians.map((politician) => [politician.id, politician]))
const decisionsById = new Map(allDecisions.map((decision) => [decision.id, decision]))

type TimelineMonth = { month: YearMonth; decisions: Decision[] }
type TimelineYear = { year: string; months: TimelineMonth[] }

const timelineYears = ((): TimelineYear[] => {
  const monthsDesc: TimelineMonth[] = decisionsMonthFiles
    .toSorted((a, b) => b.month.localeCompare(a.month))
    .map((monthFile) => ({
      month: monthFile.month,
      decisions: monthFile.decisions.toSorted((a, b) => b.date.localeCompare(a.date)),
    }))

  const monthsByYear = new Map<string, TimelineMonth[]>()
  for (const timelineMonth of monthsDesc) {
    const year = timelineMonth.month.slice(0, 4)
    const yearMonths = monthsByYear.get(year)
    if (yearMonths) {
      yearMonths.push(timelineMonth)
    } else {
      monthsByYear.set(year, [timelineMonth])
    }
  }

  return [...monthsByYear.entries()].map(([year, months]) => ({ year, months }))
})()

const groupByIds = <TItem extends { date: IsoDate }>(
  items: TItem[],
  getGroupIds: (item: TItem) => string[],
): Map<string, TItem[]> => {
  const itemsByGroupId = new Map<string, TItem[]>()
  const itemsDesc = items.toSorted((a, b) => b.date.localeCompare(a.date))
  for (const item of itemsDesc) {
    for (const groupId of getGroupIds(item)) {
      const groupItems = itemsByGroupId.get(groupId)
      if (groupItems) {
        groupItems.push(item)
      } else {
        itemsByGroupId.set(groupId, [item])
      }
    }
  }
  return itemsByGroupId
}

const appearancesByPoliticianId = groupByIds(
  allAppearances,
  (appearance) => appearance.politician_ids,
)
const decisionsByCategoryId = groupByIds(allDecisions, (decision) => decision.category_ids)
const decisionsByPoliticianId = groupByIds(allDecisions, (decision) => decision.politician_ids)

type IncomingRelation = { type: DecisionRelationType; decision: Decision }

const incomingRelationsByDecisionId = ((): Map<string, IncomingRelation[]> => {
  const incomingByDecisionId = new Map<string, IncomingRelation[]>()
  for (const decision of allDecisions) {
    for (const relation of decision.relations) {
      const incomingRelation = { type: relation.type, decision }
      const incoming = incomingByDecisionId.get(relation.decision_id)
      if (incoming) {
        incoming.push(incomingRelation)
      } else {
        incomingByDecisionId.set(relation.decision_id, [incomingRelation])
      }
    }
  }
  return incomingByDecisionId
})()

export {
  appearancesByPoliticianId,
  categoriesById,
  decisionsByCategoryId,
  decisionsById,
  decisionsByPoliticianId,
  incomingRelationsByDecisionId,
  politiciansById,
  timelineYears,
}
