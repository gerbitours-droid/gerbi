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
| `multi.e2e.mjs` | spec 10: multi-city (3 legs, 2–5 cap, leg calendars), open jaw, avoid-stop filter, share/refresh/saved restore; `OUT=verification/10-multi-city` |
| `fare-types.e2e.mjs` | branded fares (2026-11-23): one card per itinerary, fare-type switcher (price, check, compare follow the choice), origin at the reading start (he right / en left), search + offer-check loading animation; `W=390`, `EN=1`, `TO=ATH`; `OUT=verification/flights-2026-11-23` |
| `fare-extras.e2e.mjs` | spec 10 §7: per-passenger prices, fare inclusions, seats left, avoid-stop filter (round trip + child) |
| `decide.e2e.mjs` | decision layer: badges, reasons, memory events, partner fallback |
| `destinations.e2e.mjs` | spec 23: destinations catalog he/en at 1440/375 — "only Greece" regression, filters + URL state, show more, destination page CTAs, favorites/compare, inspiration (no supplier calls); `OUT=verification/23-destinations` |
| `account.e2e.mjs` | customer area (spec 17): sign-up + device merge, sync, enquiries, second device at 375, delete (no supplier calls) |
| `build.e2e.mjs` | spec 24 magic trip builder, he+en at 1440/375: home prompt → package, live flights/hotels cards, total legend, itinerary edits, car toggle, rebuild, share link (no supplier call), package lead, suggest mode, admin package view (`ADMIN_PASSWORD`). Server with `GERBI_SUPPLIER_FIXTURES=1` (recorded answers in `tests/fixtures/build/`); `NOKEY=1` for rules only; `LIVE=1` = one real search (1440 Hebrew); `PUBLIC=1` against a server with `HOTELS_PUBLIC_DISPLAY=1` (named hotels; default = private estimate). `OUT=verification/24-builder` |
| `booking.e2e.mjs` | spec 25 online booking, he+en at 1440/375, **no supplier calls** (search + price check from `tests/fixtures/booking/`, fake supplier on the server): wizard, Latin-name validation, full passport (issue date), every airline extra per traveller + Harel insurance, hotel in one click, saved travellers (sign up → save with consent → pick next time), admin passport masking, re-checked ₪ total, terms, mock hosted payment → PNR + tickets, supplier failure → hold released, my orders, admin orders, builder "book" entry. Server: `PORT=4193 BOOKING_MODE=mock GERBI_SUPPLIER_FIXTURES=1 LEADS_ADMIN_TOKEN=…` (or `BOOKING_MODE=request BOOKING_SUPPLIER=fake`); `ADMIN_PASSWORD`; `OUT=verification/25-booking` |
