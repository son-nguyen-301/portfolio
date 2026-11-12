// Search and link preview text (PF-020). Every page's meta description is
// built from content with `metaDescription()`, so none runs past what search
// results show. No imports from `shared/` (D-027), so a test can load it.

// Search results cut a description at about 160 characters.
export const maxDescription = 160

// The parts joined into one description, with whole sentences dropped from
// the end until it fits in `maxDescription` characters. The first sentence is
// always kept whole, even when it is longer: a cut sentence reads worse.
export function metaDescription(...parts: ReadonlyArray<string | undefined>): string {
  const text = parts.map(part => part?.trim()).filter(Boolean).join(' ')
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean)
  let description = sentences[0] ?? ''
  for (const sentence of sentences.slice(1)) {
    const next = `${description} ${sentence}`
    if (next.length > maxDescription) break
    description = next
  }
  return description
}

// "Side projects: hydra-claude, GitHub task runner, Looper and Homereel."
// "Side projects" is the page heading; the names come from content.
export function labDescription(names: ReadonlyArray<string>): string {
  if (names.length === 0) return 'Side projects.'
  const list = names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
  return metaDescription(`Side projects: ${list}.`)
}
