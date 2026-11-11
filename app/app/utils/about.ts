// The about page (PF-016). Helpers that turn the content into the parts the
// page shows: the about text split into the headline and its paragraphs, a job
// found by its company, and a job's years.
//
// Pure functions with no imports, so a unit test can load them by a relative
// path (D-018).

export interface AboutText {
  // The first sentence, without its full stop. The page shows it as the H1.
  headline: string
  // The rest of the text, one entry per paragraph.
  paragraphs: string[]
}

// The about text from profile.yml, with paragraphs split by blank lines.
// The first sentence becomes the headline, as in docs/design/About.dc.html.
// Throws when the text has no first sentence, so `pnpm generate` stops.
export function aboutText(text: string): AboutText {
  const paragraphs = aboutParagraphs(text)
  const first = paragraphs[0] ?? ''
  const match = /^(.+?)\.(?:\s+(.*))?$/.exec(first)
  if (!match) throw new Error('The about text needs a first sentence that ends with a full stop')
  const rest = match[2]?.trim()
  return {
    headline: match[1]!,
    paragraphs: [...(rest ? [rest] : []), ...paragraphs.slice(1)],
  }
}

// The text split at blank lines, each paragraph on one line.
export function aboutParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map(part => part.replace(/\s+/g, ' ').trim()).filter(Boolean)
}

export interface Job {
  company: string
  start: string
  end: string | null
}

// The job at this company. Throws when there is none, so a page that names a
// company in a heading fails the build instead of naming a job that is gone.
export function companyJob<Item extends Job>(jobs: ReadonlyArray<Item>, company: string): Item {
  const job = jobs.find(item => item.company === company)
  if (!job) throw new Error(`No job at "${company}" in timeline.yml`)
  return job
}

// "2019 to 2021", or "2024 to now" for the current job.
export function yearSpan(job: Pick<Job, 'start' | 'end'>): string {
  return `${job.start.slice(0, 4)} to ${job.end ? job.end.slice(0, 4) : 'now'}`
}
