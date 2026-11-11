// @vitest-environment happy-dom
// Upwork mode: the rules, the head script and useUpworkMode().
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isUpworkSearch, readUpworkMode, upworkAttribute, upworkHeadScript, upworkStorageKey } from '../../app/utils/upwork'

// A session storage stand-in that keeps what is written.
function memoryStorage(start: Record<string, string> = {}) {
  const items = { ...start }
  return {
    items,
    getItem: (key: string) => items[key] ?? null,
    setItem: (key: string, value: string) => {
      items[key] = value
    },
  }
}

const blockedStorage = {
  getItem: (): string | null => {
    throw new Error('SecurityError')
  },
  setItem: () => {
    throw new Error('SecurityError')
  },
}

// Runs the head script against a stand-in page address, document and storage.
function runHeadScript(search: string, storage: { getItem: (key: string) => string | null, setItem: (key: string, value: string) => void }) {
  const attributes: Record<string, string> = {}
  const document = { documentElement: { setAttribute: (name: string, value: string) => (attributes[name] = value) } }
  new Function('location', 'document', 'sessionStorage', upworkHeadScript)({ search }, document, storage)
  return attributes
}

// The same cases for readUpworkMode() and the head script, which repeats its rules.
const cases: { name: string, search: string, saved: Record<string, string>, on: boolean }[] = [
  { name: 'off by default', search: '', saved: {}, on: false },
  { name: 'on with ?from=upwork', search: '?from=upwork', saved: {}, on: true },
  { name: 'on with other query values too', search: '?utm_source=x&from=Upwork', saved: {}, on: true },
  { name: 'off for another source', search: '?from=linkedin', saved: {}, on: false },
  { name: 'on for a later page in the visit', search: '', saved: { [upworkStorageKey]: '1' }, on: true },
  { name: 'off for a bad saved value', search: '', saved: { [upworkStorageKey]: 'true' }, on: false },
]

describe('isUpworkSearch', () => {
  it('reads ?from=upwork in any letter case, and nothing else', () => {
    expect(isUpworkSearch('?from=upwork')).toBe(true)
    expect(isUpworkSearch('from=UPWORK')).toBe(true)
    expect(isUpworkSearch('?a=1&from=upwork')).toBe(true)
    for (const search of ['', '?', '?from=', '?from=upworks', '?source=upwork', '?from']) expect(isUpworkSearch(search)).toBe(false)
  })
})

describe('readUpworkMode', () => {
  for (const { name, search, saved, on } of cases) {
    it(name, () => {
      expect(readUpworkMode(search, memoryStorage(saved))).toBe(on)
    })
  }

  it('saves the mode, so the next page of the visit keeps it', () => {
    const storage = memoryStorage()
    expect(readUpworkMode('?from=upwork', storage)).toBe(true)
    expect(storage.items).toEqual({ [upworkStorageKey]: '1' })
    expect(readUpworkMode('', storage)).toBe(true)
    expect(readUpworkMode('?from=linkedin', storage)).toBe(true)
  })

  it('works when storage is blocked or missing: only the address counts', () => {
    expect(readUpworkMode('?from=upwork', blockedStorage)).toBe(true)
    expect(readUpworkMode('', blockedStorage)).toBe(false)
    expect(readUpworkMode('?from=upwork', undefined)).toBe(true)
    expect(readUpworkMode('', undefined)).toBe(false)
  })
})

describe('upworkHeadScript', () => {
  for (const { name, search, saved, on } of cases) {
    it(name, () => {
      expect(runHeadScript(search, memoryStorage(saved))).toEqual(on ? { [upworkAttribute]: '' } : {})
    })
  }

  it('saves the mode for the next page', () => {
    const storage = memoryStorage()
    runHeadScript('?from=upwork', storage)
    expect(storage.items).toEqual({ [upworkStorageKey]: '1' })
  })

  it('does not throw when storage is blocked, and still reads the address', () => {
    expect(runHeadScript('?from=upwork', blockedStorage)).toEqual({ [upworkAttribute]: '' })
    expect(runHeadScript('', blockedStorage)).toEqual({})
  })
})

describe('useUpworkMode', () => {
  // A fresh copy of the composable for each test, as on a new page load.
  async function mountProbe() {
    const { useUpworkMode } = await import('../../app/composables/useUpworkMode')
    let mode: ReturnType<typeof useUpworkMode> | undefined
    const Probe = defineComponent({
      setup() {
        mode = useUpworkMode()
        return () => h('p', mode!.value ? 'upwork' : 'normal')
      },
    })
    const wrapper = mount(Probe)
    await nextTick()
    return { wrapper, mode: mode! }
  }

  beforeEach(() => {
    vi.resetModules()
    sessionStorage.clear()
    document.documentElement.removeAttribute(upworkAttribute)
    window.history.replaceState(null, '', '/')
  })
  afterEach(() => vi.restoreAllMocks())

  it('is off by default', async () => {
    const { wrapper, mode } = await mountProbe()
    expect(mode.value).toBe(false)
    expect(wrapper.text()).toBe('normal')
    expect(document.documentElement.hasAttribute(upworkAttribute)).toBe(false)
  })

  it('turns on with ?from=upwork after mount, and marks <html>', async () => {
    window.history.replaceState(null, '', '/?from=upwork')
    const { wrapper, mode } = await mountProbe()
    expect(mode.value).toBe(true)
    expect(wrapper.text()).toBe('upwork')
    expect(document.documentElement.hasAttribute(upworkAttribute)).toBe(true)
    expect(sessionStorage.getItem(upworkStorageKey)).toBe('1')
  })

  it('stays on for the next page of the visit', async () => {
    window.history.replaceState(null, '', '/?from=upwork')
    await mountProbe()
    // A new page load: a fresh module, a plain address, the same session.
    vi.resetModules()
    document.documentElement.removeAttribute(upworkAttribute)
    window.history.replaceState(null, '', '/work')
    const { mode } = await mountProbe()
    expect(mode.value).toBe(true)
    expect(document.documentElement.hasAttribute(upworkAttribute)).toBe(true)
  })

  it('stays on across pages in the app when storage is blocked', async () => {
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    window.history.replaceState(null, '', '/?from=upwork')
    const first = await mountProbe()
    expect(first.mode.value).toBe(true)
    // The app opens another page without a reload: the same module.
    window.history.replaceState(null, '', '/work')
    const { useUpworkMode } = await import('../../app/composables/useUpworkMode')
    const Next = defineComponent({ setup: () => {
      const mode = useUpworkMode()
      return () => h('p', mode.value ? 'upwork' : 'normal')
    } })
    const next = mount(Next)
    await nextTick()
    expect(next.text()).toBe('upwork')
  })

  it('is off when storage is blocked and the address has no ?from=upwork', async () => {
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    window.history.replaceState(null, '', '/work')
    const { mode } = await mountProbe()
    expect(mode.value).toBe(false)
  })

  it('is false before mount, as on the server', async () => {
    window.history.replaceState(null, '', '/?from=upwork')
    const { useUpworkMode } = await import('../../app/composables/useUpworkMode')
    let before: boolean | undefined
    const Probe = defineComponent({ setup: () => {
      const mode = useUpworkMode()
      before = mode.value
      return () => h('p')
    } })
    mount(Probe)
    expect(before).toBe(false)
  })
})
