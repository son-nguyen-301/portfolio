// The theme choice: light, dark, or follow the system setting.
// Used by the ThemeSwitch component and by the head script in nuxt.config.ts.

export const themes = ['light', 'dark', 'system'] as const
export type Theme = typeof themes[number]

// The local storage key that holds the visitor's choice.
export const themeStorageKey = 'theme'

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (themes as readonly string[]).includes(value)
}

// What goes on <html data-theme>: the forced theme, or nothing for "system",
// so the CSS follows prefers-color-scheme.
export function themeAttribute(theme: Theme): 'light' | 'dark' | undefined {
  return theme === 'system' ? undefined : theme
}

// A tiny script for the page head. It runs before the page paints, so a saved
// light or dark choice shows at once with no flash of the other theme. It must
// not throw: local storage can be blocked.
export const themeHeadScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(themeStorageKey)});if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`
