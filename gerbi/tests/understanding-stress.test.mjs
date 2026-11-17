import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CORPUS, runStress, check, TODAY, FX } from '../scripts/stress-understanding.mjs';
import { parseTrip, planPackage, applyEdits } from '../dist/trip-builder.mjs';

// The stress corpus (scripts/stress-understanding.mjs, docs/qa/understanding-stress-he.md): hundreds of one-sentence
// requests through parseTrip → planPackage, each checked field by field and end to end.
test('stress corpus: ≥ 400 realistic requests, mostly Hebrew, ≥ 98% fully right end to end', () => {
  const res = runStress();
  assert.ok(CORPUS.length >= 400, `corpus size ${CORPUS.length}`);
  assert.ok(res.hebrew / res.total >= 0.65, `Hebrew share ${res.hebrew}/${res.total}`);
  const misses = res.failed.map((x) => `${x.text} → ${x.fails.map((f) => `${f.field}: ${JSON.stringify(f.got)} ≠ ${JSON.stringify(f.want)}`).join(', ')}`);
  assert.ok(res.rate >= 0.98, `${res.passed}/${res.total}\n${misses.join('\n')}`);
});

const plan = (text, lang = /[א-ת]/.test(text) ? 'he' : 'en') => { const r = parseTrip(text, { today: TODAY, lang, fx: FX }); return { r, p: planPackage(r, { today: TODAY }) }; };

test('owner report: "a month" is 30 nights end to end – never a week – and a month in a country is several bases', () => {
  for (const text of ['חודש ברומא', 'a month in Japan in April', 'למשך חודש בבאלי']) {
    const { r, p } = plan(text);
    assert.equal(r.nights, 30, text); assert.equal(p.request.nights, 30, text);
    assert.equal(p.itinerary.length, 31, `${text}: every day of the stay is planned`);
    assert.ok(p.itinerary.filter((d) => d.kind === 'free').every((d) => d.ideas.length >= 2), 'free days carry ideas');
  }
  const { p } = plan('חודש באיטליה בקיץ');
  assert.ok(p.stops.length >= 2, 'several bases'); assert.equal(p.stops.reduce((s, x) => s + x.nights, 0), 30);
  assert.ok(p.assumed.some((x) => x.includes('בסיסים')), 'the split is said out loud');
  assert.equal(plan('חודשיים בתאילנד').r.nights, 60);
  // "חודש" naming a date is not a length.
  assert.equal(plan('בחודש מאי לרומא').r.nights, 0);
  assert.equal(plan('בעוד חודש לשבוע ברומא').r.nights, 7);
  // The inline editor accepts long stays too.
  assert.equal(applyEdits(plan('רומא').r, { nights: 45 }, TODAY).nights, 45);
});

test('owner report: a ₪4,800 budget is a ₪4,800 cap for everyone, end to end', () => {
  const { r, p } = plan('זוג, רומא, תקציב ₪4,800');
  assert.equal(r.budget, 4800); assert.equal(p.request.budget, 4800);
  assert.ok(p.budgetPlan, 'the plan is fitted to the cap');
  assert.ok(p.budgetPlan.estimate.low < 48000, 'the estimate is in the right order of magnitude');
});

test('a genuinely ambiguous request gets exactly one clear question, not a silent guess', () => {
  const conflict = plan('מ-3 עד 10 באוגוסט, שבועיים ברומא').r;
  assert.deepEqual(conflict.questionIds, ['nights-conflict']); assert.equal(conflict.questions.length, 1);
  assert.equal(conflict.nights, 7, 'the dates win until the traveller answers');
  assert.deepEqual(plan('חופשה עם הילדים ברומא באוגוסט, שבוע').r.questionIds, ['children']);
  assert.deepEqual(plan('זוג ו-2 ילדים, שבוע ביוון באוגוסט').r.questionIds, ['ages']);
  // A need the offline plan cannot guarantee is stated, never dropped.
  assert.ok(check('נגיש לכיסא גלגלים, רומא, 5 לילות', {}).p.assumed.some((x) => x.includes('נגישות')));
});
