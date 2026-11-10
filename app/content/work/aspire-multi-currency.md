---
title: "Multi-currency budgets and cards for a business spending app"
summary: "As the only frontend developer on the team, I built budgets and cards that work in many currencies under one shared limit."
client: "Aspire, a Singapore fintech"
role: "Senior Frontend Developer, the only frontend developer on the Cards and Budgets team"
team: "2 backend developers, 2 mobile developers, product managers and QA"
stack: [Vue 3, Quasar, Vite, Pinia, Playwright]
period: "Budgets Q3 2025, cards Q4 2025"
order: 4
featured: false
status: draft
cardMetric: "One budget, many currencies"
metrics: []
quote: null
media:
  - type: diagram
    src: DiagramMultiCurrency
    alt: "One budget with SGD and USD accounts under one shared limit, with cards attached"
---

## The problem

A budget could hold only one currency. To spend in SGD and USD on the same thing, a company had to make two budgets with the same name.

Cards are attached to budgets, so the same problem spread to cards.

## What I did

1. **Learned the old feature first.** I made sure I understood how single-currency budgets worked, then the new spec from the product manager.
2. **Listed every case I could find.** Simple screens to create and edit budgets hide many ways for money to go wrong. For example:
   - The limit is one shared limit across all currencies. A 500 USD limit covers the SGD and USD accounts together, not each one.
   - An employee asks for a card in a currency the company has no account for. The screen falls back to the default account instead of picking the wrong one.
   - Someone changes a card to a currency the budget does not support. The screen blocks it and explains why.
   - Someone removes a currency from a budget while cards still use it. The screen warns them first.
3. **Went through the list with the team.** The product manager and the designer joined. Some cases changed the spec and the design before anyone built the wrong thing.
4. **Built all the web screens:** create, edit and delete budgets and cards; employees asking for a budget or a card; finance users, admins or the budget owner approving or rejecting those requests.
5. **Wrote tests for every case on the list:** the normal path, the error path and the edge cases.

> **Hard choice:** list the cases and check them with the team before writing code. Some cases changed the spec and the design while they were still cheap to change.

## The result

A company now needs one budget per spending category, in as many currencies as it uses, under one limit. Cards work the same way, because they follow the budget they belong to.
