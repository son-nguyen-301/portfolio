// The visitor's theme choice (light, dark or system), kept in local storage.
// The head script in nuxt.config.ts applies a saved choice before the page
// paints; this composable reads it after mount and changes it.
import { isTheme, themeAttribute, themeStorageKey } from '#shared/theme'
import type { Theme } from '#shared/theme'

function readStored(): Theme {
  try {
    const value = localStorage.getItem(themeStorageKey)
    return isTheme(value) ? value : 'system'
  }
  catch {
    return 'system'
  }
}

function apply(theme: Theme) {
  const attribute = themeAttribute(theme)
  if (attribute) document.documentElement.setAttribute('data-theme', attribute)
  else document.documentElement.removeAttribute('data-theme')
  try {
    if (theme === 'system') localStorage.removeItem(themeStorageKey)
    else localStorage.setItem(themeStorageKey, theme)
  }
  catch {
    // Storage blocked: the choice lasts until the page closes.
  }
}

export function useTheme() {
  // null until mounted: the server can't know the visitor's choice, and the
  // first client render must match the server HTML.
  const theme = useState<Theme | null>('theme', () => null)

  onMounted(() => {
    if (theme.value === null) theme.value = readStored()
  })

  function setTheme(next: Theme) {
    theme.value = next
    apply(next)
  }

  return { theme: readonly(theme), setTheme }
}
