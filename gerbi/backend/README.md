# Gerbi intelligence backend

This is the deterministic first layer behind Gerbi. It does not invent inventory, price, flight, hotel, activity, cancellation, or booking information.

## Request lifecycle

1. The browser sends a free-text Hebrew trip request to `POST /api/ai/understand`.
2. `understanding.mjs` normalizes the text and extracts typed signals: traveler composition, nights, month, total budget and canonical tag ids.
3. The scorer combines request tags with bounded aggregate tag and destination weights, then filters out examples above the stated total budget.
4. The browser can report meaningful action events to `POST /api/ai/feedback`.
5. `learning-store.mjs` atomically persists bounded aggregate weights in `data/learning.json`.

## Tag contract

`tag-catalog.mjs` owns the public vocabulary. Tags are grouped by facet:

- `travel_style`: beach, city, couple, family, relaxation, adventure
- `trip_shape`: short break, week-long, flexible dates
- `booking_constraints`: direct flight, departure time, budget sensitivity, all inclusive
- `special_requirements`: kosher, Shabbat, accessibility, water slides, family room
- `traveler_context`: solo, with children, adults only

Destination metadata maps each curated destination to canonical tags. Supplier inventory should later receive the same normalized tags only after its fields have been verified.

## API contract

### `POST /api/ai/understand`

Input:

```json
{
  "text": "זוג עם שני ילדים, שבוע באוגוסט, עד 18 אלף שקל, ים ובריכה",
  "previous": { "budget": 16000 },
  "learningConsent": true
}
```

Output contains `signals`, unanswered `missing` questions, and up to three affordable demo `recommendations`.

### `POST /api/ai/feedback`

Input has one of: `impression`, `open_destination`, `compare`, `save`, `edit_plan`, `verify`, `dismiss`; an optional valid destination id; and canonical tags. The store uses only bounded numeric increments.

### Read endpoints

- `GET /api/tags` — public taxonomy and destination mappings.
- `GET /api/learning/summary` — aggregate development view; it does not contain raw queries.
- `GET /api/status` — confirms that Volero remains disconnected until the official authentication flow is configured.

## Privacy and safety

Learning is opt-in. With consent, the store retains tokens mapped to canonical tags and a short one-way query hash for aggregate deduplication; it never stores the original sentence. All values are length-limited, tag ids are allowlisted by format, event weights are clamped, writes are atomic, and the store is ignored by Git.

An LLM can be added behind the same normalized schema later. It should return structured candidate signals only; all inventory and booking steps must remain server-side provider calls followed by current-price and availability confirmation.
