// The builder's funnel counters (owner 18.11.2026): steps only, per day; unknown steps ignored; drop-off per step.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFunnelStats, FUNNEL_PATH } from '../backend/funnel-stats.mjs';

test('funnel: counts known steps per day, ignores anything else, and shows each step as a share of the one before', async () => {
  const mem = new Map(), store = { get: async (k) => mem.get(k) ?? null, set: async (k, v) => { mem.set(k, structuredClone(v)); } };
  const f = createFunnelStats(store, { now: () => Date.parse('2026-11-18T10:00:00Z') });
  for (const s of ['view', 'view', 'view', 'view', 'submit', 'submit', 'plan_shown', 'plan_shown', 'followup', 'lead_open', 'lead_sent', 'hack<script>', 'name:Dana']) f.record(s);
  await f.flush();
  const s = await f.summary(7);
  assert.equal(s.steps.view, 4); assert.equal(s.steps.submit, 2); assert.ok(!('hack<script>' in s.steps) && !('name:Dana' in s.steps));
  assert.deepEqual(s.path.map((x) => x.step), FUNNEL_PATH);
  assert.equal(s.path[1].ofPrevious, 50, 'half of the visitors sent a request');
  assert.deepEqual(JSON.stringify([...mem.values()]).match(/Dana/), null, 'no free text stored');
});
