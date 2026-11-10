---
title: "A CMS-driven website for a game payments product"
summary: "I built the Terminal3 website from scratch with Vue 2 and Strapi, so the content team could run it on their own. First version live in 2 months."
client: "Paymentwall, a global payments company"
role: "Frontend Developer. I built the site and its base from scratch."
team: "1 product manager, 1 backend developer, 2 frontend developers (me included)"
stack: [Vue 2, Composition API, TypeScript, Strapi CMS, Figma]
period: "2021 to 2022"
order: 6
featured: false
status: draft
cardMetric: "Live in 2 months"
metrics:
  - value: "2 months"
    label: "From zero to the first version"
quote: null
media:
  - type: diagram
    src: DiagramCmsPages
    alt: "Strapi page entry (slug, components, content) turned into Vue components on the page"
---

## The problem

Terminal3 was a paywall for games, made by Paymentwall. It needed a main website that the content team could run on their own after launch, without a developer for every change.

## What I did

1. **Designed the content model in Strapi.** Each page is a slug, a list of components, and the content for each component.
2. **Built the Vue components** that read that data and turn it into the page, from the Figma designs.
3. **Set up the code base.** The other frontend developer kept building on it.
4. **Built and tested the site, then handed the content to the content team.** After launch we shipped updates and new parts from Figma when they were needed.

## The result

- The first version went live in 2 months, built from scratch.
- The content team ran the content in production on their own.
- The site is no longer online.
