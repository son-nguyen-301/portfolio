---
scope: "Product decisions for the portfolio site: name shown, audience, design direction, contact method, page set."
not: "Rules about what facts or numbers may be published (see patterns-portfolio-content.md) and low-level code style."
anchors:
  - "Design direction A, product clarity"
triggers:
  keywords:
    - "hero"
    - "design direction"
    - "contact"
    - "audience"
---

## What name does the portfolio site show?
type: qa
answer: Hai Son Nguyen
captured: 2026-11-10
status: active
freshness: 365d

**Why:** Matches GitHub, Upwork and the haisonnguyen.dev domain. The work name is not used on the site.

---

## Who should the site speak to first?
type: qa
answer: Both equally. The home page offers two clear paths: hire for a project (freelance) and hire full-time (remote roles).
captured: 2026-11-10
status: active
freshness: 180d

**Why:** Son wants the site for both Upwork clients and LinkedIn recruiters.

---

## Which design direction does the site use?
type: qa
answer: Direction A, product clarity. Light by default with dark mode, cool grey paper, ink text, one jade accent (#0D7663 / #43C2A8), amber highlight, Bricolage Grotesque headings, Inter text, JetBrains Mono numbers.
captured: 2026-11-10
status: active
freshness: 180d

**Why:** Chosen from the proposal. It looks like the calm product UI clients want to buy.

---

## How do non-Upwork visitors contact Son?
type: qa
answer: A booking link plus his email shown as text. No contact form, so no server code for contact. In Upwork mode both are hidden and replaced by "Message me on Upwork".
captured: 2026-11-10
status: active
freshness: 180d

**Why:** Simpler than a form. Upwork bans contact details on pages linked from Upwork.

---

## What are Son's working hours and contact details for the site?
type: qa
answer: Works 08:00–22:00 Hanoi time (UTC+7). Show haison143@gmail.com as text (not a form). Booking link: https://cal.com/hai-son-nguyen-xijls2/30min (a 30-minute call, so site copy says "30-minute call"). No photo for now.
captured: 2026-11-10
status: active
freshness: 180d

**Why:** Son's answers on 2026-11-10. The hours drive the time-overlap clock on the home page.

---

## What work is Son open to?
type: qa
answer: Both full-time roles and contract or freelance work, remote.
captured: 2026-11-10
status: active
freshness: 180d

**Why:** Son's answer on 2026-11-10. Matches the "both audiences equally" decision for the home page.

---

## Which side projects go on the public Lab page?
type: qa
answer: hydra-claude (link to public repo), the GitHub task runner (diagram only, no repo link), Looper, Homereel (TV and phone app screens only, never the download or indexer parts). Leave out Idea to Video, the photo editor, the private work-agent project, the trading bot and the homelab monitor.
captured: 2026-11-10
status: active
freshness: 180d

**Why:** Son's picks on 2026-11-10.

---

## Does the site show prices?
type: qa
answer: No. The site says "fixed price after a 30-minute call". Rates live on Upwork only.
captured: 2026-11-10
status: active
freshness: 180d

**Why:** Easier to raise rates later, and full-time recruiters don't anchor on a freelance rate.

---

## Where is the site hosted?
type: qa
answer: Cloudflare Workers static assets, custom domain me.haisonnguyen.dev (zone haisonnguyen.dev is on Cloudflare), deployed by Workers Builds from main. Fully static Nuxt (nuxt generate). The old AWS stack in infra/ is removed only after the Cloudflare site is live and Son agrees.
captured: 2026-11-10
status: active
freshness: 180d

**Why:** Son decided on 2026-11-10 to deploy on Cloudflare because the domain is there. This replaces the earlier AWS plan.

---
