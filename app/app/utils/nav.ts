// The site's page links, in the order the header, the phone menu and the
// footer show them. Every page in docs/brief.md (Pages) is here, except home.
export interface NavLink {
  label: string
  to: string
}

const work = { label: 'Work', to: '/work' }
const services = { label: 'Services', to: '/services' }
const lab = { label: 'Lab', to: '/lab' }
const about = { label: 'About', to: '/about' }
const cv = { label: 'CV', to: '/cv' }
const contact = { label: 'Contact', to: '/contact' }

// The header on wide screens (docs/design.md, SiteHeader).
export const mainLinks: NavLink[] = [work, services, lab, about, contact]

// The phone menu and the footer also link the CV.
export const siteLinks: NavLink[] = [work, services, lab, about, cv, contact]
