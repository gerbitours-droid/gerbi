// The model reads the meaning (task trip_tags); mergeModel folds it into the rules' request and the catalog is searched
// by its tags. These answers are written by hand in the task's schema – no provider is called.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTrip, planPackage, mergeModel } from '../dist/trip-builder.mjs';
import { TASKS, TRIP_TAGS } from '../backend/ai-tasks.mjs';
import { validateSchema } from '../backend/ai-gateway.mjs';

const TODAY = '2026-11-17';
const none = { kosher: false, shabbat: false, accessible: false, allInclusive: false, pool: false, direct: false, car: 'unknown' };
const answer = (x) => ({ adults: 0, children: 0, childAges: [], infants: 0, nights: 0, nightsPerPlace: [], month: 0, start: '', end: '', budgetIls: 0, budgetLevel: 'unknown',
  destinations: [], countries: [], regions: [], exclude: [], abroad: false, mustTags: [], niceTags: [], suggest: [], needs: none, maxFlightHours: 0, question: '', ...x });
const plan = (text, v) => planPackage(mergeModel(parseTrip(text, { today: TODAY }), v, { today: TODAY }), { today: TODAY });

test('trip_tags: the schema accepts a full answer and limits ids/tags to the catalog', () => {
  assert.deepEqual(validateSchema(TASKS.trip_tags.schema, answer({ mustTags: ['ski'], suggest: ['bansko'] })), []);
  assert.ok(validateSchema(TASKS.trip_tags.schema, answer({ suggest: ['atlantis'] })).length > 0);
  assert.ok(TRIP_TAGS.includes('water_slides') && TRIP_TAGS.includes('ski'));
});

test('meaning from the model: tags search the catalog, must-tags are kept, its picks lead, the rules keep exact dates', () => {
  // A wish with no place or keyword the rules know: the model's tags and pick decide.
  const p = plan('בא לנו משהו עם שלג ומגלשות לילדים בחנוכה', answer({ adults: 2, children: 2, childAges: [6, 9], mustTags: ['ski'], niceTags: ['family'], suggest: ['bansko', 'austrian-alps'] }));
  assert.equal(p.destination.id, 'bansko'); assert.equal(p.request.children, 2); assert.deepEqual(p.request.childAges, [6, 9]);
  assert.equal(p.request.start.slice(0, 7), '2026-12', 'Hanukkah from the rules');
  // Must-tags without a pick: only places that have them all.
  const q = plan('משהו הכול כלול עם פארק מים, אוגוסט', answer({ mustTags: ['all_inclusive', 'water_slides'], niceTags: ['beach', 'family'] }));
  assert.ok(['rhodes'].includes(q.destination.id), q.destination.id);
  // A named place the rules cannot read (an alias), and an exclusion of a whole country.
  assert.equal(plan('Nice and Monaco, 5 nights, July, couple', answer({ destinations: ['nice'] })).destination.id, 'nice');
  const g = plan('משהו עם חוף ביולי, לא יוון', answer({ exclude: ['athens', 'santorini', 'crete', 'rhodes', 'mykonos'], niceTags: ['beach'] }));
  assert.ok(!['athens', 'santorini', 'crete', 'rhodes', 'mykonos'].includes(g.destination.id));
  // Invalid values are ignored: an impossible count, a past date.
  const bad = mergeModel(parseTrip('זוג לרומא', { today: TODAY }), answer({ adults: 40, start: '2020-01-01' }), { today: TODAY });
  assert.equal(bad.adults, 2); assert.equal(bad.start, '');
  // No model answer: exactly the rules.
  const r = parseTrip('זוג לרומא 4 לילות במאי', { today: TODAY });
  assert.deepEqual(mergeModel(r, null), r);
});
