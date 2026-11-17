// Task registry for the AI gateway (spec 22 §4): one entry per model-backed feature. System prompts are stable
// (no dates, no ids) so the prefix is cacheable. Schemas carry length/range limits that the gateway enforces
// locally (providers receive them stripped). Semantic checks (grounding) live with the caller in ai-features.mjs.
import { places } from '../dist/places.mjs';
import { BUDGETS, FLEXIBILITY, STYLES } from '../dist/leads-validate.mjs';
import { destinations } from '../dist/catalog.mjs';

// The trip builder's vocabulary (17.11.2026): the model reads meaning and answers only in catalog ids and catalog tags.
export const TRIP_IDS = destinations.map((d) => d.id), TRIP_TAGS = [...new Set(destinations.flatMap((d) => d.tags))];
export const TRIP_COUNTRIES = [...new Set(destinations.map((d) => d.country.en))];
export const TRIP_REGIONS = ['europe', 'asia', 'africa', 'americas', 'latin-america', 'south-america', 'middle-east', 'oceania', 'israel'];

const codes = places.filter((p) => !p.home).map((p) => p.code);
const allCodes = places.map((p) => p.code);
const TRI = { type: 'string', enum: ['yes', 'no', 'unknown'] };
const str = (maxLength) => ({ type: 'string', maxLength });
const list = (items, maxItems) => ({ type: 'array', items, maxItems });
const obj = (properties) => ({ type: 'object', additionalProperties: false, required: Object.keys(properties), properties });
const MONTHS = ['', 'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const HEBREW = 'Write all text values in natural, warm, concise Israeli Hebrew (gender-neutral plural "אתם"). ';

export const INTENTS = ['ready_to_book', 'planning', 'price_check', 'question', 'complaint', 'support_existing', 'unclear'];

export const TASKS = {
  // ---- customer ----
  understand: {
    label: 'מתכנן: השלמת הבנת בקשה', audience: 'customer', tier: 'smart', maxTokens: 900, timeoutMs: 9000, cacheTtl: 30 * 86400, dailyCalls: 800, version: 2,
    system: `You help Gerbi, a Hebrew travel planner, understand a traveler's free-text request that its rule engine could not fully parse.
Return only what the text states or clearly implies. Never invent dates, prices or traveler counts: use 0 or "" when not stated.
Destination codes must come from this list: ${places.filter((p) => !p.home).map((p) => `${p.code}=${p.names[0]}`).join(', ')}.
"want" holds only destinations the traveler named. "suggest" holds up to 3 codes from the list that fit wishes the traveler described without naming a place (nature, wine, markets...), best first.
"interests" are short Hebrew words for wishes the list of styles cannot express. "question" is one short Hebrew question that would most help, or "".
"legs" is used only when the traveler clearly describes a route with several flights (e.g. Tel Aviv to Rome, then Paris, then home) AND gives a date for each flight: one item per flight with airport/city codes (TLV for Tel Aviv) and an ISO date (YYYY-MM-DD) after "today" from the input. Otherwise [].`,
    schema: obj({ want: list({ type: 'string', enum: codes }, 8), exclude: list({ type: 'string', enum: codes }, 8), suggest: list({ type: 'string', enum: codes }, 5),
      adults: { type: 'integer' }, children: { type: 'integer' }, nights: { type: 'integer' }, month: { type: 'string', enum: MONTHS },
      beach: TRI, city: TRI, relaxation: TRI, family: TRI, couple: TRI, interests: list(str(40), 8), question: str(200),
      legs: list(obj({ from: { type: 'string', enum: allCodes }, to: { type: 'string', enum: allCodes }, date: str(10) }), 5) })
  },
  trip_tags: {
    label: 'בונה חופשות: הבנת הבקשה לתגיות', audience: 'customer', tier: 'fast', maxTokens: 900, timeoutMs: 7000, cacheTtl: 30 * 86400, dailyCalls: 3000, version: 1,
    system: `You read one free-text holiday request written to Gerbi, an Israeli travel agency (flights from Tel Aviv), usually in Hebrew, and turn its MEANING into structured fields.
Answer only with catalog ids and catalog tags. Never invent: a field the text does not state or clearly imply is 0, "", [] or "unknown". "today" is in the input.
Travellers: "adults" includes the writer when they travel ("זוג"=2, "אני ואמא שלי"=2, "2+3" = 2 adults + 3 children, "משפחה של 5 (2+3)"); grown children 18+ are adults; "children" are 2–17 (count), "childAges" their ages when stated; "infants" are under 2 (a baby, "בן שנה", "8 months").
Length: "nights" (Hebrew convention: "X ימים" = X-1 nights, "שבוע"=7, "סופ\"ש"=3, "סופ\"ש ארוך"=4, "שבועיים"=14, "חודש"=30). "nightsPerPlace" only when a length is said for each named place, in order ("שבוע בוייטנאם ואז שבוע בפוקט" = [7,7]).
When: "month" 1–12 when a month, season or holiday is stated (Passover→4, Hanukkah→12, Sukkot→10, "החופש הגדול"→7). "start"/"end" ISO dates only for explicit dates, the next future occurrence after today.
Budget: "budgetIls" = the total cap in shekels for everyone (per person × travellers; $×3.65, €×3.95), else 0. "budgetLevel": low (cheap, students, backpacking, limited budget), high (luxury, pampering, "money is no object"), else unknown.
Places: "destinations" = catalog ids the traveller NAMED (cities, regions, aliases such as Manhattan→new-york, Amalfi→amalfi-naples, Scotland→edinburgh, Tuscany→florence-tuscany), in the order said. "countries" = countries named without a city (exact English names from the list). "regions" = regions named ("אירופה"→europe, "המזרח הרחוק"→asia). "exclude" = ids the traveller rules out ("לא יוון" → every Greek id). "abroad" true when they want to fly abroad (חו"ל) or rule out a region.
Meaning → tags: "mustTags" = catalog tags the place MUST have for this trip to make sense (ski for a ski trip, all_inclusive when asked, kosher when kosher food is required, water_slides for a water park); "niceTags" = tags that describe the wish (beach, nature, nightlife, culture, food, shopping, relaxation, luxury, adventure, family, couple, city, low_budget…). Read meaning, not words: "בטן גב"→beach+relaxation, "טרקים"→nature+adventure, "מסיבת רווקים"→nightlife, "ירח דבש"→couple(+luxury), "לראות את הזוהר הצפוני"→nature with suggest iceland/norway-fjords.
"suggest" = up to 5 catalog ids that best fulfil the wish when the traveller did not name one place (consider month/season, flight length, who travels and the budget), best first; [] when they named their place.
"needs": booleans for kosher, shabbat (Shabbat observant), accessible (wheelchair / walker), allInclusive, pool, direct (direct flight); "car" yes/no/unknown. "maxFlightHours" when they limit the flight ("עד 4 שעות טיסה", "קרוב" ≈ 4.5), else 0.
"question": one short question in the request's language only when something essential is genuinely ambiguous, else "".
Catalog ids (id = Hebrew name, country, flight hours, tags):
${destinations.map((d) => `${d.id} = ${d.name.he}, ${d.country.en}, ${d.flightHours}h, ${d.tags.join(' ')}`).join('\n')}`,
    schema: obj({ adults: { type: 'integer' }, children: { type: 'integer' }, childAges: list({ type: 'integer' }, 8), infants: { type: 'integer' },
      nights: { type: 'integer' }, nightsPerPlace: list({ type: 'integer' }, 4), month: { type: 'integer' }, start: str(10), end: str(10),
      budgetIls: { type: 'integer' }, budgetLevel: { type: 'string', enum: ['low', 'high', 'unknown'] },
      destinations: list({ type: 'string', enum: TRIP_IDS }, 4), countries: list({ type: 'string', enum: TRIP_COUNTRIES }, 4), regions: list({ type: 'string', enum: TRIP_REGIONS }, 3),
      exclude: list({ type: 'string', enum: TRIP_IDS }, 20), abroad: { type: 'boolean' },
      mustTags: list({ type: 'string', enum: TRIP_TAGS }, 4), niceTags: list({ type: 'string', enum: TRIP_TAGS }, 8), suggest: list({ type: 'string', enum: TRIP_IDS }, 5),
      needs: obj({ kosher: { type: 'boolean' }, shabbat: { type: 'boolean' }, accessible: { type: 'boolean' }, allInclusive: { type: 'boolean' }, pool: { type: 'boolean' }, direct: { type: 'boolean' }, car: { type: 'string', enum: ['yes', 'no', 'unknown'] } }),
      maxFlightHours: { type: 'number' }, question: str(200) })
  },
  tiebreak: {
    label: 'טיסות: שובר שוויון', audience: 'customer', tier: 'fast', maxTokens: 300, timeoutMs: 6000, cacheTtl: 86400, dailyCalls: 1500,
    system: `You help Gerbi choose between flight offers whose computed scores are nearly tied. You get the traveler's brief and a compact table.
Pick the offer that best fits what this traveler said; when nothing in the brief separates them, prefer the cheaper one.
"reason" is one short Hebrew sentence (max 80 characters) naming the deciding difference.`,
    schema: obj({ pick: { type: 'integer' }, reason: str(160) })
  },
  support: {
    label: 'שירות: ניתוב לנושא', audience: 'customer', tier: 'fast', maxTokens: 200, timeoutMs: 5000, cacheTtl: 7 * 86400, dailyCalls: 1500,
    system: `You route customer-service messages for Gerbi Tours, an Israeli travel agency. You get one Hebrew customer message and a list of topics (id + Hebrew title).
Return the id of the single topic the message is asking about, or "none" when no topic fits. Never answer the customer yourself.`,
    schema: obj({ topic: str(40) })
  },
  support_answer: {
    label: 'שירות: תשובה מעוגנת ב־FAQ', audience: 'customer', tier: 'fast', maxTokens: 700, timeoutMs: 7000, cacheTtl: 7 * 86400, dailyCalls: 1500,
    system: `You are the customer-service assistant of Gerbi Tours (ג׳רבי טורס), an Israeli travel agency. ${HEBREW}
You get "customer_text" (one message) and "sources": the agency's own approved answers, each with an id and title.
Rules:
- Answer ONLY with facts written in the sources. Combine sources when the customer asks two things. Keep it to 1-3 short sentences.
- If the sources do not answer the question, set "answerable" false and "answer" "". Never guess, never use general knowledge, never state a price, fee, policy, visa rule or schedule that is not in the sources.
- "topics": ids of the sources you used (or the closest topic when not answerable), best first, at most 3.
- "escalate": true only when the customer asks for a human, complains, or has a problem with an existing booking or charge.`,
    schema: obj({ answerable: { type: 'boolean' }, answer: str(600), topics: list(str(40), 3), escalate: { type: 'boolean' } })
  },
  tailor_fill: {
    label: 'טופס התאמה אישית: מילוי מטקסט', audience: 'customer', tier: 'fast', maxTokens: 600, timeoutMs: 9000, cacheTtl: 7 * 86400, dailyCalls: 400,
    system: `You fill the tailor-made trip request form of Gerbi Tours from the traveler's own description ("customer_text"). ${HEBREW}
Fill only what the text states or clearly implies; leave "" / 0 / [] otherwise. Never fill names, phones or e-mails.
- destinations: the places/regions the traveler named, in Hebrew, comma separated (e.g. "יפן" or "איטליה, יוון"); "" if none.
- start/end: ISO dates (YYYY-MM-DD) only when exact days are given; they must be after "today" from the input. Otherwise "".
- flexibility: exact (exact dates), days (a few days flexible), month (only a month/season), open (unknown).
- adults/children: counts when stated or clearly implied (couple/honeymoon = 2 adults); 0 when unknown.
- budget: the band that contains the stated total budget in shekels: ${Object.entries(BUDGETS).map(([k, v]) => `${k}=${v}`).join(', ')}; "open" when not stated.
- styles: matching ids from ${Object.entries(STYLES).map(([k, v]) => `${k}=${v}`).join(', ')}.
- notes: one short Hebrew sentence with wishes the fields cannot hold (kosher, Shabbat, celebrations, pace, hotel wishes), or "".`,
    schema: obj({ destinations: str(200), start: str(10), end: str(10), flexibility: { type: 'string', enum: Object.keys(FLEXIBILITY) }, adults: { type: 'integer', minimum: 0, maximum: 30 }, children: { type: 'integer', minimum: 0, maximum: 20 },
      budget: { type: 'string', enum: Object.keys(BUDGETS) }, styles: list({ type: 'string', enum: Object.keys(STYLES) }, 10), notes: str(300) })
  },
  flight_explain: {
    label: 'טיסות: השוואת המובילות', audience: 'customer', tier: 'fast', maxTokens: 600, timeoutMs: 8000, cacheTtl: 6 * 3600, dailyCalls: 600,
    system: `You explain to an Israeli traveler the difference between the top flight offers Gerbi Tours found (labels A, B, C), using ONLY the facts in "offers" and the traveler's "brief". ${HEBREW}
- "summary": 2-3 short sentences comparing the offers on what matters for this traveler (price difference, total time, stops and waits, departure/arrival hours, baggage). Copy prices exactly as written in the offers.
- "pick": the label that fits this traveler best, or "" when it is a matter of taste.
- "tradeoffs": up to 3 very short bullets ("A: ..."), facts only.
Refer to the offers by their place in the list ("הטיסה הראשונה", "השנייה", "השלישית"), not by letter.
Do not mention anything that is not in the data (no seats, meals, refunds, airline quality or reputation).`,
    schema: obj({ summary: str(500), pick: { type: 'string', enum: ['', 'A', 'B', 'C'] }, tradeoffs: list(str(140), 3) })
  },
  trip_polish: {
    label: 'בונה חופשות: ניסוח התוכנית', audience: 'customer', tier: 'fast', maxTokens: 900, timeoutMs: 9000, cacheTtl: 7 * 86400, dailyCalls: 300,
    system: `You polish the wording of a day-by-day holiday plan that Gerbi Tours (ג׳רבי טורס) already built from its own catalog. ${HEBREW}
You get "destination", "travellers" and "days" (each with its kind and the names of the places planned that day).
- "intro": 1-2 short, warm sentences about this trip for these travellers, mentioning only places that appear in "days".
- "dayTitles": exactly one short title per day, in the same order (max 60 characters), built only from that day's places and kind (arrival, departure, rest, Shabbat, day trip).
Never add places, prices, hours, dates, distances, hotels, airlines or any number that is not in the input. No links, no emojis.`,
    schema: obj({ intro: str(400), dayTitles: list(str(80), 40) })
  },
  // ---- owner ----
  lead_brief: {
    label: 'לידים: תקציר וטיוטת וואטסאפ', audience: 'owner', tier: 'smart', maxTokens: 1400, timeoutMs: 15000, cacheTtl: 30 * 86400, dailyCalls: 300,
    system: `You assist the owner of Gerbi Tours (ג׳רבי טורס), a small Israeli travel agency, with one incoming lead. ${HEBREW}
You get the lead's trip fields, the customer's own text (contact details removed), a rule-based priority score with reasons, and the list of missing details.
- "summary": one line (max 200 chars) the owner can read in 3 seconds: who, where, when, budget, what they want.
- "intent": the closest of ${INTENTS.join(', ')}.
- "missing": up to 3 short questions to ask the customer to be able to quote, most important first.
- "nextStep": one short practical action for the owner.
- "whatsapp": a WhatsApp reply draft for the owner to edit and send: warm, personal, 2-5 short lines, starting with "היי {שם}," (keep the {שם} placeholder exactly), mentioning their trip, asking the 1-2 most important missing questions, and offering a short call. Never promise prices, availability, discounts or specific hotels/flights; never add numbers that are not in the lead.`,
    schema: obj({ summary: str(240), intent: { type: 'string', enum: INTENTS }, missing: list(str(160), 3), nextStep: str(200), whatsapp: str(700) })
  },
  blog_draft: {
    label: 'בלוג: טיוטת פוסט', audience: 'owner', tier: 'write', effort: 'medium', maxTokens: 9000, timeoutMs: 90000, cacheTtl: 86400, dailyCalls: 20,
    system: `You draft blog posts (travel guides) for Gerbi Tours (ג׳רבי טורס), an Israeli travel agency, for its owner to review and edit. ${HEBREW}
Write for Israeli travelers (families, couples, budget-aware, some keep kosher/Shabbat). Useful, specific, scannable; no fluff, no clichés, no emojis.
Hard rules:
- Do NOT state prices, fees, opening hours, flight times, visa/entry rules, discounts or any fact that changes over time. Where such a fact would help, write [לבדוק: what to check] and add it to "factsToVerify".
- Do not invent statistics, quotes, hotel names or "best" claims. Do not mention competitors or suppliers.
- End with a short paragraph inviting readers to plan with Gerbi Tours (tailor-made trip or flight search), without promises.
Fields: "title" (max 80), "seoTitle" (max 60), "seoDescription" (120-155 chars), "excerpt" (max 250), "slug" (lowercase latin words with hyphens, max 50), "category" (one or two Hebrew words), "tags" (up to 5 short Hebrew tags), "outline" (the H2 headings), "body" (Markdown: ## headings, short paragraphs, - bullet lists; no H1, no links, no images), "factsToVerify" (short Hebrew items).`,
    schema: obj({ title: str(120), seoTitle: str(90), seoDescription: str(200), excerpt: str(300), slug: str(60), category: str(40), tags: list(str(30), 8),
      outline: list(str(120), 12), body: str(14000), factsToVerify: list(str(200), 15) })
  },
  insights: {
    label: 'ניהול: תמונת מצב', audience: 'owner', tier: 'smart', maxTokens: 1200, timeoutMs: 15000, cacheTtl: 3600, dailyCalls: 30,
    system: `You are the business analyst of Gerbi Tours (ג׳רבי טורס), a small Israeli travel agency. You get aggregated counts only (leads by type/status/destination/budget, waiting leads, flight searches by route/month/party size, searches with no results). ${HEBREW}
- "headline": one sentence with the most important thing today.
- "bullets": 3-5 observations, each with "kind" trend|risk|opportunity, using numbers exactly as given.
- "actions": 3 concrete things the owner should do today, most valuable first (e.g. which leads to call, which destination to write about or promote, which route to check with the supplier).
Use only numbers that appear in the data. If the data is too thin, say so plainly.`,
    schema: obj({ headline: str(200), bullets: list(obj({ text: str(240), kind: { type: 'string', enum: ['trend', 'risk', 'opportunity'] } }), 5), actions: list(str(200), 3) })
  }
};
