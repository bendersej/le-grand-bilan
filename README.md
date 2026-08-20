# Le Grand Bilan

**Qui a fait quoi. Quand.**

Le registre ouvert des décisions politiques françaises : mois par mois, depuis mai 2012, chaque décision est datée, catégorisée, reliée aux responsables qui l'ont portée et appuyée par au moins une source officielle.

_Plus de visibilité pour les élections de mai 2027._

## Les données

Les données vivent dans [`data/`](data/) :

- [`data/decisions/`](data/decisions/) — un fichier JSON par mois (`yyyy-mm.json`)
- [`data/politicians.json`](data/politicians.json) — le registre des responsables politiques (mandats datés)
- [`data/categories.json`](data/categories.json) — le registre des catégories

Chaque fichier référence un JSON Schema ([`schemas/`](schemas/)) : votre éditeur valide et autocomplète. Le modèle complet est documenté dans [`docs/data-model.md`](docs/data-model.md).

## Contribuer

Toute contribution passe par une pull request, relue avant publication. La fusion sur `master` déploie automatiquement le site.

1. Ajoutez votre décision dans le fichier du mois concerné (voir [`docs/data-model.md`](docs/data-model.md))
2. Au moins une source officielle est obligatoire (Légifrance, Journal officiel, vie-publique.fr…) — plus il y en a, mieux c'est
3. `pnpm run test` valide le schéma et l'intégrité des références

Des points d'entrée automatisés (formulaire sur le site, serveur MCP) sont en cours de construction : [`plans/P001-le-grand-bilan-foundation.md`](plans/P001-le-grand-bilan-foundation.md).

## Développement

```bash
pnpm install
pnpm run dev     # serveur de dev (port 3000)
pnpm run check   # typecheck + lint + format + tests
pnpm run build   # build statique (prerender)
```

Stack : TanStack Start (React), Tailwind v4, Cloudflare Workers. Détails : [`docs/deployment.md`](docs/deployment.md).
