import { describe, expect, it } from 'vitest'
import { isTheme, themeAttribute, themeHeadScript, themes, themeStorageKey } from '../../shared/theme'

// Runs the head script against a stand-in document and local storage.
function runHeadScript(storage: { getItem: (key: string) => string | null }) {
  const attributes: Record<string, string> = {}
  const setAttribute = (name: string, value: string) => {
    attributes[name] = value
  }
  const document = { documentElement: { setAttribute } }
  new Function('document', 'localStorage', themeHeadScript)(document, storage)
  return attributes
}

describe('theme', () => {
  it('knows the three choices', () => {
    expect(themes).toEqual(['light', 'dark', 'system'])
    for (const theme of themes) expect(isTheme(theme)).toBe(true)
    for (const value of ['', 'Dark', 'auto', null, undefined, 1]) expect(isTheme(value)).toBe(false)
  })

  it('puts light and dark on data-theme and nothing for system', () => {
    expect(themeAttribute('light')).toBe('light')
    expect(themeAttribute('dark')).toBe('dark')
    expect(themeAttribute('system')).toBeUndefined()
  })

  it('head script applies a saved light or dark choice', () => {
    for (const saved of ['light', 'dark']) {
      const read: string[] = []
      const getItem = (key: string) => {
        read.push(key)
        return saved
      }
      const attributes = runHeadScript({ getItem })
      expect(read).toEqual([themeStorageKey])
      expect(attributes).toEqual({ 'data-theme': saved })
    }
  })

  it('head script leaves the page alone for system, nothing saved or a bad value', () => {
    for (const saved of ['system', null, 'purple', '"dark"']) {
      expect(runHeadScript({ getItem: () => saved })).toEqual({})
    }
  })

  it('head script does not throw when storage is blocked', () => {
    const getItem = () => {
      throw new Error('SecurityError')
    }
    expect(runHeadScript({ getItem })).toEqual({})
  })
})
