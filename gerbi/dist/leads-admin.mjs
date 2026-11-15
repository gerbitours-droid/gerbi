// Owner inbox for leads: GET /api/leads with the admin token, newest first. Every value is escaped.
import { CHANNELS, FLEXIBILITY, BUDGETS, STYLES } from './leads-validate.mjs';

const $ = (s) => document.querySelector(s);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const KEY = 'gerbi-leads-token';
const when = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' }); };
const intl = (phone) => (/^0\d{8,9}$/.test(phone || '') ? '972' + phone.slice(1) : '');

function card(lead) {
  const rows = [['טלפון', `<a href="tel:${esc(lead.phone)}" dir="ltr">${esc(lead.phone)}</a>`], ['מייל', lead.email ? `<a href="mailto:${esc(lead.email)}" dir="ltr">${esc(lead.email)}</a>` : '—'], ['לחזור דרך', esc(CHANNELS[lead.channel] || lead.channel)]];
  if (lead.type === 'tailor') {
    rows.push(['יעד', esc(lead.destinations)], ['תאריכים', esc([lead.start, lead.end].filter(Boolean).join(' עד ') || 'לא צוין') + ' · ' + esc(FLEXIBILITY[lead.flexibility] || '')],
      ['נוסעים', `${esc(lead.adults)} מבוגרים${lead.children ? ` · ${esc(lead.children)} ילדים` : ''}`], ['תקציב', esc(BUDGETS[lead.budget] || '')]);
    if (lead.styles?.length) rows.push(['סגנון', esc(lead.styles.map((s) => STYLES[s] || s).join(' · '))]);
    if (lead.notes) rows.push(['הערות', esc(lead.notes)]);
  } else if (lead.message) rows.push(['הודעה', esc(lead.message)]);
  if (lead.context) rows.push(['מהחיפוש', esc(`${lead.context.from || ''} → ${lead.context.to || ''} ${lead.context.depart || ''}${lead.context.return ? ' – ' + lead.context.return : ''} · ${lead.context.results ?? '?'} תוצאות`)]);
  rows.push(['דיוור', lead.marketing ? 'מסכים/ה לקבל עדכונים' : 'לא']);
  const wa = intl(lead.phone);
  return `<article class="lead-card"><header><h2>${esc(lead.name)}</h2><span class="lead-tag ${lead.type === 'tailor' ? 'tailor' : ''}">${lead.type === 'tailor' ? 'טיול בהתאמה אישית' : 'צור קשר'}</span><small>${esc(when(lead.createdAt))} · ${esc(lead.source || '')} · <span dir="ltr">${esc(String(lead.id || '').slice(0, 8))}</span></small></header>
   <dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
   <div class="lead-actions">${wa ? `<a class="button secondary" href="https://wa.me/${wa}" target="_blank" rel="noopener noreferrer">וואטסאפ</a>` : ''}<a class="button secondary" href="tel:${esc(lead.phone)}">חיוג</a></div></article>`;
}

async function load(token) {
  const status = $('#admin-status');
  status.textContent = 'טוענים…';
  try {
    const response = await fetch('/api/leads?limit=500', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (response.status === 404) { status.textContent = 'הגישה לפניות לא הוגדרה בשרת (חסר LEADS_ADMIN_TOKEN).'; return; }
    if (response.status === 401) { status.textContent = 'המפתח שגוי.'; sessionStorage.removeItem(KEY); $('#token').focus(); return; }
    if (response.status === 429) { status.textContent = 'יותר מדי ניסיונות. נסו שוב בעוד דקה.'; return; }
    if (!response.ok) throw new Error();
    const data = await response.json();
    try { sessionStorage.setItem(KEY, token); } catch {}
    status.textContent = data.count ? `${data.count} פניות, החדשה ביותר ראשונה.${data.storage === 'file' ? ' (אחסון מקומי)' : ''}` : 'אין עדיין פניות.';
    $('#leads').innerHTML = data.leads.map(card).join('');
  } catch { status.textContent = 'לא הצלחנו לטעון את הפניות. נסו שוב.'; }
}

$('#token-form').addEventListener('submit', (event) => { event.preventDefault(); const token = $('#token').value.trim(); if (token) load(token); });
$('#forget').onclick = () => { try { sessionStorage.removeItem(KEY); } catch {} $('#token').value = ''; $('#leads').innerHTML = ''; $('#admin-status').textContent = 'המפתח נמחק מהלשונית.'; };
try { const saved = sessionStorage.getItem(KEY); if (saved) { $('#token').value = saved; load(saved); } } catch {}
