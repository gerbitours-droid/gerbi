# Gerbi Travel — local prototype

A Hebrew, RTL travel interface based on the supplied Gerbi reference. Runs with Node.js built-in modules and browser-native HTML/CSS/JavaScript. No production dependencies, installation, database, or build step.

## Run

```sh
cd gerbi
npm run dev
```

Open http://localhost:4173. Server binds to `127.0.0.1` only. Set `PORT` in `.env` to override. Use Node.js 22+ for the documented test environment.

```sh
npm run check
npm test
```

## Implemented

- Responsive Hebrew home page with editorial destination photography, a clear search panel, Gerbi assistant and four destination cards. Shared visual styling extends to planning, comparison, saved trips and help.
- Flight/hotel/package controls; airport, destination, dates and adult/child counts.
- Device-local favorites in localStorage, with graceful handling when storage is unavailable.
- Rule-based Hebrew planner: traveler counts, dates/month, nights, total budget and editable preferences. One shared ranker applies budget constraints, explicit style choices and readable reasons across home, planner and backend.
- Up to three demo options filtered by the total budget; honest empty state when none fit.
- Editable daily itinerary and special requests, retained for the current page session.
- Volero OAuth2, live flight search and price/availability revalidation are wired. Results show supplier totals/currency, flight legs and changes, with sorting, pagination, timeouts and recoverable errors. Final booking and payment are not implemented.
- Keyboard navigation, native modal focus handling, labels, live status messages and reduced-motion support.
- Optional feature-detected WebMCP `start_trip_planning`, sharing the same planner flow.

## Local intelligence backend

The local API now has a complete first backend layer for Gerbi's recommendation loop:

- `POST /api/ai/understand` extracts Hebrew travel signals such as budget, travelers, duration, month and a detailed tag set. It returns only affordable demo ideas and asks only for facts still missing.
- `GET /api/tags` exposes the versioned tag taxonomy: holiday style, trip shape, booking constraints, special requirements and traveler context.
- `POST /api/ai/feedback` records meaningful product actions (`open_destination`, `compare`, `save`, `edit_plan`, `verify`, `dismiss`) as bounded weights for destination and tag relevance.
- `GET /api/learning/summary` exposes local aggregate learning statistics for development.

The learning store is a dependency-free JSON repository under ignored `data/learning.json`. It writes atomically and keeps bounded aggregates and event metadata. A query is learned only after explicit opt-in. It stores a one-way short hash for deduplication and token-to-tag counts, never the original query text. The current tag catalog and matching rules live in `backend/tag-catalog.mjs` and `backend/understanding.mjs`.

This is a deterministic recommendation layer, not a connected LLM. A future AI provider should consume the same normalized signal schema and use the supplier connector only for verified inventory, price and booking actions.

## Current limitations and required inputs

This is a local travel-planning application with live flight search and revalidation, not a completed booking/payment system. Destination inspiration and package itineraries are curated examples.

1. **Volero flight flow:** OAuth2 uses `https://reseller.volero.net/reseller/oauth2/token`. The server forwards flight search to `/reseller/api/flights/v1/search`; the browser can request price/availability revalidation for an offer. On 2026-10-20, a TLV–FCO return search for 2027-06-10 through 2027-06-17 (two adults) and a subsequent price check succeeded. A provider error was also exercised and shown as a recoverable error. No reservation, ticket issuance, cancellation or payment was tested. Hotel/package inventory is not connected to the corresponding controls.
2. **AI provider configuration:** No model credentials were provided. The planner is explicitly labeled as rule-based demo behavior. A production language-model integration is not implemented. Choose/provide an approved provider and configure its key on the server, then implement schema validation and tool-bound search/revalidation. Do not put a model key into browser JavaScript.
3. **Business contact and account details:** Login and customer-service buttons explain that those services are not connected. No fake account creation or message delivery is implied.

