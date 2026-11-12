// Helpers for the CV page (PF-018).
import { describe, expect, it } from 'vitest'
import { cvPdfPath, educationLine, joinItems, siteHost } from '../../app/utils/cv'

describe('joinItems', () => {
  it('joins items with middle dots, so items with commas stay readable', () => {
    expect(joinItems(['Claude Code', 'Plugins, skills and subagents', 'MCP'])).toBe('Claude Code · Plugins, skills and subagents · MCP')
  })

  it('gives one item as it is, and nothing for none', () => {
    expect(joinItems(['Vue 3'])).toBe('Vue 3')
    expect(joinItems([])).toBe('')
  })
})

describe('siteHost', () => {
  it('gives the host of the site URL', () => {
    expect(siteHost('https://me.haisonnguyen.dev')).toBe('me.haisonnguyen.dev')
    expect(siteHost('https://me.haisonnguyen.dev/')).toBe('me.haisonnguyen.dev')
  })
})

describe('educationLine', () => {
  it('gives the school, the field and the years', () => {
    expect(educationLine({ school: 'BachKhoa-Aptech', field: 'Information Technology', start: '2015-09', end: '2018-09' }))
      .toBe('BachKhoa-Aptech, Information Technology, 2015 to 2018')
  })
})

describe('cvPdfPath', () => {
  it('is the file `pnpm cv:pdf` writes into public/', () => {
    expect(cvPdfPath).toBe('/cv/hai-son-nguyen-cv.pdf')
  })
})
