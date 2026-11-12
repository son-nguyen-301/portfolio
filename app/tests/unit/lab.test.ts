import { describe, expect, it } from 'vitest'
import { labMedia, linkLabel, statusTone } from '../../app/utils/lab'

const known = (name: string) => name === 'DiagramSample'

describe('labMedia', () => {
  it('shows a placeholder for a screenshot with no file yet', () => {
    expect(labMedia({ type: 'image', alt: 'The home screen' }, known)).toEqual({ show: 'placeholder', label: 'Screenshot coming' })
  })

  it('shows a placeholder, never the note, while the alt text is a TODO', () => {
    expect(labMedia({ type: 'image', src: '/images/shot.png', alt: 'TODO: screenshot of the TV home screen' }, known))
      .toEqual({ show: 'placeholder', label: 'Screenshot coming' })
    expect(labMedia({ type: 'diagram', src: 'DiagramSample', alt: 'todo - draw it' }, known))
      .toEqual({ show: 'placeholder', label: 'Diagram coming' })
  })

  it('shows a placeholder for a diagram that is not built', () => {
    expect(labMedia({ type: 'diagram', src: 'DiagramMissing', alt: 'Issue to merge' }, known)).toEqual({ show: 'placeholder', label: 'Diagram coming' })
  })

  it('shows a ready image or diagram', () => {
    expect(labMedia({ type: 'image', src: '/images/shot.png', alt: 'The home screen' }, known)).toEqual({ show: 'image' })
    expect(labMedia({ type: 'diagram', src: 'DiagramSample', alt: 'Issue to merge' }, known)).toEqual({ show: 'diagram' })
  })

  it('shows a placeholder while the caption is a TODO', () => {
    expect(labMedia({ type: 'image', src: '/images/shot.png', alt: 'The home screen', caption: 'TODO: a newer one' }, known).show).toBe('placeholder')
  })
})

describe('statusTone', () => {
  it('is amber for a project still being built', () => {
    expect(statusTone('Design done, build in progress')).toBe('building')
    expect(statusTone('In progress')).toBe('building')
  })

  it('is jade for every other status', () => {
    for (const status of ['Live', 'Public, in use', 'Running on my own projects', 'Progressing']) {
      expect(statusTone(status), status).toBe('live')
    }
  })
})

describe('linkLabel', () => {
  it('names GitHub for a GitHub link', () => {
    expect(linkLabel('https://github.com/sample/repo')).toBe('See it on GitHub →')
    expect(linkLabel('https://www.github.com/sample/repo')).toBe('See it on GitHub →')
  })

  it('names no site for any other link', () => {
    expect(linkLabel('https://example.com/app')).toBe('See it →')
    expect(linkLabel('https://github.com.example.com/app')).toBe('See it →')
  })
})
