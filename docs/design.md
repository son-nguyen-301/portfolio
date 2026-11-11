# Design: direction A, product clarity

The site should look like a well-made SaaS product: calm, clear and fast. Son's clients buy clear product screens, so the site itself is the first proof.

Avoid: dark code-editor themes, purple gradients, emoji, cards with the same shadow everywhere, everything centered.

## Screens

The full design is in `docs/design/`, one file per screen. The files are design mockups (HTML with inline styles and a small template syntax), not app code. Read them for layout, spacing, sizes and copy, then build the real page with the app's own tokens and components. The live canvas, where Son can comment, is private: https://claude.ai/artifact/3W9uiWHFKpB9dD9db4oy3y

| Screen | File | Build task |
| --- | --- | --- |
| Home, desktop | `docs/design/Main.dc.html` (dark: `HomeDark.dc.html`) | PF-011 |
| Home, phone | `docs/design/HomePhone.dc.html` | PF-011 |
| Phone menu, Upwork mode | `docs/design/MenuPhone.dc.html` | PF-006, PF-007 |
| Header and footer | `docs/design/SiteHeader.dc.html`, `SiteFooter.dc.html` | PF-006, PF-007 |
| Work list | `docs/design/Work.dc.html` | PF-012 |
| Case study | `docs/design/CaseStudy.dc.html` (phone, dark: `CaseStudyPhone.dc.html`) | PF-013, PF-014 |
| Services | `docs/design/Services.dc.html` | PF-015 |
| About | `docs/design/About.dc.html` | PF-016 |
| Lab | `docs/design/Lab.dc.html` | PF-017 |
| CV | `docs/design/CV.dc.html` | PF-018 |
| Contact | `docs/design/Contact.dc.html` | PF-019 |
| 404 | `docs/design/NotFound.dc.html` | PF-019 |
| Components and states | `docs/design/Components.dc.html` | PF-004, PF-005, PF-008, PF-010 |

Rules when a screen and the content differ: `app/content/` wins for facts and copy, this file wins for tokens and rules, and the screen wins for layout.

Two choices the screens make that the brief does not spell out:
- In Upwork mode the footer also hides the LinkedIn link (GitHub and Upwork stay), because LinkedIn is a way to contact Son off Upwork.
- The phone layout keeps two buttons fixed at the bottom: "My work" and "Book a call" ("Upwork" in Upwork mode).

## Color tokens

Light is the default. Dark mode follows the system setting, with a switch in the footer (light, dark, system). Define every color as a CSS custom property and redefine only the tokens for dark mode.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--paper` | `#F5F7F8` | `#0E1216` | Page background |
| `--surface` | `#FFFFFF` | `#151B21` | Cards, panels |
| `--ink` | `#141A22` | `#E6EBF0` | Main text, primary button |
| `--muted` | `#5A6472` | `#9AA5B1` | Secondary text, labels |
| `--line` | `#DCE1E6` | `#27303A` | Borders, dividers |
| `--jade` | `#0D7663` | `#43C2A8` | Links, action buttons, result numbers |
| `--jade-soft` | `#DCEFEA` | `#15302A` | Soft jade fills |
| `--amber` | `#A86A12` | `#E2A64C` | Highlights, "draft" and warning tags |
| `--amber-soft` | `#F6EBD9` | `#33270F` | Soft amber fills |

White text on `--jade` must pass WCAG AA in both themes. In dark mode use `--ink`-on-`--jade` or check contrast.

## Type

Load from Google Fonts with `@nuxt/fonts` (self-hosted at build time). Always give a fallback stack.

| Role | Font | Use |
| --- | --- | --- |
| Display | Bricolage Grotesque 500, 700 | Headings only |
| Body | Inter 400, 500, 600 | All running text and buttons |
| Data | JetBrains Mono 400, 600 | Numbers, labels, tags, the clock |

Scale (rem): 0.75 label · 0.875 small · 1 body · 1.15 lead · 1.5 h3 · 2 h2 · clamp(2.2, 5vw, 3.2) h1.

- Body line height 1.6. Running text max width about 68 characters.
- Headings use `text-wrap: balance`.
- Uppercase labels: mono, 0.72rem, letter-spacing 0.08em, `--muted`.
- Result numbers: mono, `--jade`, `tabular-nums`.

## Layout

- Max content width 1040px. Side gutter at least 16px.
- Sections are separated by space and a thin `--line` rule, not by boxes.
- Use grid and flex with `gap`. Rows stack to one column below 720px.
- Phone first: many visitors open the link inside the LinkedIn app.

