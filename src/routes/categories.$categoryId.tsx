import { createFileRoute, notFound } from '@tanstack/react-router'
import DecisionRow from '../components/DecisionRow'
import { categoriesById, decisionsByCategoryId } from '../data/registry.ts'

export const Route = createFileRoute('/categories/$categoryId')({
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
    <main className="page-wrap px-4 py-12">
      <p className="kicker m-0">Catégorie</p>
      <h1 className="display-title m-0 mt-2 text-3xl font-bold sm:text-4xl">{category.label.fr}</h1>

      <section className="mt-10">
        <div className="space-y-7">
          {categoryDecisions.map((decision) => (
            <DecisionRow key={decision.id} decision={decision} showDate={true} />
          ))}
        </div>
      </section>
    </main>
  )
}
