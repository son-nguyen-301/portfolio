// Is this visit in Upwork mode? (docs/brief.md, Upwork mode.)
// A read-only boolean that is false on the server and until the component
// mounts, so the first browser render matches the static HTML. Parts that must
// not be in the page at all in Upwork mode, like the email and the booking link
// (PF-008), render only when this is false after mount.
//
// The header, the phone menu and the footer don't need it: the head script
// (upworkHeadScript) marks <html> before the page paints, and the CSS classes
// `not-upwork` and `upwork-only` show the right links.
import { onMounted, readonly, ref } from 'vue'
import { readUpworkMode, upworkAttribute } from '../utils/upwork'

// One value for the whole visit. Only onMounted writes it, which never runs on
// the server, so no request or page in the build can change it there.
const upwork = ref(false)

function sessionStore(): Storage | undefined {
  try {
    return window.sessionStorage
  }
  catch {
    // Some browsers throw on the getter itself when storage is blocked.
    return undefined
  }
}

export function useUpworkMode() {
  onMounted(() => {
    // Once on, it stays on for the visit.
    if (upwork.value) return
    upwork.value = readUpworkMode(window.location.search, sessionStore())
    if (upwork.value) document.documentElement.setAttribute(upworkAttribute, '')
  })
  return readonly(upwork)
}
