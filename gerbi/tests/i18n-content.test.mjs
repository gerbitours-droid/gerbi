// Spec 21: English versions of the legal pages, the built-in guides and the demo trips.
// This file runs as the English site: the page language is read from location at import time.
import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.location = { pathname: '/en/', hash: '', origin: 'http://localhost' };
const { legalRoutes } = await import('../dist/legal.mjs');
const { builtinPosts, articles } = await import('../dist/blog-posts.mjs');
const { trips } = await import('../dist/data.mjs');
const { lang } = await import('../dist/i18n.mjs');

const HEBREW = /[֐-׿]/;
const render = (name) => {
  const view = {};
  legalRoutes()[name]({ view, footer: '<footer></footer>', bread: (t) => `<nav>${t}</nav>`, heading: (k, t, s) => `<span>${k}</span><h1>${t}</h1><p>${s}</p>` });
  return view.innerHTML;
};

test('runs as the English site', () => assert.equal(lang, 'en'));

test('every legal page has an English draft translation marked for legal review, without Hebrew', () => {
  for (const name of ['terms', 'privacy', 'accessibility']) {
    const html = render(name);
    assert.match(html, /Draft – pending legal review/, name);
    assert.match(html, /Hebrew version prevails/, name);
    assert.doesNotMatch(html, HEBREW, `${name}: ${html.match(/[^<>]*[֐-׿][^<>]*/)?.[0]}`);
    assert.doesNotMatch(html, /volero/i);
    assert.match(html, /class="fill-in">\[To be completed by the site owner:/, name);
  }
});

test('English legal pages keep the required content and section anchors', () => {
  const terms = render('terms'), privacy = render('privacy'), a11y = render('accessibility');
  for (const id of ['t-about', 't-consumer', 't-law', 't-contact']) assert.match(terms, new RegExp(`id="${id}"`));
  assert.match(terms, /Section 14C of the Consumer Protection Law/);
  assert.match(terms, /Israeli law/);
  assert.match(terms, /href="#\/privacy"/);
  for (const text of ['Amendment 13', 'gerbi_sid', 'Upstash', 'Vercel', 'Resend', 'WhatsApp', 'Anthropic', 'outside Israel']) assert.ok(privacy.includes(text), text);
  for (const text of ['SI 5568', '5773–2013', 'AA', 'Known limitations', 'Accessibility coordinator', 'Display settings']) assert.ok(a11y.includes(text), text);
});

test('every built-in guide has a complete English version without Hebrew', () => {
  const posts = builtinPosts();
  assert.equal(posts.length, articles.length);
  for (const post of posts) {
    assert.ok(post.en, post.slug);
    for (const field of ['title', 'excerpt', 'body', 'category']) assert.ok(post.en[field], `${post.slug}.${field}`);
    assert.match(post.en.body, /^## /);
    assert.equal(post.en.body.split('## ').length, post.body.split('## ').length, `${post.slug}: same sections`);
    assert.doesNotMatch(JSON.stringify(post.en), HEBREW, post.slug);
    assert.ok(post.en.title.length <= 120 && post.en.excerpt.length <= 300 && post.en.category.length <= 40);
    assert.match(post.title, HEBREW, 'the Hebrew fields stay Hebrew');
  }
});

test('demo trips are English on the English site; ids, prices and Hebrew originals are kept', () => {
  for (const trip of trips) {
    for (const field of ['name', 'short', 'description', 'badge', 'style']) assert.doesNotMatch(trip[field], HEBREW, `${trip.id}.${field}`);
    assert.ok(trip.days.every((d) => !HEBREW.test(d)), `${trip.id}.days`);
    assert.match(trip.he.name, HEBREW);
    assert.equal(trip.he.days.length, trip.days.length);
    assert.ok(trip.price > 0 && trip.image);
  }
  assert.deepEqual(trips.map((t) => t.id), ['santorini', 'rome', 'maldives', 'dubai']);
});
