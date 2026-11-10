// Zod schemas for every file in app/content/. See docs/content-model.md.
// content.config.ts uses them to define the collections, and
// lib/content-check.ts uses them to fail the build on a broken file.
import { z } from 'zod'

const text = z.string().trim().min(1)
const texts = z.array(text).min(1)
const url = z.url({ protocol: /^https$/ })
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words joined by dashes')
// An internal link such as "/services".
const route = z.string().regex(/^\/[a-z0-9/-]*$/, 'Use a path that starts with "/"')
// A month such as "2024-09".
const yearMonth = z.string().regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, 'Use YYYY-MM')

const timeZone = text.refine((zone) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone })
    return true
  }
  catch {
    return false
  }
}, 'Use an IANA time zone such as "Asia/Ho_Chi_Minh"')

const valueLabel = z.strictObject({ value: text, label: text })

// Diagrams are inline SVG components, named in `src`.
const media = z.strictObject({
  type: z.enum(['image', 'diagram']),
  src: text.optional(),
  alt: text,
  caption: text.optional(),
}).refine(item => item.type !== 'diagram' || /^Diagram[A-Z]\w*$/.test(item.src ?? ''), {
  message: 'A diagram needs `src` with a component name that starts with "Diagram"',
  path: ['src'],
})

export const profileSchema = z.strictObject({
  name: text,
  title: text,
  location: text,
  timezone: timeZone,
  utcOffset: z.number().min(-12).max(14),
  hours: z.strictObject({
    start: z.number().int().min(0).max(23),
    end: z.number().int().min(1).max(24),
    label: text,
  }).refine(hours => hours.end > hours.start, { message: '`end` must be after `start`', path: ['end'] }),
  replyPromise: text,
  languages: texts,
  openTo: texts,
  roles: texts,
  email: z.email(),
  booking: z.strictObject({ url, label: text }),
  links: z.strictObject({ linkedin: url, github: url, upwork: url }),
  hero: z.strictObject({
    label: text,
    headline: text,
    subline: text,
    paths: z.array(z.strictObject({ label: text, to: route })).min(1),
  }),
  proofStrip: z.array(valueLabel).min(1),
  about: text,
  howIWork: texts,
  aiRules: texts,
  pricing: text,
})

export const servicesSchema = z.strictObject({
  items: z.array(z.strictObject({
    id: slug,
    group: z.enum(['Frontend', 'AI', 'Lead']),
    title: text,
    summary: text,
    // Slugs of case studies in work/ that back this service.
    proof: z.array(slug).min(1),
  })).min(1),
})

export const timelineSchema = z.strictObject({
  jobs: z.array(z.strictObject({
    company: text,
    role: text,
    type: text.optional(),
    start: yearMonth,
    // null means the job is current.
    end: yearMonth.nullable(),
    location: text,
    points: texts,
  })).min(1),
  education: z.array(z.strictObject({
    school: text,
    field: text,
    start: yearMonth,
    end: yearMonth,
  })),
})

export const skillsSchema = z.strictObject({
  groups: z.array(z.strictObject({ name: text, items: texts })).min(1),
})

export const earlierSchema = z.strictObject({
  aspire: texts,
  xtel: z.array(z.strictObject({ name: text, summary: text })).min(1),
})

export const labSchema = z.strictObject({
  name: text,
  summary: text,
  status: text,
  stack: texts,
  link: url.nullable(),
  order: z.number().int().positive(),
  media,
})

// Front matter of work/*.md. The body is checked in lib/content-check.ts.
export const workSchema = z.strictObject({
  title: text,
  summary: text,
  // The current employer is always "A New Zealand e-commerce company".
  client: text,
  role: text,
  team: text.optional(),
  stack: texts,
  period: text,
  order: z.number().int().positive(),
  featured: z.boolean(),
  // draft = Son still has to check the facts. Listed in docs/open-items.md.
  status: z.enum(['ready', 'draft']),
  cardMetric: text.optional(),
  // Empty when there are no numbers.
  metrics: z.array(valueLabel),
  // null until a written quote exists.
  quote: z.strictObject({ text, role: text }).nullable(),
  media: z.array(media),
})

// The `##` headings every case study body has, in this order.
export const workSections = ['The problem', 'What I did', 'The result'] as const

// Where each collection's files live, relative to app/content/.
// A `*` stands for one file name and never crosses a folder.
export const collections = {
  profile: { type: 'data', source: 'profile.yml', schema: profileSchema },
  services: { type: 'data', source: 'services.yml', schema: servicesSchema },
  timeline: { type: 'data', source: 'timeline.yml', schema: timelineSchema },
  skills: { type: 'data', source: 'skills.yml', schema: skillsSchema },
  work: { type: 'page', source: 'work/*.md', schema: workSchema },
  lab: { type: 'data', source: 'lab/*.yml', schema: labSchema },
  earlier: { type: 'data', source: 'earlier.yml', schema: earlierSchema },
} as const

export type CollectionName = keyof typeof collections
export type Profile = z.infer<typeof profileSchema>
export type Services = z.infer<typeof servicesSchema>
export type Timeline = z.infer<typeof timelineSchema>
export type Skills = z.infer<typeof skillsSchema>
export type Earlier = z.infer<typeof earlierSchema>
export type LabProject = z.infer<typeof labSchema>
export type CaseStudyMeta = z.infer<typeof workSchema>
