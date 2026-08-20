// Category filter in the URL: ?categorie=travail,retraites (comma-separated ids).
// Decisions match when they carry ANY of the selected categories.

export const parseCategoryFilter = (filter: string | undefined): string[] => {
  if (filter === undefined || filter === '') {
    return []
  }
  return [...new Set(filter.split(',').filter((categoryId) => categoryId !== ''))]
}

const currentFilterOf = (previousSearch: object): string | undefined => {
  if ('categorie' in previousSearch && typeof previousSearch.categorie === 'string') {
    return previousSearch.categorie
  }
  return undefined
}

export const searchWithCategoryAdded = (
  previousSearch: object,
  categoryId: string,
): object & { categorie: string } => {
  const selectedIds = parseCategoryFilter(currentFilterOf(previousSearch))
  const nextIds = selectedIds.includes(categoryId) ? selectedIds : [...selectedIds, categoryId]
  return { ...previousSearch, categorie: nextIds.join(',') }
}

export const searchWithCategoryRemoved = (
  previousSearch: object,
  categoryId: string,
): object & { categorie: string | undefined } => {
  const nextIds = parseCategoryFilter(currentFilterOf(previousSearch)).filter(
    (selectedId) => selectedId !== categoryId,
  )
  return { ...previousSearch, categorie: nextIds.length > 0 ? nextIds.join(',') : undefined }
}
