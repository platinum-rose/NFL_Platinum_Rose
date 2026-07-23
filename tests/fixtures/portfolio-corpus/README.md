# Portfolio Analyst Corpus

Curated offline analyst JSON scenarios for `agents/portfolio-synthesize.js`.

Run all scenarios:

```bash
npm run test:portfolio-corpus
```

Run one scenario:

```bash
node scripts/run-portfolio-corpus.js --scenario scenario-book-bills-packers
```

What this tests:

- Model JSON schema compatibility without calling OpenAI or Anthropic.
- Dossier-backed price resolution for hedge baskets and parlay ladders.
- Exacta-style Super Bowl matchup validation, including reversed team order.
- Invalid/fabricated matchup quarantine.
- Partial ladder behavior when at least one leg resolves and another leg does not.
- Scenario-book exposure math and rendered report sections.
- Supplemental outperformer coverage for Chargers, Bengals, Lions, Giants, Saints, and 49ers.

The runner writes normal ignored review artifacts under `.nfl/portfolio/` with
`corpus-...` output suffixes, then checks the generated `.raw.json` and `.md`.
