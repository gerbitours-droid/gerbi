// Spec 21 + 20: legal drafts and the accessibility statement render the required sections.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { legalRoutes, LAST_A11Y_CHECK } from '../dist/legal.mjs';

const render = (name) => {
  const view = {};
  legalRoutes()[name]({ view, footer: '<footer></footer>', bread: (t) => `<nav>${t}</nav>`, heading: (k, t, s) => `<h1>${t}</h1><p>${s}</p>` });
  return view.innerHTML;
};

test('terms: draft for the lawyer, agency role, prices until ticketing, cancellation law, jurisdiction', () => {
  const html = render('terms');
  assert.match(html, /טיוטה – לבדיקת עורך דין/);
  assert.match(html, /אנחנו לא חברת התעופה/);
  assert.match(html, /הנפקת הכרטיס/);
  assert.match(html, /14ג לחוק הגנת הצרכן/);
  assert.match(html, /תקנות הגנת הצרכן \(ביטול עסקה\)/);
  assert.match(html, /דרכון בתוקף/);
  assert.match(html, /הדין הישראלי/);
  assert.match(html, /href="#\/privacy"/);
  assert.match(html, /class="fill-in"/);
});

test('privacy: Amendment 13 items — purposes, categories, retention, rights, processors, transfer abroad', () => {
  const html = render('privacy');
  assert.match(html, /טיוטה – לבדיקת עורך דין/);
  assert.match(html, /תיקון 13/);
  for (const text of ['חשבון לקוח', 'פניות (לידים)', 'שיחות עם בוט השירות', 'gerbi_sid', 'משך שמירה', 'עיון', 'תיקון', 'מחיקה', 'Upstash', 'Vercel', 'Resend', 'WhatsApp', 'Anthropic', 'מחוץ לישראל']) assert.ok(html.includes(text), text);
});

test('accessibility statement: regulation 35 format with coordinator placeholders and check date', () => {
  const html = render('accessibility');
  assert.doesNotMatch(html, /draft-banner/);
  for (const text of ['ת״י 5568', 'התשע״ג–2013', 'AA', 'מה הונגש', 'מגבלות ידועות', 'רכז/ת הנגישות', 'הגדרות תצוגה', LAST_A11Y_CHECK]) assert.ok(html.includes(text), text);
  assert.ok((html.match(/class="fill-in"/g) || []).length >= 4);
});

test('legal pages never show the supplier brand', () => {
  for (const name of ['terms', 'privacy', 'accessibility']) assert.doesNotMatch(render(name), /volero/i);
});
