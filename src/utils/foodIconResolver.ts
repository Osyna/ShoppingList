import {
  FOOD_ICONS,
  FOOD_ICON_LIST,
  FALLBACK_ICON_SLUG,
  RESOLVER_CONFIG,
  type FoodIconEntry,
} from '../data/foodIcons'

export interface IconMatch {
  slug: string
  score: number
  entry: FoodIconEntry
}

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const STOPWORDS = new Set(RESOLVER_CONFIG.stopwords.map(normalize))

const contentTokens = (s: string): string[] =>
  normalize(s)
    .split(/[\s-]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))

const applyAlias = (slug: string): string => RESOLVER_CONFIG.slugAliases[slug] ?? slug

const entryFor = (slug: string): FoodIconEntry =>
  FOOD_ICONS[slug] ?? FOOD_ICONS[FALLBACK_ICON_SLUG] ?? FOOD_ICON_LIST[0]

const match = (slug: string, score: number): IconMatch => {
  const final = applyAlias(slug)
  return { slug: final, score, entry: entryFor(final) }
}

const FALLBACK_MATCH: IconMatch = {
  slug: FALLBACK_ICON_SLUG,
  score: 0,
  entry: entryFor(FALLBACK_ICON_SLUG),
}

interface Index {
  byName: Map<string, string>
  byToken: Map<string, Set<string>>
}

let cachedIndex: Index | null = null

function getIndex(): Index {
  if (cachedIndex) return cachedIndex
  const byName = new Map<string, string>()
  const byToken = new Map<string, Set<string>>()
  for (const entry of FOOD_ICON_LIST) {
    for (const name of entry.names) {
      const n = normalize(name)
      if (!n) continue
      if (!byName.has(n)) byName.set(n, entry.slug)
      for (const tok of contentTokens(name)) {
        let set = byToken.get(tok)
        if (!set) byToken.set(tok, (set = new Set()))
        set.add(entry.slug)
      }
    }
  }
  cachedIndex = { byName, byToken }
  return cachedIndex
}

function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1
  const max = Math.max(a.length, b.length)
  if (max === 0) return 1
  if (!a.length || !b.length) return 0
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  const curr = new Array(b.length + 1)
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j]
  }
  return 1 - prev[b.length] / max
}

const RESOLVE_CACHE_MAX = 512
const resolveCache = new Map<string, IconMatch>()

export function resolveIcon(itemName: string): IconMatch {
  const cached = resolveCache.get(itemName)
  if (cached) return cached
  const result = computeResolve(itemName)
  if (resolveCache.size >= RESOLVE_CACHE_MAX) {
    const first = resolveCache.keys().next().value
    if (first !== undefined) resolveCache.delete(first)
  }
  resolveCache.set(itemName, result)
  return result
}

function computeResolve(itemName: string): IconMatch {
  const normalized = normalize(itemName)
  if (!normalized) return FALLBACK_MATCH

  const { byName, byToken } = getIndex()
  const { substring: tSub, token: tTok, similarity: tSim } = RESOLVER_CONFIG.thresholds

  const exact = byName.get(normalized)
  if (exact) return match(exact, 1)

  let bestSub = { slug: '', score: 0 }
  for (const [canonical, slug] of byName) {
    if (canonical === normalized || canonical.length < 3) continue
    const inQuery = normalized.includes(canonical)
    const inName = canonical.includes(normalized)
    if (!inQuery && !inName) continue
    const ratio =
      Math.min(canonical.length, normalized.length) /
      Math.max(canonical.length, normalized.length)
    const score = inQuery ? 0.7 + 0.25 * ratio : 0.55 + 0.3 * ratio
    if (score > bestSub.score) bestSub = { slug, score }
  }
  if (bestSub.score >= tSub) return match(bestSub.slug, bestSub.score)

  const tokens = contentTokens(itemName)
  if (tokens.length) {
    const scores = new Map<string, number>()
    for (const tok of tokens) {
      const hits = byToken.get(tok)
      if (hits) for (const slug of hits) scores.set(slug, (scores.get(slug) ?? 0) + 1)
    }
    let bestSlug = ''
    let bestRatio = 0
    for (const [slug, score] of scores) {
      const ratio = score / tokens.length
      if (ratio > bestRatio) ((bestRatio = ratio), (bestSlug = slug))
    }
    if (bestSlug && bestRatio >= tTok) return match(bestSlug, 0.6 + bestRatio * 0.3)
  }

  let bestSim = { slug: '', score: 0 }
  for (const [canonical, slug] of byName) {
    const s = levenshteinSimilarity(normalized, canonical)
    if (s > bestSim.score) bestSim = { slug, score: s }
  }
  if (bestSim.score >= tSim) return match(bestSim.slug, bestSim.score * 0.8)

  return FALLBACK_MATCH
}

export function getIconEntry(slug: string | null | undefined): FoodIconEntry {
  return entryFor(slug ? applyAlias(slug) : FALLBACK_ICON_SLUG)
}

export function searchIcons(query: string, limit = 60): FoodIconEntry[] {
  const q = normalize(query)
  if (!q) return FOOD_ICON_LIST.slice(0, limit)
  const { byName, byToken } = getIndex()
  const scores = new Map<string, number>()
  for (const [name, slug] of byName) {
    if (!name.includes(q)) continue
    const s = q.length / name.length
    if (s > (scores.get(slug) ?? 0)) scores.set(slug, s)
  }
  for (const tok of contentTokens(query)) {
    const hits = byToken.get(tok)
    if (hits) for (const slug of hits) scores.set(slug, (scores.get(slug) ?? 0) + 0.2)
  }
  return FOOD_ICON_LIST
    .filter((e) => scores.has(e.slug))
    .sort((a, b) => (scores.get(b.slug) ?? 0) - (scores.get(a.slug) ?? 0))
    .slice(0, limit)
}
