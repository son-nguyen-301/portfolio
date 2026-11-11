import { expect, test } from '@playwright/test'
import type { Browser, Page } from '@playwright/test'

// The time overlap clock on the home page (docs/design.md, Time overlap
// clock). The date is pinned: shared hours change with daylight saving, so the
// main cases use a winter day. 2026-01-14 12:00:40 UTC is a Wednesday.
const winter = new Date('2026-01-14T12:00:40Z')
const summer = new Date('2026-07-15T12:00:40Z')

const desktop = { width: 1280, height: 800 }
const phone = { width: 360, height: 740 }

async function openClock(page: Page, time: Date) {
  await page.clock.install({ time })
  await page.goto('/')
  const clock = page.getByRole('complementary', { name: 'Shared working hours' })
  await expect(clock).toHaveAttribute('data-state', 'ready')
  return clock
}

const sentence = (page: Page) => page.locator('.time-overlap__sentence > p:not([aria-hidden])')

test.describe('London', () => {
  test.use({ timezoneId: 'Europe/London', viewport: desktop })

  test('shows 6 shared hours, both clocks and the visitor\'s 9 to 5', async ({ page }) => {
    const clock = await openClock(page, winter)
    await expect(sentence(page)).toHaveText('We share 6 work hours each weekday: 09:00 to 15:00 your time.')
    await expect(clock).toContainText('Hanoi now')
    await expect(clock.locator('.time-overlap__clock').first()).toContainText('19:00')
    await expect(clock).toContainText('Your time · London')
    await expect(clock.locator('.time-overlap__clock--you')).toContainText('12:00')
    await expect(clock).toContainText('My hours, 08:00 to 22:00 Hanoi')
    await expect(clock).toContainText('Your 9 to 5')
    // Son's hours in London time are 01:00 to 15:00: one jade part.
    await expect(clock.locator('.time-overlap__son')).toHaveCount(1)
    await expect(clock.locator('.time-overlap__you')).toHaveCount(1)
    await expect(clock.locator('.time-overlap__now')).toHaveCount(1)
  })

  test('updates the clocks every 30 seconds', async ({ page }) => {
    const clock = await openClock(page, winter)
    const you = clock.locator('.time-overlap__clock--you .time-overlap__time')
    await expect(you).toHaveText('12:00')
    await page.clock.runFor(30_000)
    await expect(you).toHaveText('12:01')
    await expect(clock.locator('.time-overlap__clock').first().locator('.time-overlap__time')).toHaveText('19:01')
  })
})

test.describe('New York', () => {
  test.use({ timezoneId: 'America/New_York', viewport: desktop })

  test('shows 1 shared hour in winter', async ({ page }) => {
    await openClock(page, winter)
    await expect(sentence(page)).toHaveText('We share 1 work hour each weekday: 09:00 to 10:00 your time.')
  })

  test('shows 2 shared hours in summer, with daylight saving', async ({ page }) => {
    await openClock(page, summer)
    await expect(sentence(page)).toHaveText('We share 2 work hours each weekday: 09:00 to 11:00 your time.')
  })
})

test.describe('Los Angeles', () => {
  test.use({ timezoneId: 'America/Los_Angeles', viewport: desktop })

  test('shows the no-overlap sentence and both parts of Son\'s hours', async ({ page }) => {
    const clock = await openClock(page, winter)
    await expect(sentence(page)).toHaveText('Our work days don\'t overlap. I send a written update before your day starts, and I can take calls at 06:00 your time.')
    // Son's hours in Los Angeles time are 17:00 to 07:00: they cross midnight.
    await expect(clock.locator('.time-overlap__son')).toHaveCount(2)
  })
})

test.describe('Hanoi', () => {
  test.use({ timezoneId: 'Asia/Ho_Chi_Minh', viewport: desktop })

  test('says we are in the same time zone', async ({ page }) => {
    await openClock(page, winter)
    await expect(sentence(page)).toHaveText('We are in the same time zone.')
  })
})

test.describe('on a phone', () => {
  test.use({ timezoneId: 'Europe/London', viewport: phone })

  test('shrinks to one line with no sideways scroll', async ({ page }) => {
    const clock = await openClock(page, winter)
    await expect(clock.locator('.time-overlap__full')).toBeHidden()
    const line = clock.locator('.time-overlap__line')
    await expect(line).toBeVisible()
    await expect(line).toContainText('Shared work hours')
    await expect(line).toContainText('6 h · 09:00 to 15:00')
    await expect(line.locator('.time-overlap__line-clock')).toHaveText('Hanoi19:00')
    const box = await line.locator('.time-overlap__line-main').boundingBox()
    expect(box?.height).toBeLessThan(50)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(phone.width)
  })
})

test.describe('with JavaScript off', () => {
  test.use({ javaScriptEnabled: false, viewport: desktop })

  test('shows the neutral version', async ({ page }) => {
    await page.goto('/')
    const clock = page.getByRole('complementary', { name: 'Shared working hours' })
    await expect(clock).toHaveAttribute('data-state', 'neutral')
    await expect(sentence(page)).toHaveText('Hanoi, UTC+7 · 08:00 to 22:00')
    await expect(clock.locator('.time-overlap__you')).toHaveCount(0)
    await expect(clock.locator('.time-overlap__now')).toHaveCount(0)
  })
})

// The box of the clock and of the heading above it, once fonts are in.
async function measure(page: Page) {
  await page.evaluate(() => document.fonts.ready)
  const clock = await page.getByRole('complementary', { name: 'Shared working hours' }).boundingBox()
  const heading = await page.getByRole('heading', { level: 1 }).boundingBox()
  return { clock, heading }
}

async function serverBox(browser: Browser, timezoneId: string, viewport: { width: number, height: number }) {
  const context = await browser.newContext({ javaScriptEnabled: false, timezoneId, viewport })
  const page = await context.newPage()
  await page.goto('/')
  const box = await measure(page)
  await context.close()
  return box
}

test.describe('no layout shift when the clock fills in', () => {
  const zones = ['Europe/London', 'America/Los_Angeles', 'Asia/Ho_Chi_Minh']
  const sizes = [{ name: 'desktop', viewport: desktop }, { name: 'phone', viewport: phone }, { name: 'narrow desktop', viewport: { width: 720, height: 800 } }]

  for (const zone of zones) {
    for (const size of sizes) {
      test(`${zone}, ${size.name}`, async ({ browser }) => {
        const before = await serverBox(browser, zone, size.viewport)
        const context = await browser.newContext({ timezoneId: zone, viewport: size.viewport })
        const page = await context.newPage()
        await openClock(page, winter)
        const after = await measure(page)
        await context.close()
        expect(after.clock).not.toBeNull()
        expect(after.clock).toEqual(before.clock)
        expect(after.heading).toEqual(before.heading)
      })
    }
  }
})
