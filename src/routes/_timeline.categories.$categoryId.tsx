import { createFileRoute, notFound } from '@tanstack/react-router'
import DecisionRow from '../components/DecisionRow'
import Modal from '../components/Modal'
import { categoriesById, decisionsByCategoryId } from '../data/registry.ts'

export const Route = createFileRoute('/_timeline/categories/$categoryId')({
  loader: ({ params }) => {
    const category = categoriesById.get(params.categoryId)
    if (!category) {
      throw notFound()
    }
    return category
  },
  component: CategoryPage,
})

function CategoryPage() {
  const category = Route.useLoaderData()
  const categoryDecisions = decisionsByCategoryId.get(category.id) ?? []

  return (
    <Modal label={category.label.fr}>
      <p className="kicker m-0">Catégorie</p>
      <h1 className="display-title m-0 mt-2 text-2xl font-bold sm:text-3xl">{category.label.fr}</h1>

      <div className="mt-6 space-y-7">
        {categoryDecisions.map((decision) => (
          <DecisionRow key={decision.id} decision={decision} showDate={true} />
        ))}
      </div>
    </Modal>
  )
}
