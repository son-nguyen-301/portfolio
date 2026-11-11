// Upwork mode (docs/brief.md, Upwork mode). A visit that starts with
// ?from=upwork hides the ways to reach Son outside Upwork, on every page,
// until the tab closes. Upwork bans contact details on pages it links to.
//
// Two parts use these rules: the head script below, which marks <html> before
// the page paints, and useUpworkMode(), which gives components a boolean.

// The session storage key that keeps Upwork mode on for the rest of the visit.
export const upworkStorageKey = 'upwork'

// The attribute on <html> that the CSS classes `not-upwork` and `upwork-only`
// read (assets/css/base.css).
export const upworkAttribute = 'data-upwork'

// True when the page address has ?from=upwork.
export function isUpworkSearch(search: string): boolean {
  return new URLSearchParams(search).get('from')?.toLowerCase() === 'upwork'
}

type UpworkStorage = Pick<Storage, 'getItem' | 'setItem'>

// Is Upwork mode on for this page? ?from=upwork turns it on and saves it, so
// pages opened later in the visit keep it. Storage can be missing or blocked:
// then only the address counts.
export function readUpworkMode(search: string, storage: UpworkStorage | undefined): boolean {
  if (isUpworkSearch(search)) {
    try {
      storage?.setItem(upworkStorageKey, '1')
    }
    catch {
      // Storage blocked: Upwork mode lasts while the app stays open.
    }
    return true
  }
  try {
    return storage?.getItem(upworkStorageKey) === '1'
  }
  catch {
    return false
  }
}

// A tiny script for the page head, the same rules as readUpworkMode() written
// out by hand. It runs before the page paints, so a page opened from Upwork
// never shows the contact links, not even for a moment. It must not throw.
export const upworkHeadScript = `(function(){try{var k=${JSON.stringify(upworkStorageKey)},on=(new URLSearchParams(location.search).get("from")||"").toLowerCase()==="upwork";try{if(on)sessionStorage.setItem(k,"1");else on=sessionStorage.getItem(k)==="1"}catch(e){}if(on)document.documentElement.setAttribute(${JSON.stringify(upworkAttribute)},"")}catch(e){}})()`
