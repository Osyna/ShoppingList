# Ma Liste de Courses

Vue 3 + Pinia + Tailwind shopping-list app backed by PocketBase, with real-time sync and French UI.

## Stack

- Vue 3 `<script setup>` + TypeScript + Vite
- Pinia (stores) + Vue Router
- Tailwind CSS
- PocketBase JS SDK (`pocketbase`)

## Dev

```bash
cp .env.example .env
npm install
npm run dev
```

## PocketBase schema

Create these collections in your PocketBase admin (`https://shplst.osyna.com/_/`).
All `user` fields are relations to the built-in `users` auth collection with cascade delete.
API rules on every non-auth collection: `@request.auth.id != "" && user = @request.auth.id`
(list, view, create, update, delete).

### `lists`
| field | type | options |
|---|---|---|
| `name` | text | required |
| `user` | relation → users | required, cascade delete |
| `rules` | json | optional — stores the per-list rules map |
| `last_reset_at` | date | optional — used by the weekly-reset rule |

### `categories`
| field | type | options |
|---|---|---|
| `name` | text | required |
| `user` | relation → users | required, cascade delete |

### `items`
| field | type | options |
|---|---|---|
| `name` | text | required |
| `quantity_value` | number | required, min 0 |
| `quantity_unit` | select | values: `count`, `kg`, `L`; required |
| `checked` | bool | default false |
| `notes` | text | optional |
| `category` | relation → categories | optional, single |
| `list` | relation → lists | required, cascade delete, single |
| `user` | relation → users | required, cascade delete |

Recommended indexes: `items.list`, `items.user`, `categories.user`, `lists.user`.

## Behavior

- Signup seeds default French categories client-side (*Fruits & Légumes, Produits laitiers, …*).
- Deleting a category nulls `category` on affected items before deletion.
- Lists, categories, and the active list's items are live via `pb.collection(...).subscribe('*')`.

## Rules engine

Each list carries a `rules` JSON map (`{ ruleId: { enabled, config } }`). Rules live in
`src/rules/definitions/*.ts` and self-register via `registerRule(...)`. Engine hooks:

- `beforeItemCreate` — throw `RuleViolationError` to block a new item
- `beforeItemUpdate` — same for edits
- `onListOpen` — for scheduled/periodic work (checked on list view mount)

To add a rule: drop a file in `src/rules/definitions/`, call `registerRule(...)`, import it from
`src/rules/definitions/index.ts`. Config fields auto-render in `RuleConfigCard.vue` via `configSchema`.

Built-ins: `unique_strict`, `unique_fuzzy` (ignores case + accents), `weekly_reset`
(uncheck / delete-checked / delete-all on a chosen day).

### Optional: PocketBase cron for weekly reset

The weekly reset runs on list open by default (no server setup needed).
For true server-side scheduling, add `pb_hooks/weekly_reset.pb.js` on your PB instance:

```js
cronAdd('weeklyReset', '0 4 * * *', () => {
  const lists = $app.findRecordsByFilter('lists', 'rules ~ "weekly_reset"', '', 500, 0)
  for (const list of lists) {
    const rules = JSON.parse(list.get('rules') || '{}')
    const cfg = rules.weekly_reset
    if (!cfg?.enabled) continue
    // reset logic mirroring src/rules/definitions/weeklyReset.ts
  }
})
```
