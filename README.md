# API Spec Browser

A web app to browse OpenAPI spec docs. Load local or remote OpenAPI specification files to view endpoints, schemas, models, and data structures in a clean, navigable interface.

## Features

- **Load specs from URL** — Enter the URL of any OpenAPI 3.x JSON or YAML file
- **Open local files** — Upload `.json`, `.yaml`, or `.yml` spec files from your machine
- **Navigation sidebar** — Collapsible sections for endpoints and schemas with search filtering
- **Endpoint viewer** — Parameters, request bodies, and responses displayed with method badges
- **Schema viewer** — Property tables with types, descriptions, constraints, and enum values
- **$ref resolution** — Inline resolution of JSON `$ref` references within the spec

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run preview` | Preview production build |

## Tech Stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for build tooling
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) for tests
