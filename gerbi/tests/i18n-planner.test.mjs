// Spec 21 §9: the free-text engine understands English requests and speaks the page language.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { understandRequest, monthLabel } from '../dist/brief-engine.mjs';
import { extractSignals, missingFields } from '../backend/understanding.mjs';

const today = '2026-10-29';
const same = (a, b) => JSON.stringify(Array.isArray(a) ? [...a].sort() : a) === JSON.stringify(Array.isArray(b) ? [...b].sort() : b);

test('English corpus: every labeled field is understood (100%)', async () => {
  const corpus = JSON.parse(await readFile(new URL('./fixtures/requests-en.json', import.meta.url), 'utf8'));
  assert.ok(corpus.length >= 40);
  const failures = [];
  for (const { text, expect } of corpus) {
    const { brief } = understandRequest(text, {}, { today, lang: 'en' });
    for (const [field, value] of Object.entries(expect)) if (!same(brief[field], value)) failures.push(`${field}: got ${JSON.stringify(brief[field])} want ${JSON.stringify(value)} ← ${text}`);
  }
  assert.deepEqual(failures, []);
});

test('the spec example: from Tel Aviv to Rome in June, 2 adults 1 child 5 nights', () => {
  const r = understandRequest('from Tel Aviv to Rome in June, 2 adults 1 child 5 nights', {}, { today, lang: 'en' });
  assert.equal(r.brief.origin, 'TLV');
  assert.deepEqual(r.brief.want, ['FCO']);
  assert.equal(r.brief.month, 'יוני');
  assert.equal(r.brief.adults, 2);
  assert.equal(r.brief.children, 1);
  assert.equal(r.brief.nights, 5);
  assert.deepEqual(r.understood.map((u) => u.label), ['2 adults', '1 child', 'In June', '5 nights', 'From Tel Aviv', 'Rome']);
  assert.equal(r.coverage.needsPartner, false);
});

test('labels, assumptions and questions are English on the English page, Hebrew unchanged', () => {
  const en = understandRequest('a week in Greece in August, family of 4', {}, { today, lang: 'en' });
  const text = JSON.stringify([en.understood.map((u) => u.label), en.assumed, en.questions.map((q) => q.question)]);
  assert.doesNotMatch(text, /[֐-׿]/);
  assert.match(text, /Where in Greece\?/);
  const he = understandRequest('זוג, 5 לילות ברומא ביוני', {}, { today, lang: 'he' });
  assert.deepEqual(he.understood.map((u) => u.label), ['2 מבוגרים', 'ביוני', '5 לילות', 'רומא', 'חופשה זוגית']);
  // A Hebrew request on the English page: understood by the Hebrew rules, reported in English.
  const mixed = understandRequest('זוג, 5 לילות ברומא ביוני', {}, { today, lang: 'en' });
  assert.deepEqual(mixed.understood.map((u) => u.label), ['2 adults', 'In June', '5 nights', 'Rome', 'Couples getaway']);
  assert.equal(mixed.questions[0].question, 'Which dates in June? A live flight price needs exact dates.');
});

test('English details: dates, budget, flight preferences, negation', () => {
  const r = understandRequest('Barcelona 20-25 November, direct, not too early, with a checked bag, up to $2000, not Madrid', {}, { today, lang: 'en' });
  assert.equal(r.brief.start, '2026-11-20');
  assert.equal(r.brief.end, '2026-11-25');
  assert.equal(r.brief.stops, '0');
  assert.deepEqual(r.brief.out, ['afternoon', 'evening']);
  assert.equal(r.brief.checkedBag, true);
  assert.equal(r.brief.budgetCurrency, 'USD');
  assert.deepEqual(r.brief.exclude, ['MAD']);
  assert.ok(r.understood.some((u) => u.label === '20 Nov 2026 – 25 Nov 2026'));
  assert.ok(r.understood.some((u) => u.label === '$2,000 for everyone'));
  // "a nice hotel" is not the city of Nice; "Nice" after "to" is.
  assert.deepEqual(understandRequest('a nice hotel in Rome', {}, { today, lang: 'en' }).brief.want, ['FCO']);
  assert.deepEqual(understandRequest('to Nice in June', {}, { today, lang: 'en' }).brief.want, ['NCE']);
  // "one way" stays a trip type, not the number 1.
  assert.equal(understandRequest('one way to London on 12/3', {}, { today, lang: 'en' }).brief.tripType, 'oneway');
});

test('server helpers speak the visitor language; English tags are learned', () => {
  assert.equal(missingFields({}, 'en')[0].question, 'How many adults and kids are traveling?');
  assert.equal(missingFields({})[0].question, 'כמה מבוגרים וילדים נוסעים?');
  const signals = extractSignals('romantic beach week, all inclusive, kosher');
  for (const tag of ['couple', 'beach', 'all_inclusive', 'kosher']) assert.ok(signals.tags.includes(tag), tag);
  assert.equal(monthLabel('יוני', 'en'), 'June');
  assert.equal(monthLabel('יוני', 'he'), 'יוני');
});
