import crypto from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { safeTokens } from './understanding.mjs';

const empty = () => ({ version: 1, updatedAt: null, totals: { understood: 0, feedback: 0 }, tagWeights: {}, destinationWeights: {}, keywordTagCounts: {}, events: [] });
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class LearningStore {
  constructor(directory) { this.directory = directory; this.file = path.join(directory, 'learning.json'); this.data = empty(); this.loaded = false; this.pending = Promise.resolve(); }
  async load() {
    if (this.loaded) return this.data;
    try { this.data = { ...empty(), ...JSON.parse(await readFile(this.file, 'utf8')) }; } catch { this.data = empty(); }
    this.loaded = true; return this.data;
  }
  async persist() {
    await mkdir(this.directory, { recursive: true });
    const temporary = `${this.file}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(this.data, null, 2), { mode: 0o600 });
    await rename(temporary, this.file);
  }
  async mutate(operation) {
    this.pending = this.pending.then(async () => { await this.load(); operation(this.data); this.data.updatedAt = new Date().toISOString(); await this.persist(); });
    await this.pending; return this.data;
  }
  async learnQuery({ text, tags, consent }) {
    if (!consent) return this.summary();
    const safeTagIds = [...new Set((tags || []).filter((tag) => /^[a-z_]{2,50}$/.test(tag)))].slice(0, 20);
    const tokens = safeTokens(text);
    await this.mutate((data) => {
      data.totals.understood += 1;
      for (const token of tokens) {
        data.keywordTagCounts[token] ||= {};
        for (const tag of safeTagIds) data.keywordTagCounts[token][tag] = clamp((data.keywordTagCounts[token][tag] || 0) + 1, 0, 1000);
      }
      data.events.push({ type: 'understood', at: new Date().toISOString(), tagCount: safeTagIds.length, queryHash: crypto.createHash('sha256').update(text).digest('hex').slice(0, 16) });
      data.events = data.events.slice(-1000);
    });
    return this.summary();
  }
  async feedback({ event, destinationId, tags = [] }) {
    const deltas = { impression: 0.05, open_destination: 0.5, compare: 0.8, save: 1.5, edit_plan: 1.2, verify: 2, dismiss: -0.4 };
    if (!(event in deltas)) throw new Error('unsupported_feedback_event');
    const delta = deltas[event];
    await this.mutate((data) => {
      data.totals.feedback += 1;
      if (destinationId) data.destinationWeights[destinationId] = clamp((data.destinationWeights[destinationId] || 0) + delta, -20, 20);
      for (const tag of [...new Set(tags)].filter((tag) => /^[a-z_]{2,50}$/.test(tag))) data.tagWeights[tag] = clamp((data.tagWeights[tag] || 0) + delta, -10, 10);
      data.events.push({ type: event, at: new Date().toISOString(), destinationId: destinationId || null, tagCount: tags.length });
      data.events = data.events.slice(-1000);
    });
    return this.summary();
  }
  async weightsFor(text) {
    await this.load();
    const inferred = {};
    for (const token of safeTokens(text)) for (const [tag, count] of Object.entries(this.data.keywordTagCounts[token] || {})) inferred[tag] = (inferred[tag] || 0) + Math.min(1.5, count * 0.1);
    return { tags: { ...this.data.tagWeights, ...inferred }, destinations: this.data.destinationWeights };
  }
  async summary() {
    await this.load();
    return { totals: this.data.totals, updatedAt: this.data.updatedAt, tagWeights: this.data.tagWeights, destinationWeights: this.data.destinationWeights, retainedEventCount: this.data.events.length };
  }
}
