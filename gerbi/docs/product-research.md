# Gerbi: research, product direction and personalization

Research date: 2026-10-20. Method: desk research of five primary product/help sites, visual inspection of three Dribbble concepts, and a code audit of the current application. This is not a usability study with real customers. Competitor marketing claims are not independent performance evidence.

## Competitive findings

| Source | Observed pattern | Gerbi decision | Limit |
| --- | --- | --- | --- |
| [Google Flights help](https://support.google.com/travel/answer/2475306?hl=en) | Best/cheapest sorting, price and convenience trade-offs | Clear sort controls and consistent total/currency labels | Do not label an option cheapest across currencies or absent fares |
| [Booking Smart Filters](https://news.booking.com/bookingcom-enhances-travel-planning-with-new-ai-powered-features--for-easier-smarter-decisions/) | Natural language translated into usable filters; property questions | Editable brief beside conversation; visible recognized preferences | Never infer verified hotel amenities from destination style |
| [Mindtrip](https://mindtrip.ai/) and [FAQ](https://resources.mindtrip.ai/travelers/help/traveler-faqs) | Persistent travel style and explained choices | Explicit style controls with reasons on recommendations | Current Gerbi engine is rules-based, not a connected language model |
| [Skyscanner](https://help.skyscanner.net/hc/en-gb/articles/201150942-How-do-I-find-the-best-prices) | Everywhere/whole-month discovery; estimated fares clearly distinguished | Separate destination inspiration from live flight inventory | Flexible-date pricing requires additional provider requests; do not fake a calendar |
| [Wanderlog](https://wanderlog.com/plan-a-trip) | Daily itinerary, maps, budget and reservations in one place | Preserve editable itinerary, saved trip and comparison flows | No fake map or invented travel times; no live reservations claimed |

## Visual research (opened and visually inspected)

- [Planora / Ali Husni](https://dribbble.com/shots/26307580-AI-Travel-Planner-App-Planora): restrained neutral surfaces, image strips, conversation near trip cards. Adopt generous spacing and short starter prompts; avoid putting all work into an empty chat box.
- [Trip rundown / Keitoto](https://dribbble.com/shots/26467848-Travel-Planner-Mobile-App-Trip-Rundown-Booking-Flow): compact timeline and separate flight summary. Adopt scan-friendly itinerary/details; no boarding-pass styling for unbooked inventory.
- [Trip itinerary / Nixtio](https://dribbble.com/shots/27709125-Travel-Planner-Trip-Itinerary-Mobile-App-UI-Design): destination photography and blue/yellow accents. Retain Gerbi navy/yellow identity, use photos as context, reduce competing decoration.

These are design concepts, not evidence of conversion or usability. No third-party artwork is copied. Existing Gerbi assets are reused.

## Existing flow audit

1. Preference chips used incompatible boolean keys and were overwritten by journey restoration. They did not affect ranking despite the UI promise.
2. All live cards showed Rome regardless of destination; supplier prices were read from the wrong object; offer IDs replaced useful flight information.
3. Availability presented raw JSON including operational tokens instead of a readable summary.
4. Search feedback appeared below the cards; old inventory remained visible on errors/empty results. Duplicate searches were possible.
5. Home preference onboarding preceded the main headline/search. Multiple equally loud panels obscured the main action.
6. Two independent ranking implementations diverged. Server recommendations were fetched but not used on the results page.
7. Claims about provider status and privacy were stale. Generic trip packages remain illustrative; flights have separate live endpoints.
8. Ten existing tests do not constitute complete QA of the booking journey. No real booking/payment has been validated.

## User journeys and acceptance criteria

Known destination: enter route/date/party -> loading visible beside form -> live offers -> sort -> price check -> readable status. Preserve search input on failure; prevent duplicate submit; no previous offers masquerading as new results.

Undecided: optional styles -> immediate reordered inspiration with explanations -> planner with carried preferences -> editable brief -> three eligible options -> compare/edit/save itinerary. Explicit input must override earlier choices. Empty sets explain the budget constraint.

Returning: restore only validated local fields; show selected styles; reset styles without deleting saved trips. Never claim a server account or cross-device sync.

Responsive: 390, 768 and 1440px; RTL text with LTR airport/currency islands; 44px controls; visible keyboard focus; dialogs with accessible names; inline live status; reduced-motion support. Check home, destinations, planner, results, comparison, trip, saved, help and error routes.

## Personalization architecture

Now: deterministic candidate ranking over four curated examples, with shared vocabulary and reason codes. Explicit style matches contribute 5 each; family composition 2; prefer matching candidates, then lower illustrative total, then stable ID. Hard budget filter runs before ranking. No percentage match claims. Unknown amenities remain unknown, not positives. Live flights are kept out of illustrative package ranking.

Next production architecture:

1. LLM extracts a schema-validated brief: value, source (user/form/inferred), confidence, timestamp. Dates, currency, passengers and budget scope are required before searching. Ask the highest-value missing question; explicit corrections replace earlier intent.
2. Supplier adapters retrieve real candidates with currency, timestamp and provenance. LLM must not create price/availability fields. Cache search references with expiry and never persist them in a profile.
3. Hard filters: travel dates, party, max budget in a common currency, required stops and confirmed accessibility/amenities. Unknown hard requirements are excluded or explicitly pending verification.
4. Rank eligible candidates by explicit preference fit, total trip cost, travel burden and verified quality. Proposed starting weights 0.40/0.30/0.20/0.10 are hypotheses requiring offline and user validation. Normalize within comparable candidate sets. Diversify top 3 without violating constraints.
5. Generate explanations only from matched features and recorded trade-offs; show data gaps and permit edits. LLM describes the ranked evidence, not a fabricated match score.
6. Revalidate price/availability before booking; handle changes, expiry and provider failure distinctly. Payment and booking must be idempotent and recoverable; these are separate integration work.
7. Only consented behavior should update preference learning. Use bounded, decaying signals; explicit preferences dominate clicks and global popularity. Do not call aggregate popularity a personal model. No new telemetry is added in this pass.

Evaluation: zero hard-constraint violations; grounded-price rate; correction retention; recommendation diversity; explanation faithfulness; search failure recovery; time to first useful option. Offline Hebrew cases include negation, changed budget, children, missing dates, no matches and unknown services. Later usability study: 5-8 travelers, known destination and undecided tasks, record friction only with consent.

## Scope and limits

Implement the visual system, genuine local preference ranking/explanations, clearer planner, live search display and error/revalidation UX now. Existing local architecture is retained without new production dependencies, paid LLM calls, schema migrations or production deployment. Hotels, packages, payments and final reservation are not validated by successful flight searches. A language-model integration needs a provider, key, data policy, latency/cost budget and evaluation before it can be called production AI.
