import synonymMap from './iconSynonyms.json'
import resolverConfig from './iconResolver.config.json'
import { frCompare } from '../utils/compare'

export interface FoodIconEntry {
  slug: string
  file: string
  url: string
  names: string[]
}

export interface IconResolverConfig {
  fallback: string
  stopwords: string[]
  thresholds: {
    substring: number
    token: number
    similarity: number
  }
  slugAliases: Record<string, string>
}

// `eager: true` with `?url` emits only asset URL strings (hashed file paths),
// not inlined SVG bytes, so the build-time cost is ~5 KB of string data.
const urlModules = import.meta.glob('../assets/foods/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const synonyms = synonymMap as Record<string, string[]>

const fileFromPath = (p: string): string => p.split('/').pop() ?? p

const slugFromFile = (file: string): string =>
  file
    .replace(/\.svg$/i, '')
    .replace(/-(icon|outline|line|black)$/i, '')
    .replace(/-/g, '_')

const humanizeSlug = (slug: string): string =>
  slug
    .split('_')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')

const entries: FoodIconEntry[] = []
const bySlug: Record<string, FoodIconEntry> = {}
const byFile: Record<string, FoodIconEntry> = {}

for (const [path, url] of Object.entries(urlModules)) {
  const file = fileFromPath(path)
  const slug = slugFromFile(file)
  const synList = synonyms[file] ?? []
  const names = synList.length ? [...synList] : [humanizeSlug(slug)]
  const entry: FoodIconEntry = { slug, file, url, names }
  entries.push(entry)
  bySlug[slug] = entry
  byFile[file] = entry
}

export const FOOD_ICON_LIST: readonly FoodIconEntry[] = entries
  .slice()
  .sort((a, b) => frCompare(a.names[0], b.names[0]))

export const FOOD_ICONS: Readonly<Record<string, FoodIconEntry>> = bySlug

const fallbackEntry = byFile[resolverConfig.fallback] ?? FOOD_ICON_LIST[0]

export const FALLBACK_ICON_SLUG = fallbackEntry?.slug ?? ''

export const RESOLVER_CONFIG: IconResolverConfig = {
  fallback: FALLBACK_ICON_SLUG,
  stopwords: resolverConfig.stopwords,
  thresholds: resolverConfig.thresholds,
  slugAliases: (resolverConfig as { slugAliases?: Record<string, string> }).slugAliases ?? {},
}
