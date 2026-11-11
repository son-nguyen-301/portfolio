// The helpers of the case study page (app/utils/case-study.ts, PF-013).
import { describe, expect, it } from 'vitest'
import { hardChoice, isTodo, mediaHeading, mediaView, neighbours, storySections, textOf } from '../../app/utils/case-study'
import type { MediaItem, MinimarkNode } from '../../app/utils/case-study'

// The shape Nuxt Content stores: [tag, props, ...children].
const body: MinimarkNode[] = [
  ['h2', { id: 'the-problem' }, 'The problem'],
  ['p', {}, 'First problem line.'],
  ['h2', { id: 'what-i-did' }, 'What I did'],
  ['ol', {}, ['li', {}, ['strong', {}, 'Did a thing.'], ' More words.']],
  ['blockquote', {}, ['p', {}, ['strong', {}, 'Hard choice:'], ' list the cases first. Then build.']],
  ['p', {}, 'After the callout.'],
  ['h2', { id: 'the-result' }, 'The result'],
  ['ul', {}, ['li', {}, 'One result.']],
]

describe('storySections', () => {
  it('splits the body at its `##` headings, in order, with their ids', () => {
    const sections = storySections(body)
    expect(sections.map(section => [section.id, section.heading])).toEqual([
      ['the-problem', 'The problem'],
      ['what-i-did', 'What I did'],
      ['the-result', 'The result'],
    ])
    expect(sections[0]!.nodes).toEqual([['p', {}, 'First problem line.']])
    expect(sections[2]!.nodes).toEqual([['ul', {}, ['li', {}, 'One result.']]])
  })

  it('keeps every node, the ones after the callout too', () => {
    const [, did] = storySections(body)
    expect(did!.nodes).toHaveLength(3)
    expect(did!.nodes[0]).toEqual(body[3])
    expect(did!.nodes[2]).toEqual(['p', {}, 'After the callout.'])
  })

  it('keeps text before the first heading in a section with no heading', () => {
    const sections = storySections([['p', {}, 'Intro.'], ...body])
    expect(sections[0]).toEqual({ id: '', heading: '', nodes: [['p', {}, 'Intro.']] })
    expect(sections).toHaveLength(4)
  })
})

describe('hardChoice', () => {
  it('turns a "Hard choice" quote into a callout with a label', () => {
    expect(hardChoice(body[4]!)).toEqual(['div', { class: 'hard-choice' },
      ['p', { class: 'label hard-choice__label' }, 'Hard choice'],
      ['p', {}, 'List the cases first. Then build.'],
    ])
  })

  it('keeps more paragraphs of the quote, and other markup in the text', () => {
    const node: MinimarkNode = ['blockquote', {}, ['p', {}, ['strong', {}, 'Hard Choice'], ' a ', ['em', {}, 'big'], ' one.'], ['p', {}, 'Second.']]
    expect(hardChoice(node)).toEqual(['div', { class: 'hard-choice' },
      ['p', { class: 'label hard-choice__label' }, 'Hard choice'],
      ['p', {}, 'A ', ['em', {}, 'big'], ' one.'],
      ['p', {}, 'Second.'],
    ])
  })

  it('drops a colon that sits after the bold lead', () => {
    const node: MinimarkNode = ['blockquote', {}, ['p', {}, ['strong', {}, 'Hard choice'], ': ship it small.']]
    expect(hardChoice(node)).toEqual(['div', { class: 'hard-choice' },
      ['p', { class: 'label hard-choice__label' }, 'Hard choice'],
      ['p', {}, 'Ship it small.'],
    ])
  })

  it('leaves any other node as it is', () => {
    const quote: MinimarkNode = ['blockquote', {}, ['p', {}, ['strong', {}, 'Note:'], ' something.']]
    const plain: MinimarkNode = ['blockquote', {}, ['p', {}, 'No bold lead.']]
    for (const node of [quote, plain, 'text', ['p', {}, 'x'] as MinimarkNode, ['blockquote', {}] as MinimarkNode]) {
      expect(hardChoice(node)).toBe(node)
    }
  })
})

describe('textOf', () => {
  it('joins all the text inside a node', () => {
    expect(textOf(['p', {}, 'a ', ['strong', {}, 'b'], ' c'])).toBe('a b c')
    expect(textOf('plain')).toBe('plain')
  })
})

describe('media', () => {
  const none = () => false
  const all = () => true
  const image: MediaItem = { type: 'image', src: '/images/shot.png', alt: 'A screen', caption: 'The new screen' }

  it('treats a caption that starts with TODO as a note, in any case', () => {
    expect(isTodo('TODO: screenshot')).toBe(true)
    expect(isTodo('  todo later')).toBe(true)
    expect(isTodo('Todos list')).toBe(false)
    expect(isTodo('A caption with TODO in it')).toBe(false)
    expect(isTodo(undefined)).toBe(false)
  })

  it('shows an image only with a src and a caption that is not a TODO', () => {
    expect(mediaView(image, none)).toEqual({ show: 'image', caption: 'The new screen' })
    expect(mediaView({ ...image, caption: undefined }, none)).toEqual({ show: 'image', caption: undefined })
    expect(mediaView({ ...image, caption: 'TODO: blur the prices' }, none)).toEqual({ show: 'placeholder', caption: 'A screen' })
    expect(mediaView({ ...image, src: undefined }, none)).toEqual({ show: 'placeholder', caption: 'A screen' })
  })

  it('shows a diagram only when its component exists', () => {
    const diagram: MediaItem = { type: 'diagram', src: 'DiagramSample', alt: 'A flow' }
    expect(mediaView(diagram, none)).toEqual({ show: 'placeholder', caption: 'A flow' })
    expect(mediaView(diagram, name => name === 'DiagramSample')).toEqual({ show: 'diagram', caption: undefined })
    expect(mediaView({ ...diagram, caption: 'TODO: redraw' }, all)).toEqual({ show: 'placeholder', caption: 'A flow' })
  })

  it('names the media section after what it holds', () => {
    const diagram: MediaItem = { type: 'diagram', src: 'DiagramSample', alt: 'A flow' }
    expect(mediaHeading([image, image])).toBe('Screens')
    expect(mediaHeading([diagram])).toBe('Diagram')
    expect(mediaHeading([diagram, diagram])).toBe('Diagrams')
    expect(mediaHeading([image, diagram])).toBe('Screens and diagrams')
  })
})

describe('neighbours', () => {
  const list = [{ path: '/work/a' }, { path: '/work/b' }, { path: '/work/c' }]

  it('finds the case studies before and after', () => {
    expect(neighbours(list, '/work/b')).toEqual({ index: 1, previous: list[0], next: list[2] })
    expect(neighbours(list, '/work/a')).toEqual({ index: 0, previous: undefined, next: list[1] })
    expect(neighbours(list, '/work/c')).toEqual({ index: 2, previous: list[1], next: undefined })
  })

  it('gives index -1 for a path that is not in the list', () => {
    expect(neighbours(list, '/work/x')).toEqual({ index: -1 })
  })
})
