# End-to-end checks (real browser, live Volero search)

These run against a running server and make real supplier searches (no bookings). Not part of `npm test`.

```sh
npm run dev                                   # terminal 1 (port 4173)
mkdir -p verification/e2e
for f in tests/e2e/*.e2e.mjs; do PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node "$f"; done
```

`BASE_URL` points them at another server; `W=390` runs a script at phone width. Screenshots land in `verification/e2e/`.

| Script | Covers |
|---|---|
| `ui.e2e.mjs` | package 1: destination names, stale results, verified price, F01 |
| `p2.e2e.mjs` | package 2: filters, sort, kept-open details, comparison, restore after refresh |
| `p3.e2e.mjs` | package 3: saved flights, plan link, share link, destination guide, support |
| `p4.e2e.mjs` | package 4: one-way, foreign origin, swap, same-day return |
| `ai.e2e.mjs` | Gerbi AI reply chips and the hand-off to a live city search |
| `decide.e2e.mjs` | decision layer: badges, reasons, memory events, partner fallback |
