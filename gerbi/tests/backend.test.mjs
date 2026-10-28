import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractSignals, missingFields, scoreDestinations } from '../backend/understanding.mjs';
import { destinationTags, publicTagCatalog } from '../backend/tag-catalog.mjs';
import { trips } from '../dist/data.mjs';
import { LearningStore } from '../backend/learning-store.mjs';
import { createServer } from '../server.mjs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

test('taxonomy exposes stable Hebrew-facing facets without implementation aliases', () => {
  const facets = publicTagCatalog();
  assert.ok(facets.length >= 5);
  assert.ok(facets.find((facet) => facet.id === 'travel_style').children.some((tag) => tag.id === 'beach'));
  assert.deepEqual(destinationTags.santorini.includes('beach'), true);
});

test('understanding extracts travel constraints and asks only for missing facts', () => {
  const signals = extractSignals('זוג עם שני ילדים, שבוע באוגוסט, ים ובריכה, עד 18 אלף שקל וטיסה ישירה');
  assert.equal(signals.adults, 2);
  assert.equal(signals.children, 2);
  assert.equal(signals.nights, 7);
  assert.equal(signals.budget, 18000);
  assert.equal(signals.month, 'אוגוסט');
  assert.ok(signals.tags.includes('beach'));
  assert.ok(signals.tags.includes('direct_flight'));
  assert.equal(missingFields(signals).length, 0);
});

test('ranking respects explicit tags and never returns unaffordable examples', () => {
  const signals = { adults: 2, children: 2, nights: 7, budget: 18000, tags: ['family', 'beach'] };
  const ranked = scoreDestinations(trips, signals, { tags: { family: 1 }, destinations: { dubai: 1 } });
  assert.ok(ranked.length > 0);
  assert.equal(ranked.every((item) => item.estimate <= signals.budget), true);
  assert.equal(ranked[0].destination.id, 'dubai');
});

test('learning store never writes query text and only learns when explicitly consented', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'gerbi-learning-'));
  try {
    const store = new LearningStore(directory);
    await store.learnQuery({ text: 'זוג עם ילדים רוצים ים ובריכה', tags: ['family', 'beach'], consent: false });
    assert.equal((await store.summary()).totals.understood, 0);
    await store.learnQuery({ text: 'זוג עם ילדים רוצים ים ובריכה', tags: ['family', 'beach'], consent: true });
    const summary = await store.summary();
    assert.equal(summary.totals.understood, 1);
    const saved = await readFile(path.join(directory, 'learning.json'), 'utf8');
    assert.equal(saved.includes('זוג עם ילדים רוצים ים ובריכה'), false);
    assert.match(saved, /"family"/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('AI HTTP API returns tags, recommendations, and rejects invalid feedback', async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const tags = await (await fetch(`${base}/api/tags`)).json();
    assert.ok(tags.facets.some((facet) => facet.id === 'special_requirements'));
    const understood = await (await fetch(`${base}/api/ai/understand`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'זוג עם שני ילדים, שבוע בים עד 18 אלף שקל', learningConsent: false })
    })).json();
    assert.equal(understood.mode, 'rules_and_local_learning');
    assert.ok(understood.signals.tags.includes('beach'));
    assert.ok(understood.recommendations.length > 0);
    const invalid = await fetch(`${base}/api/ai/feedback`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ event:'anything' }) });
    assert.equal(invalid.status, 400);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