The provided Volero values reside in an ignored, mode-0600 `.env`. The HTTP server serves only `dist/`; neither `.env` nor server source is exposed. `.env.example` contains empty placeholders. Credential presence does not mean authentication succeeded.

Destination inspiration and itinerary money values are fictional examples in ILS. Live flight cards separately display supplier-returned fares in the supplier currency. Per-card values are per person; itinerary totals scale the fictional amount by all travelers and nights, using the same demonstration rate for adults and children. These calculations are **not quotes, child fares or verified prices**. Example hotels, cancellation rules, baggage allowances, transfers and activities are not verified by the flight search. An API-unavailable response never becomes a success or fallback booking.

## Files

- `dist/index.html`: semantic RTL page and icon symbols.
- `dist/style.css`, `dist/pages.css`, `dist/experience.css`: responsive base styles and the shared visual system.
- `dist/app.js`: interactions, dialogs, favorite state and demo journey.
- `dist/planner.mjs`, `dist/personalization.mjs`, `dist/journey.mjs`: preference parsing, shared ranking and validated journey state.
- `dist/flight-view.mjs`: supplier fare normalization, sorting and destination image mapping.
- `dist/pages.mjs`: planner, itinerary, comparison, saved trips and supporting pages.
- `server.mjs`: local static server, flight adapter routes and explicit unavailable booking endpoints.
- `tests/`: planner, backend, supplier-display, personalization and server exposure tests.
- `docs/product-research.md`: competitor/Dribbble research, design decisions and production personalization architecture.
- `docs/qa-2026-10-20.md`: verification evidence and limits.
- `backend/`: tag catalog, rule-based understanding, scoring and consented aggregate learning; see `backend/README.md`.
- `dist/assets/`: local graphics and travel photos; see `ASSETS.md`.

## Vercel packaging

The project directory is `gerbi/`. `server.mjs` exports an HTTP server for imported deployment runtimes; direct `node server.mjs` execution still starts the local listener.

`npm run vercel-build` copies the browser sources from `dist/` into generated `public/` assets. Vercel must serve these original browser files independently of the server bundle: shared modules such as `personalization.mjs` are also imported by the backend, whose tree shaking can remove exports used only by the browser. Do not serve those transformed server modules as browser assets. `dist/` remains the source of truth, and `public/` is ignored by Git.

The build copies only `dist/`; environment files, server source and learning data are not published as static assets. Supplier credentials must be configured separately in the deployment environment. The local file-based learning store is not durable shared storage on a serverless deployment; its production persistence remains a separate task.

Regression coverage: `tests/server-entrypoint.test.mjs` exercises the imported server, assets and API routing; `tests/static-assets.test.mjs` verifies byte-for-byte browser copies and required shared exports.

## Verification

Node tests cover parsing, negation, budget constraints, shared ranking, preference restoration, supplier fare handling, exposure protection and unavailable booking behavior. Browser QA covers responsive layouts, live flight search/revalidation, preference changes, comparison, saved itineraries, empty/error states and keyboard dialog dismissal. See the dated QA report for exact scope. This does not constitute production booking certification or a full accessibility audit.

## Full UX specification and current regression pass

- [Hebrew UX specification](docs/ux-specification-he.html): 40 sections covering 31 existing and future pages/dialogs, with goals, hierarchy, fields, actions, states, mobile behavior and acceptance criteria. Editable source: [Markdown](docs/ux-specification-he.md).
- [UX audit and implementation evidence](docs/ux-audit-2026-10-20.md): implemented fixes, remaining gaps, verification scope and changed files. The home visual design is preserved.
- Rebuild the standalone specification with `python3 scripts/render-ux-spec.py`.
- Browser regression: run `PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node tests/browser-ux.mjs` with the local server running. Playwright is an external verification tool, not a new project dependency. Supplier and learning requests are mocked in an isolated browser context. The June 2027 fixture dates must be advanced when they are no longer in the future.

This specification describes the intended product; future hotel, account, payment and booking screens are not implemented by the UX pass.
