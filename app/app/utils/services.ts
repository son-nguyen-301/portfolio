// The services page (PF-015). services.yml lists the groups in page order and
// the services with the group each belongs to. These helpers put each service
// under its group and turn its proof slugs into links to the case studies.
//
// Pure functions with no imports, so a unit test can load them by a relative
// path (D-018).

export interface Service {
  id: string
  group: string
  title: string
  summary: string
  // Slugs of case studies in app/content/work.
  proof: string[]
}

export interface ServiceGroup<Item extends Service = Service> {
  name: string
  note: string
  items: Item[]
}

// A case study as useWorkNav() reads it.
export interface StudyLink {
  path: string
  title: string
}

// The groups in the order given, each with its services in file order.
// A group with no service is left out.
export function serviceGroups<Item extends Service>(
  groups: ReadonlyArray<{ name: string, note: string }>,
  items: ReadonlyArray<Item>,
): ServiceGroup<Item>[] {
  return groups
    .map(group => ({ ...group, items: items.filter(item => item.group === group.name) }))
    .filter(group => group.items.length > 0)
}

// The case studies a service names as proof, in the order it names them.
// Throws on a slug with no case study, so `pnpm generate` stops instead of
// building a broken link. The content check (lib/content-check.ts) catches
// this first.
export function proofLinks(proof: ReadonlyArray<string>, studies: ReadonlyArray<StudyLink>): StudyLink[] {
  return proof.map((slug) => {
    const study = studies.find(item => item.path === `/work/${slug}`)
    if (!study) throw new Error(`No case study "/work/${slug}" for a service's proof`)
    return { path: study.path, title: study.title }
  })
}

// Items joined into one sentence part: "A", "A or B", "A, B, or C".
export function orList(items: ReadonlyArray<string>): string {
  if (items.length < 3) return items.join(' or ')
  return `${items.slice(0, -1).join(', ')}, or ${items.at(-1)}`
}
