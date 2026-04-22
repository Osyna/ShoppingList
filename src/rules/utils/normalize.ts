export function normalizeLoose(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

export function normalizeStrict(s: string): string {
  return s.trim().replace(/\s+/g, ' ')
}
