// @vitest-environment happy-dom
// SiteHeader (with the phone menu) and SiteFooter.
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import SiteFooter from '../../../app/components/SiteFooter.vue'
import SiteHeader from '../../../app/components/SiteHeader.vue'
import { mainLinks, siteLinks } from '../../../app/utils/nav'
import { NuxtLinkStub } from './stubs'

// ThemeSwitch reads Nuxt state, so it is swapped for a marker here. Its own
// behaviour is covered by tests/e2e/theme.spec.ts.
const ThemeSwitchStub = defineComponent({
  name: 'ThemeSwitch',
  setup: () => () => h('div', { 'data-test': 'theme-switch' }),
})
const global = { components: { NuxtLink: NuxtLinkStub, ThemeSwitch: ThemeSwitchStub } }

const headerProps = { name: 'Sample Name', hours: 'Sample hours', replyPromise: 'Sample reply promise.' }
const footerProps = {
  name: 'Sample Name',
  title: 'Sample title',
  location: 'Sample place',
  links: { linkedin: 'https://example.com/linkedin', github: 'https://example.com/github', upwork: 'https://example.com/upwork' },
  year: 2030,
}

const hrefs = (wrapper: ReturnType<typeof mount>, selector: string) =>
  wrapper.findAll(selector).map(link => link.attributes('href'))

describe('the page links', () => {
  it('cover every page in docs/brief.md, with the CV only in the menu and the footer', () => {
    expect(mainLinks.map(link => link.to)).toEqual(['/work', '/services', '/lab', '/about', '/contact'])
    expect(siteLinks.map(link => link.to)).toEqual(['/work', '/services', '/lab', '/about', '/cv', '/contact'])
  })
})

describe('SiteHeader', () => {
  // Mounted into the document, so the dialog and focus work as in a page.
  let wrapper: ReturnType<typeof mount> | undefined
  const mountHeader = () => {
    wrapper = mount(SiteHeader, { props: headerProps, global, attachTo: document.body })
    return wrapper
  }
  afterEach(() => wrapper?.unmount())

  it('shows the name with a jade dot, linked to home', () => {
    const name = mountHeader().find('.site-header__bar .site-header__name')
    expect(name.attributes('href')).toBe('/')
    expect(name.text()).toBe('Sample Name.')
    expect(name.find('.site-header__dot').attributes('aria-hidden')).toBe('true')
  })

  it('has the main links and one action button to the contact page', () => {
    const header = mountHeader()
    expect(hrefs(header, 'nav[aria-label="Main"] a')).toEqual(['/work', '/services', '/lab', '/about', '/contact'])
    const actions = header.findAll('.site-header__bar .app-button')
    expect(actions).toHaveLength(1)
    expect(actions[0]!.text()).toBe('Book a 30-minute call')
    expect(actions[0]!.attributes('href')).toBe('/contact')
  })

  it('never links an email or a booking site', () => {
    const html = mountHeader().html()
    expect(html).not.toContain('mailto:')
    expect(html).not.toContain('cal.com')
  })

  it('opens the phone menu as a modal dialog and closes it again', async () => {
    const header = mountHeader()
    const button = header.find('button[aria-label="Open menu"]')
    const dialog = header.find<HTMLDialogElement>('dialog#site-menu')
    expect(button.attributes('aria-controls')).toBe('site-menu')
    expect(button.attributes('aria-haspopup')).toBe('dialog')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(dialog.element.open).toBe(false)

    await button.trigger('click')
    expect(dialog.element.open).toBe(true)
    expect(button.attributes('aria-expanded')).toBe('true')

    await header.find('button[aria-label="Close menu"]').trigger('click')
    // The dialog fires `close` on its own, a moment after close().
    await new Promise(resolve => setTimeout(resolve))
    expect(dialog.element.open).toBe(false)
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(button.element)
  })

  it('has every page, the action, the hours and the theme switch in the phone menu', async () => {
    const header = mountHeader()
    const dialog = header.find('dialog')
    expect(dialog.find('nav').attributes('aria-label')).toBe('Pages')
    expect(hrefs(header, 'dialog nav a')).toEqual(['/work', '/services', '/lab', '/about', '/cv', '/contact'])
    expect(dialog.find('.app-button').attributes('href')).toBe('/contact')
    expect(dialog.text()).toContain('Sample hours. Sample reply promise.')
    expect(dialog.find('[data-test="theme-switch"]').exists()).toBe(true)
  })

  it('closes the phone menu when you pick a page', async () => {
    const header = mountHeader()
    await header.find('button[aria-label="Open menu"]').trigger('click')
    const dialog = header.find<HTMLDialogElement>('dialog')
    expect(dialog.element.open).toBe(true)
    await dialog.find('nav a').trigger('click')
    expect(dialog.element.open).toBe(false)
  })
})

describe('SiteFooter', () => {
  it('shows who Son is from the props, the stats placeholder and the copyright', () => {
    const footer = mount(SiteFooter, { props: footerProps, global })
    expect(footer.find('.site-footer__name').text()).toBe('Sample Name.')
    expect(footer.text()).toContain('Sample title in Sample place.')
    // The numbers are filled in after launch (PF-024), never made up.
    expect(footer.find('.site-footer__stats').text()).toBe('This site: Lighthouse TODO, TODO KB of JavaScript, built with Nuxt.')
    expect(footer.find('.site-footer__copyright').text()).toBe('© 2030 Sample Name')
  })

  it('links every page, the profiles elsewhere and has the theme switch', () => {
    const footer = mount(SiteFooter, { props: footerProps, global })
    expect(hrefs(footer, 'nav[aria-label="Footer"] a')).toEqual(['/work', '/services', '/lab', '/about', '/cv', '/contact'])
    const elsewhere = footer.findAll('.site-footer__column:not(nav) a')
    expect(elsewhere.map(link => [link.text(), link.attributes('href')])).toEqual([
      ['LinkedIn', 'https://example.com/linkedin'],
      ['GitHub', 'https://example.com/github'],
      ['Upwork', 'https://example.com/upwork'],
    ])
    expect(footer.find('[data-test="theme-switch"]').exists()).toBe(true)
  })
})
