// The CV page (PF-018). Helpers that turn the content into the lines the page
// and its PDF show.
//
// Pure functions. They import by relative paths only, so a unit test can load
// them (D-018).
import { yearSpan } from './about'

// Where the built site serves the PDF. `pnpm cv:pdf` writes it to
// app/public/cv/hai-son-nguyen-cv.pdf (scripts/cv-pdf.ts). It holds the email
// (docs/brief.md), so only the CV page links to it, after mount and never in
// Upwork mode (D-033).
export const cvPdfPath = '/cv/hai-son-nguyen-cv.pdf'

// Items on one line, split by middle dots. Some items hold commas, like
// "Plugins, skills and subagents", so a comma list would be hard to read.
export function joinItems(items: ReadonlyArray<string>): string {
  return items.join(' · ')
}

// "me.haisonnguyen.dev" from "https://me.haisonnguyen.dev".
export function siteHost(url: string): string {
  return new URL(url).host
}

export interface School {
  school: string
  field: string
  start: string
  end: string
}

// "BachKhoa-Aptech, Information Technology, 2015 to 2018".
export function educationLine(school: School): string {
  return `${school.school}, ${school.field}, ${yearSpan(school)}`
}
