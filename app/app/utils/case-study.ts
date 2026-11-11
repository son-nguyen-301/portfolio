// The story of a case study page (PF-013). Nuxt Content stores the Markdown
// body of app/content/work/*.md as minimark: a list of nodes, where a node is
// a text string or [tag, props, ...children]. The page splits it at the `##`
// headings, so it can put the result tiles, the media and the quote between
// the sections, and it turns the "Hard choice" quote into a callout.

export type MinimarkElement = [string, Record<string, unknown>, ...MinimarkNode[]]
export type MinimarkNode = string | MinimarkElement

export interface StorySection {
  // The heading's id from the Markdown, for example "the-problem". Empty for
  // text before the first heading.
  id: string
  heading: string
  nodes: MinimarkNode[]
}

// A media item from the front matter (docs/content-model.md).
export interface MediaItem {
  type: 'image' | 'diagram'
  src?: string
  alt: string
  caption?: string
}

export function isElement(node: MinimarkNode | undefined): node is MinimarkElement {
  return Array.isArray(node)
}

// All the text inside a node.
export function textOf(node: MinimarkNode): string {
  if (!isElement(node)) return node
  const [, , ...children] = node
  return children.map(textOf).join('')
}

// The body split at its `##` headings, in order. Text before the first
// heading is kept in a section with no heading.
export function storySections(nodes: MinimarkNode[]): StorySection[] {
  const sections: StorySection[] = []
  for (const node of nodes) {
    if (isElement(node) && node[0] === 'h2') {
      sections.push({ id: String(node[1].id ?? ''), heading: textOf(node).trim(), nodes: [] })
      continue
    }
    if (!sections.length) sections.push({ id: '', heading: '', nodes: [] })
    sections.at(-1)!.nodes.push(hardChoice(node))
  }
  return sections
}

const hardChoiceLead = /^\s*(hard choice)\s*:?\s*$/i

// "> **Hard choice:** a big-bang rewrite ..." becomes a callout: a label with
// the words of the bold lead ("Hard choice"), then the rest of the quote, with
// its first letter in capitals because it now starts a sentence. Any other
// node is returned as it is. The colon may sit inside or after the bold.
export function hardChoice(node: MinimarkNode): MinimarkNode {
  if (!isElement(node) || node[0] !== 'blockquote') return node
  const [, , first, ...more] = node
  if (!isElement(first) || first[0] !== 'p') return node
  const [, paragraphProps, lead, ...rest] = first
  if (!isElement(lead) || lead[0] !== 'strong') return node
  const match = hardChoiceLead.exec(textOf(lead))
  if (!match) return node

  const [head, ...tail] = rest
  const text: MinimarkNode[] = typeof head === 'string'
    ? [capitalize(head.replace(/^\s*:?\s*/, '')), ...tail].filter(part => part !== '')
    : rest
  const label = match[1]!.charAt(0).toUpperCase() + match[1]!.slice(1).toLowerCase()
  const callout: MinimarkElement = ['div', { class: 'hard-choice' }, ['p', { class: 'label hard-choice__label' }, label]]
  if (text.length) callout.push(['p', paragraphProps, ...text])
  callout.push(...more)
  return callout
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// A caption that starts with "TODO" is a note for Son, not for visitors: the
// screenshot or diagram doesn't exist yet.
export function isTodo(text: string | undefined): boolean {
  return /^\s*todo\b/i.test(text ?? '')
}

// How a media item shows: the real image or diagram, or a neutral placeholder
// until it exists. An image needs a `src` and a caption that is not a TODO. A
// diagram needs its component (PF-014 builds them). The caption under a
// placeholder is the `alt` text, never the TODO note.
export function mediaView(item: MediaItem, hasDiagram: (name: string) => boolean): { show: 'image' | 'diagram' | 'placeholder', caption?: string } {
  const ready = item.type === 'image'
    ? Boolean(item.src) && !isTodo(item.caption)
    : Boolean(item.src && hasDiagram(item.src)) && !isTodo(item.caption)
  if (!ready) return { show: 'placeholder', caption: item.alt }
  return { show: item.type, caption: item.caption }
}

// The heading over the media: "Screens", "Diagram", or both words.
export function mediaHeading(items: MediaItem[]): string {
  const images = items.filter(item => item.type === 'image').length
  const diagrams = items.length - images
  if (!diagrams) return 'Screens'
  if (!images) return diagrams > 1 ? 'Diagrams' : 'Diagram'
  return 'Screens and diagrams'
}

// The case studies before and after this one, in `order`.
export function neighbours<T extends { path: string }>(list: T[], path: string): { index: number, previous?: T, next?: T } {
  const index = list.findIndex(item => item.path === path)
  if (index < 0) return { index }
  return { index, previous: list[index - 1], next: list[index + 1] }
}