## Components

| Component | Notes |
| --- | --- |
| `SiteHeader` | Name with a jade dot, links (Work, Services, Lab, About, Contact), one action button. In Upwork mode: no Contact link, button is "Message me on Upwork". Sticky on phones. |
| `SiteFooter` | Links, theme switch, "Built with Nuxt" stats line, copyright. |
| `AppButton` | Variants: `primary` (ink), `action` (jade), `ghost` (border). |
| `MetricTile` | Big mono number plus short label. Used in case studies and the proof strip. |
| `ProofStrip` | 4 facts in a row with dividers (2 by 2 on phones). |
| `WorkCard` | Image or diagram, one result line in mono jade, title, one-line summary, stack tags. Whole card is a link. |
| `TimeOverlap` | The clock. See below. |
| `ContactBlock` | Email with copy button, booking button, hours. Renders the Upwork version in Upwork mode. |
| `QuoteBlock` | Left jade rule, quote, role. Hidden when there is no quote yet. |
| `Timeline` | Career entries for About and CV. |
| `TagList` | Mono tags for stack items. |
| `ThemeSwitch` | Light, dark, system. Stored in local storage. |

## Home page, top to bottom

1. **Hero:** label "Senior Frontend Engineer · Vue & Nuxt · Hanoi, UTC+7". H1: "I build fast, clear web apps for fintech and e-commerce teams." One line on backend and AI. Two equal paths: "Hire me for a project" (to `/services`) and "Hire me full-time" (to `/cv`). Also "See my work".
2. **Time overlap clock** beside the hero on desktop, below it on phones.
3. **Proof strip:** "379 PRs merged on a live shop, plus 235 reviews" · "−65% UI library CSS" · "Fintech, e-commerce" · "7 agent-built PRs merged at work".
4. **Selected work:** 3 or 4 `WorkCard`s.
5. **Services:** 6 short items, grouped Frontend, Server side, AI, Lead.
6. **How I work:** short call, written plan and fixed price, weekly demo, daily written update, handover with docs. Plus AI rules: tests first, a person approves every merge, no client secrets sent to AI.
7. **What people say:** hidden until quotes exist.
8. **Contact:** `ContactBlock`.

## Case study page

Two columns on desktop: a side panel and the story. One column on phones (side panel first).

- **Side panel:** label "Case study", title, facts list (client, role, team, stack, when), action button.
- **Story:** The problem → What I did (numbered steps, one hard choice called out) → The result (`MetricTile`s, or a short list when there are no numbers) → Screens or diagram → Quote (if any) → "Need something like this?" with the contact action.
- Next and previous case study links at the bottom.

## Time overlap clock

- Shows Hanoi time now and the visitor's local time (from `Intl`), updated every 30 seconds.
- A 24-hour bar in the visitor's time: Son's hours (08:00 to 22:00 Hanoi) as a jade fill, and the visitor's 9-to-5 as an amber striped band. Son's band can wrap past midnight; draw both parts.
- One sentence: "We share N work hours each weekday: HH:MM to HH:MM your time." If there is no overlap: "Our work days don't overlap. I send a written update before your day starts, and I can take calls at HH:MM your time."
- Same time zone: "We are in the same time zone."
- On phones it shrinks to one line, as in `docs/design/HomePhone.dc.html`: the label "Shared work hours" over "N h · HH:MM to HH:MM", with Hanoi time on the right.
- Server render shows a neutral version ("Hanoi, UTC+7 · 08:00 to 22:00"), then the client fills in the visitor's details. No layout jump.

## Other UX details

- **Reply promise** near every contact action: "I reply within 12 hours."
- **Copy email** button shows "Copied" for 2 seconds.
- **Footer stats line:** "This site: Lighthouse N, N KB of JavaScript, built with Nuxt." Fill the numbers at build time or by hand after launch. Never invent them.
- **Motion:** one short fade-up on first load for the hero only. Respect `prefers-reduced-motion`. Content is visible without JavaScript.
- **Focus:** visible 2px jade outline on all interactive elements.
- **Images:** `@nuxt/image`, lazy except the hero, fixed width and height to avoid layout shift.
- **Diagrams** for work without screenshots (Aspire, Paymentwall, AI pipeline, task runner): simple inline SVG, colored from tokens, readable in both themes.

## Quality bar

- Lighthouse mobile: Performance 95+, Accessibility 100, Best Practices 100, SEO 100.
- Home page JavaScript under 100 KB gzip.
- WCAG AA contrast in both themes.
- No horizontal scroll at 360px width.
