// Owner dashboard (spec 18): leads, blog, site content, FX override, support escalations.
// Auth is an httpOnly session cookie set by POST /api/admin/login; the page never stores the password.
// Every value from the server is escaped before it reaches innerHTML.
import { CHANNELS, FLEXIBILITY, BUDGETS, STYLES } from './leads-validate.mjs';
import { renderMarkdown } from './markdown.mjs';
import { SITE_DEFAULTS, GUIDE_FIELDS, LIMITS, mergeSite, normalizePost, normalizeSite, slugFromTitle, postState, israelToday, siteDefaultsEn } from './content-model.mjs';
import { builtinPosts, BUILTIN_SLUGS } from './blog-posts.mjs';
import { destinationInfo, faqs as builtinFaqs } from './pages.mjs';
import { trips } from './data.mjs';
import { setupAdminAi, aiTab, priorityChip, leadAiHtml, wireLeadAi, sortByPriority, mountBlogAssistant } from './admin-ai.mjs';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const when = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' }); };
const panel = () => $('#panel');
let dirty = false;
window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

class HttpError extends Error { constructor(status, data) { super(data?.message || `http_${status}`); this.status = status; this.data = data; } }
async function api(method, path, body) {
  const response = await fetch(path, { method, credentials: 'same-origin', cache: 'no-store', headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (response.status === 401 && path.startsWith('/api/admin/')) { showLogin('החיבור הסתיים. היכנסו שוב.'); throw new HttpError(401, data); }
  if (!response.ok) throw new HttpError(response.status, data);
  return data;
}
const failText = (error) => error.status === 429 ? 'יותר מדי בקשות. נסו שוב בעוד דקה.' : error.status === 503 ? 'האחסון לא זמין כרגע. נסו שוב בעוד רגע.' : error.status === 413 ? 'התוכן גדול מדי.' : error.data?.message || 'משהו השתבש. נסו שוב.';
setupAdminAi({ api, failText });
function status(el, text, kind = '') { if (!el) return; el.textContent = text; el.dataset.kind = kind; }
function showErrors(form, fields = {}) {
  $$('.field-error', form).forEach((el) => el.remove());
  $$('[aria-invalid]', form).forEach((el) => el.removeAttribute('aria-invalid'));
  let first = null;
  for (const [key, message] of Object.entries(fields)) {
    const input = form.querySelector(`[data-key="${CSS.escape(key)}"]`) || form.querySelector(`[data-key="${CSS.escape(key.split('.').slice(0, -1).join('.'))}"]`);
    const p = document.createElement('p'); p.className = 'field-error'; p.textContent = message;
    if (input) { input.setAttribute('aria-invalid', 'true'); input.closest('.lead-field, label, fieldset')?.append(p); first ||= input; }
    else form.querySelector('.form-errors')?.append(p);
  }
  first?.focus();
}

// ---------- Login / shell ----------
function showLogin(message = '') {
  dirty = false;
  $('#app-view').hidden = true; $('#login-view').hidden = false;
  status($('#login-status'), message, message ? 'error' : '');
  $('#password').value = ''; $('#password').focus();
}
function showApp() { $('#login-view').hidden = true; $('#app-view').hidden = false; route(); }

$('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = $('#password').value;
  if (!password) { status($('#login-status'), 'הקלידו סיסמה.', 'error'); return; }
  const button = $('#login-form button'); button.disabled = true; status($('#login-status'), 'נכנסים…');
  try {
    const response = await fetch('/api/admin/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    if (response.status === 204) { $('#password').value = ''; showApp(); return; }
    const data = await response.json().catch(() => ({}));
    status($('#login-status'), response.status === 404 ? 'הגישה לניהול לא הוגדרה בשרת (חסר LEADS_ADMIN_TOKEN).' : response.status === 401 ? 'הסיסמה שגויה.' : response.status === 429 ? 'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות.' : data.message || 'לא הצלחנו להתחבר.', 'error');
    $('#password').select();
  } catch { status($('#login-status'), 'אין חיבור לשרת. נסו שוב.', 'error'); }
  finally { button.disabled = false; }
});
$('#logout').onclick = async () => { if (dirty && !confirm('יש שינויים שלא נשמרו. לצאת בכל זאת?')) return; try { await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}' }); } catch {} showLogin('יצאתם מהמערכת.'); };

const TABS = { leads: leadsTab, blog: blogTab, site: siteTab, fx: fxTab, support: supportTab, ai: aiTab };
let currentTab = '';
function route() {
  const [tab, ...rest] = (location.hash.slice(1) || 'leads').split('/');
  const name = TABS[tab] ? tab : 'leads';
  $$('.admin-tabs a').forEach((a) => { const on = a.dataset.tab === name; a.classList.toggle('active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (name !== currentTab) { currentTab = name; dirty = false; }
  TABS[name](rest.join('/'));
}
window.addEventListener('hashchange', () => { if (!$('#app-view').hidden) route(); });
document.addEventListener('click', (e) => { const a = e.target.closest('a[href^="#"]'); if (a && dirty && !confirm('יש שינויים שלא נשמרו. לעזוב בלי לשמור?')) e.preventDefault(); else if (a) dirty = false; }, true);

// ---------- Leads ----------
const LEAD_STATUS = { new: 'חדש', progress: 'בטיפול', closed: 'נסגר' };
const LEAD_TYPE = { contact: 'צור קשר', tailor: 'טיול בהתאמה אישית', support: 'שירות לקוחות' };
const leadFilters = { status: '', type: '', q: '' };
let leadSort = 'new', leadById = new Map();
const intl = (phone) => (/^0\d{8,9}$/.test(phone || '') ? '972' + phone.slice(1) : '');

function leadCard(lead) {
  const rows = [['טלפון', `<a href="tel:${esc(lead.phone)}" dir="ltr">${esc(lead.phone)}</a>`], ['מייל', lead.email ? `<a href="mailto:${esc(lead.email)}" dir="ltr">${esc(lead.email)}</a>` : '—'], ['לחזור דרך', esc(CHANNELS[lead.channel] || lead.channel || '—')]];
  if (lead.type === 'tailor') {
    rows.push(['יעד', esc(lead.destinations)], ['תאריכים', esc([lead.start, lead.end].filter(Boolean).join(' עד ') || 'לא צוין') + ' · ' + esc(FLEXIBILITY[lead.flexibility] || '')],
      ['נוסעים', `${esc(lead.adults)} מבוגרים${lead.children ? ` · ${esc(lead.children)} ילדים` : ''}`], ['תקציב', esc(BUDGETS[lead.budget] || '')]);
    if (lead.styles?.length) rows.push(['סגנון', esc(lead.styles.map((s) => STYLES[s] || s).join(' · '))]);
    if (lead.notes) rows.push(['הערות הלקוח', esc(lead.notes)]);
  } else if (lead.message) rows.push(['הודעה', esc(lead.message)]);
  if (lead.context) rows.push(['מהחיפוש', esc(`${lead.context.from || ''} → ${lead.context.to || ''} ${lead.context.depart || ''}${lead.context.return ? ' – ' + lead.context.return : ''}`)]);
  rows.push(['דיוור', lead.marketing ? 'מסכים/ה לקבל עדכונים' : 'לא']);
  const wa = intl(lead.phone), id = esc(lead.id);
  const notes = (lead.adminNotes || []).map((n) => `<li><small>${esc(when(n.at))}</small> ${esc(n.text)}</li>`).join('');
  return `<article class="lead-card admin-lead" data-lead="${id}"><header><h2>${esc(lead.name)}</h2><span class="lead-tag ${lead.type === 'tailor' ? 'tailor' : ''}">${esc(LEAD_TYPE[lead.type] || lead.type)}</span>${priorityChip(lead)}<small>${esc(when(lead.createdAt))} · ${esc(lead.source || '')}</small>
    <label class="status-pick status-${esc(lead.status)}"><span class="sr-only">סטטוס</span><select data-status aria-label="סטטוס הפנייה של ${esc(lead.name)}">${Object.entries(LEAD_STATUS).map(([k, v]) => `<option value="${k}"${lead.status === k ? ' selected' : ''}>${v}</option>`).join('')}</select></label></header>
    <dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
    <div class="admin-notes"><strong>הערות פנימיות</strong>${notes ? `<ul>${notes}</ul>` : '<p class="micro-copy">אין עדיין הערות.</p>'}
     <form data-note class="note-form"><label class="sr-only" for="note-${id}">הערה חדשה</label><input id="note-${id}" maxlength="1000" placeholder="הוספת הערה (נראית רק לכם)"><button class="button secondary" type="submit">הוספה</button></form></div>
    ${leadAiHtml(lead)}
    <div class="lead-actions">${wa ? `<a class="button secondary" href="https://wa.me/${wa}" target="_blank" rel="noopener noreferrer">וואטסאפ</a>` : ''}<a class="button secondary" href="tel:${esc(lead.phone)}">חיוג</a></div><p class="admin-status" role="status"></p></article>`;
}

async function leadsTab() {
  const p = panel();
  p.innerHTML = `<div class="admin-head"><h1>לידים</h1><a class="button secondary" id="csv" href="#">ייצוא CSV</a></div>
   <div class="lead-filters" role="group" aria-label="סינון לפי סטטוס" id="status-chips"></div>
   <div class="admin-filters"><div class="lead-field"><label for="lead-q">חיפוש</label><input id="lead-q" type="search" placeholder="שם, טלפון, מייל או יעד" value="${esc(leadFilters.q)}"></div>
    <div class="lead-field"><label for="lead-type">סוג</label><select id="lead-type"><option value="">הכול</option>${Object.entries(LEAD_TYPE).map(([k, v]) => `<option value="${k}"${leadFilters.type === k ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
    <div class="lead-field"><label for="lead-sort">מיון</label><select id="lead-sort"><option value="new"${leadSort === 'new' ? ' selected' : ''}>החדשה ראשונה</option><option value="priority"${leadSort === 'priority' ? ' selected' : ''}>לפי עדיפות</option></select></div></div>
   <p id="leads-status" class="admin-status" role="status">טוענים…</p><section id="lead-list" aria-label="רשימת פניות"></section>`;
  let timer;
  $('#lead-q').oninput = (e) => { clearTimeout(timer); timer = setTimeout(() => { leadFilters.q = e.target.value.trim(); loadLeads(); }, 250); };
  $('#lead-type').onchange = (e) => { leadFilters.type = e.target.value; loadLeads(); };
  $('#lead-sort').onchange = (e) => { leadSort = e.target.value; loadLeads(); };
  await loadLeads();
}
const leadQuery = () => new URLSearchParams(Object.entries(leadFilters).filter(([, v]) => v)).toString();
async function loadLeads() {
  const list = $('#lead-list'), out = $('#leads-status');
  if (!list) return;
  $('#csv').href = '/api/admin/leads.csv?' + leadQuery();
  try {
    const data = await api('GET', '/api/admin/leads?' + leadQuery());
    $('#status-chips').innerHTML = [['', 'הכול', data.counts.all], ...Object.entries(LEAD_STATUS).map(([k, v]) => [k, v, data.counts[k]])]
      .map(([k, v, n]) => `<button type="button" data-filter="${k}" aria-pressed="${leadFilters.status === k}">${v} <b>${n}</b></button>`).join('');
    $$('#status-chips button').forEach((b) => b.onclick = () => { leadFilters.status = b.dataset.filter; loadLeads(); });
    status(out, data.counts.all ? `${data.total} פניות מוצגות, החדשה ראשונה.${data.storage === 'file' ? ' (אחסון מקומי)' : ''}` : 'אין עדיין פניות.');
    const leads = leadSort === 'priority' ? sortByPriority(data.leads) : data.leads;
    leadById = new Map(leads.map((l) => [l.id, l]));
    list.innerHTML = leads.length ? leads.map(leadCard).join('') : data.counts.all ? '<p class="empty-note">אין פניות שמתאימות לסינון.</p>' : '';
    wireLeads(list);
  } catch (error) { if (error.status !== 401) status(out, 'לא הצלחנו לטעון את הפניות. ' + failText(error), 'error'); }
}
function wireLeads(list) {
  $$('[data-lead]', list).forEach((card) => {
    const id = card.dataset.lead, out = $('.admin-status', card);
    wireLeadAi(card, leadById.get(id));
    $('[data-status]', card).onchange = async (e) => {
      try { await api('PATCH', `/api/admin/leads/${encodeURIComponent(id)}`, { status: e.target.value }); status(out, `הסטטוס עודכן ל„${LEAD_STATUS[e.target.value]}”.`, 'ok'); e.target.closest('.status-pick').className = `status-pick status-${e.target.value}`; }
      catch (error) { status(out, failText(error), 'error'); }
    };
    $('[data-note]', card).onsubmit = async (e) => {
      e.preventDefault();
      const input = $('input', e.target), text = input.value.trim();
      if (!text) return;
      try { const data = await api('PATCH', `/api/admin/leads/${encodeURIComponent(id)}`, { note: text }); input.value = ''; const box = $('.admin-notes', card);
        box.querySelector('ul, p.micro-copy')?.replaceWith(Object.assign(document.createElement('ul'), { innerHTML: data.notes.map((n) => `<li><small>${esc(when(n.at))}</small> ${esc(n.text)}</li>`).join('') })); status(out, 'ההערה נשמרה.', 'ok'); }
      catch (error) { status(out, failText(error), 'error'); }
    };
  });
}

// ---------- Blog ----------
const STATE_LABEL = { draft: 'טיוטה', published: 'מפורסם', scheduled: 'מתוזמן' };
// English version indicator (spec 21 §6): the admin stays Hebrew, the chip tells whether /en/ has an English text.
const enChip = (has) => `<span class="state-chip en-chip" data-en="${has ? 'yes' : 'no'}">${has ? 'EN ✓' : 'אין אנגלית'}</span>`;
const openEnErrors = (form, fields = {}) => { if (Object.keys(fields).some((k) => k.startsWith('en.'))) $$('details.en-box', form).forEach((d) => { if (d.querySelector('[aria-invalid]')) d.open = true; }); };
async function blogTab(sub) {
  if (sub === 'new') return postEditor(null);
  if (sub) return postEditor(sub);
  const p = panel();
  p.innerHTML = `<div class="admin-head"><h1>בלוג</h1><a class="button yellow" href="#blog/new">פוסט חדש</a></div><p id="blog-status" class="admin-status" role="status">טוענים…</p><section id="post-list" class="post-list" aria-label="פוסטים"></section>`;
  try {
    const { posts, hidden } = await api('GET', '/api/admin/blog');
    const own = new Set(posts.map((x) => x.slug));
    const rows = [...posts.map((x) => ({ ...x, own: true })), ...builtinPosts().filter((x) => !own.has(x.slug)).map((x) => ({ ...x, own: false }))];
    const today = israelToday();
    $('#post-list').innerHTML = rows.map((x) => {
      const isHidden = hidden.includes(x.slug);
      const chips = [x.builtin ? (x.own ? 'מובנה · נערך' : 'מובנה') : '', isHidden ? 'מוסתר' : STATE_LABEL[postState(x, today)]].filter(Boolean);
      return `<article class="post-row"><div><h2>${esc(x.title)}</h2><p class="micro-copy"><span dir="ltr">/blog/${esc(x.slug)}</span>${x.publishDate ? ' · ' + esc(x.publishDate) : ''}${x.updatedAt ? ' · עודכן ' + esc(when(x.updatedAt)) : ''}</p>
        <p class="chips">${chips.map((c) => `<span class="state-chip" data-state="${esc(c)}">${esc(c)}</span>`).join('')}${enChip(Boolean(x.en?.title))}</p></div>
        <div class="row-actions"><a class="button secondary" href="#blog/${esc(x.slug)}">עריכה</a>${isHidden ? `<button class="button secondary" type="button" data-unhide="${esc(x.slug)}">החזרה לאתר</button>` : ''}${!x.own || x.status === 'published' ? `<a class="button secondary" href="/#/blog/${esc(x.slug)}" target="_blank" rel="noopener">צפייה</a>` : ''}</div></article>`;
    }).join('');
    status($('#blog-status'), `${rows.length} פוסטים (${posts.length} נערכו כאן).`);
    $$('[data-unhide]').forEach((b) => b.onclick = async () => { try { await api('POST', `/api/admin/blog/${b.dataset.unhide}/unhide`, {}); blogTab(''); } catch (error) { status($('#blog-status'), failText(error), 'error'); } });
  } catch (error) { if (error.status !== 401) status($('#blog-status'), 'לא הצלחנו לטעון את הבלוג. ' + failText(error), 'error'); }
}

// Shrinks an uploaded picture to ≤1200px JPEG so it fits the KV size limit.
async function compressImage(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('אפשר להעלות JPEG, PNG או WebP בלבד.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / bitmap.width), canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.82, 0.7, 0.55, 0.4]) { const url = canvas.toDataURL('image/jpeg', quality); if (url.length <= LIMITS.coverData) return url; }
  throw new Error('התמונה גדולה מדי גם אחרי הקטנה. נסו תמונה אחרת.');
}

async function postEditor(slug) {
  const p = panel();
  p.innerHTML = '<p class="admin-status" role="status">טוענים…</p>';
  let post = null, isNew = !slug, builtinSource = slug && BUILTIN_SLUGS.includes(slug) ? builtinPosts().find((x) => x.slug === slug) : null;
  if (slug) {
    try { post = (await api('GET', `/api/admin/blog/${encodeURIComponent(slug)}`)).post; }
    catch (error) { if (error.status === 401) return; if (error.status !== 404) { p.innerHTML = `<p class="admin-status" data-kind="error">${esc(failText(error))}</p>`; return; } }
    if (!post && !builtinSource) { p.innerHTML = '<p class="admin-status" data-kind="error">הפוסט לא נמצא.</p><a class="button secondary" href="#blog">חזרה לרשימה</a>'; return; }
  }
  const edited = Boolean(post), base = post || builtinSource || { title: '', slug: '', category: '', excerpt: '', body: '', tags: [], cover: '', publishDate: israelToday(), status: 'draft', seoTitle: '', seoDescription: '' };
  let coverData;
  p.innerHTML = `<div class="admin-head"><h1>${isNew ? 'פוסט חדש' : 'עריכת פוסט'}</h1><a class="button secondary" href="#blog">→ לרשימה</a></div>
   ${builtinSource && !edited ? '<p class="soft-notice-inline">זה מדריך מובנה. השמירה הראשונה יוצרת עותק שאפשר לערוך; את המקור אפשר תמיד להחזיר.</p>' : ''}
   <form id="post-form" class="admin-form" novalidate>
    <div class="form-errors" role="alert"></div>
    <div class="admin-grid">
     <div class="lead-field wide"><label for="f-title">כותרת *</label><input id="f-title" data-key="title" maxlength="${LIMITS.title}" required value="${esc(base.title)}"></div>
     <div class="lead-field"><label for="f-slug">כתובת (slug)</label><input id="f-slug" data-key="slug" dir="ltr" maxlength="60" value="${esc(slug || '')}" ${isNew ? '' : 'readonly'} aria-describedby="slug-hint"><p class="lead-hint" id="slug-hint">${isNew ? 'אותיות לטיניות קטנות, ספרות ומקפים. נקבעת בשמירה הראשונה.' : 'הכתובת קבועה.'}</p></div>
     <div class="lead-field"><label for="f-category">קטגוריה</label><input id="f-category" data-key="category" maxlength="${LIMITS.category}" value="${esc(base.category)}"></div>
     <div class="lead-field"><label for="f-date">תאריך פרסום</label><input id="f-date" data-key="publishDate" type="date" value="${esc(base.publishDate || '')}"></div>
     <div class="lead-field"><label for="f-tags">תגיות (מופרדות בפסיק)</label><input id="f-tags" data-key="tags" value="${esc((base.tags || []).join(', '))}"></div>
    </div>
    <fieldset class="cover-box"><legend>תמונת שער</legend>
     <img id="cover-preview" alt="" ${base.cover ? `src="${esc(base.cover)}"` : 'hidden'}>
     <div class="lead-field"><label for="f-cover">קישור לתמונה (https://)</label><input id="f-cover" data-key="cover" dir="ltr" maxlength="${LIMITS.cover}" value="${esc(base.cover || '')}"></div>
     <div class="lead-field"><label for="f-file">או העלאת קובץ (מוקטן אוטומטית)</label><input id="f-file" data-key="coverData" type="file" accept="image/jpeg,image/png,image/webp"></div>
    </fieldset>
    <div class="lead-field"><label for="f-excerpt">תקציר</label><textarea id="f-excerpt" data-key="excerpt" maxlength="${LIMITS.excerpt}" rows="2">${esc(base.excerpt)}</textarea></div>
    <div class="md-split"><div class="lead-field"><label for="f-body">גוף הפוסט (Markdown) *</label><textarea id="f-body" data-key="body" rows="18" maxlength="${LIMITS.body}">${esc(base.body)}</textarea>
      <p class="lead-hint">## כותרת · **מודגש** · *נטוי* · [קישור](https://…) · - רשימה · &gt; ציטוט · ![תיאור](https://…)</p></div>
     <section class="md-preview" aria-label="תצוגה מקדימה"><span class="eyebrow">תצוגה מקדימה</span><div class="article-body cms-body" id="preview"></div></section></div>
    <details class="seo-box en-box"><summary>אנגלית (אופציונלי) ${enChip(Boolean(base.en?.title))}</summary>
     <p class="lead-hint">מוצג בגרסה האנגלית של האתר (/en/). בלי כותרת וגוף באנגלית הפוסט מוצג שם בעברית.</p>
     <div class="admin-grid" dir="ltr">
      <div class="lead-field wide"><label for="f-en-title">Title</label><input id="f-en-title" data-key="en.title" maxlength="${LIMITS.title}" value="${esc(base.en?.title || '')}"></div>
      <div class="lead-field"><label for="f-en-category">Category</label><input id="f-en-category" data-key="en.category" maxlength="${LIMITS.category}" value="${esc(base.en?.category || '')}"></div>
      <div class="lead-field"><label for="f-en-tags">Tags (comma separated)</label><input id="f-en-tags" data-key="en.tags" value="${esc((base.en?.tags || []).join(', '))}"></div>
     </div>
     <div class="lead-field" dir="ltr"><label for="f-en-excerpt">Excerpt</label><textarea id="f-en-excerpt" data-key="en.excerpt" maxlength="${LIMITS.excerpt}" rows="2">${esc(base.en?.excerpt || '')}</textarea></div>
     <div class="lead-field" dir="ltr"><label for="f-en-body">Body (Markdown)</label><textarea id="f-en-body" data-key="en.body" rows="12" maxlength="${LIMITS.body}">${esc(base.en?.body || '')}</textarea></div>
     <div class="admin-grid" dir="ltr">
      <div class="lead-field"><label for="f-en-seo-title">SEO title</label><input id="f-en-seo-title" data-key="en.seoTitle" maxlength="${LIMITS.seoTitle}" value="${esc(base.en?.seoTitle || '')}"></div>
      <div class="lead-field"><label for="f-en-seo-desc">SEO description</label><textarea id="f-en-seo-desc" data-key="en.seoDescription" maxlength="${LIMITS.seoDescription}" rows="2">${esc(base.en?.seoDescription || '')}</textarea></div>
     </div></details>
    <details class="seo-box"${base.seoTitle || base.seoDescription ? ' open' : ''}><summary>קידום בגוגל (SEO)</summary>
     <div class="lead-field"><label for="f-seo-title">כותרת לגוגל</label><input id="f-seo-title" data-key="seoTitle" maxlength="${LIMITS.seoTitle}" value="${esc(base.seoTitle || '')}"><p class="lead-hint">עד ${LIMITS.seoTitle} תווים. ריק = כותרת הפוסט.</p></div>
     <div class="lead-field"><label for="f-seo-desc">תיאור לגוגל</label><textarea id="f-seo-desc" data-key="seoDescription" maxlength="${LIMITS.seoDescription}" rows="2">${esc(base.seoDescription || '')}</textarea><p class="lead-hint">עד ${LIMITS.seoDescription} תווים. ריק = התקציר.</p></div></details>
    <p class="post-state">מצב: <b id="post-state">${esc(edited || builtinSource ? STATE_LABEL[postState(base)] : 'טיוטה (לא נשמר)')}</b></p>
    <div class="form-actions">
     <button class="button yellow" type="submit" data-save="keep">שמירה</button>
     <button class="button secondary" type="submit" data-save="toggle" id="toggle-publish">${base.status === 'published' ? 'הסרה מפרסום' : 'שמירה ופרסום'}</button>
     ${edited ? `<button class="button secondary" type="button" id="versions-button">גרסאות קודמות</button>` : ''}
     ${edited && builtinSource ? '<button class="button secondary danger" type="button" id="reset-builtin">חזרה לנוסח המקורי</button>' : ''}
     ${builtinSource ? '<button class="button secondary danger" type="button" id="hide-builtin">הסתרה מהאתר</button>' : ''}
     ${edited && !builtinSource ? '<button class="button secondary danger" type="button" id="delete-post">מחיקה</button>' : ''}
    </div>
    <p id="post-status" class="admin-status" role="status"></p>
    <section id="versions" hidden></section>
   </form>`;
  const form = $('#post-form'), out = $('#post-status');
  mountBlogAssistant(form);
  const preview = () => { $('#preview').innerHTML = renderMarkdown($('#f-body').value) || '<p class="micro-copy">הגוף ריק.</p>'; };
  preview();
  form.addEventListener('input', (e) => { dirty = true; if (e.target.id === 'f-body') preview(); if (e.target.id === 'f-cover' && !coverData) { const v = e.target.value.trim(); $('#cover-preview').hidden = !/^https:\/\//.test(v) && !v.startsWith('/'); if (!$('#cover-preview').hidden) $('#cover-preview').src = v; } });
  if (isNew) $('#f-title').addEventListener('change', () => { if (!$('#f-slug').value) $('#f-slug').value = slugFromTitle($('#f-title').value); });
  $('#f-file').onchange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    status(out, 'מכינים את התמונה…');
    try { coverData = await compressImage(file); $('#cover-preview').src = coverData; $('#cover-preview').hidden = false; status(out, `התמונה מוכנה (${Math.round(coverData.length / 1024)}KB). היא תישמר עם הפוסט.`, 'ok'); dirty = true; }
    catch (error) { coverData = undefined; e.target.value = ''; status(out, error.message, 'error'); }
  };
  let current = base;
  form.onsubmit = async (e) => {
    e.preventDefault();
    const toggle = e.submitter?.dataset.save === 'toggle';
    const targetSlug = isNew ? ($('#f-slug').value.trim() || slugFromTitle($('#f-title').value)) : slug;
    const input = { title: $('#f-title').value, category: $('#f-category').value, publishDate: $('#f-date').value, tags: $('#f-tags').value, cover: coverData ? '' : $('#f-cover').value, excerpt: $('#f-excerpt').value, body: $('#f-body').value,
      seoTitle: $('#f-seo-title').value, seoDescription: $('#f-seo-desc').value,
      en: { title: $('#f-en-title').value, category: $('#f-en-category').value, tags: $('#f-en-tags').value, excerpt: $('#f-en-excerpt').value, body: $('#f-en-body').value, seoTitle: $('#f-en-seo-title').value, seoDescription: $('#f-en-seo-desc').value }, status: toggle ? (current.status === 'published' ? 'draft' : 'published') : (edited || builtinSource ? current.status : 'draft'), builtin: Boolean(builtinSource) };
    const local = normalizePost(input, targetSlug);
    if (!local.post) { showErrors(form, local.errors); openEnErrors(form, local.errors); status(out, 'יש שדות לתיקון.', 'error'); return; }
    showErrors(form, {});
    status(out, 'שומרים…');
    try {
      const saved = (await api('PUT', `/api/admin/blog/${encodeURIComponent(targetSlug)}`, { ...local.post, create: isNew, ...(coverData ? { coverData } : {}) })).post;
      dirty = false;
      if (isNew) { location.hash = `blog/${saved.slug}`; return; }
      current = saved; coverData = undefined;
      $('#post-state').textContent = STATE_LABEL[postState(saved)]; $('#toggle-publish').textContent = saved.status === 'published' ? 'הסרה מפרסום' : 'שמירה ופרסום';
      if (saved.cover) $('#f-cover').value = saved.cover;
      if (!edited) { postEditor(slug); return; }
      status(out, toggle ? (saved.status === 'published' ? (postState(saved) === 'scheduled' ? `נשמר. יתפרסם ב־${saved.publishDate}.` : 'פורסם באתר.') : 'הוסר מפרסום. הפוסט נשמר כטיוטה.') : 'נשמר.', 'ok');
    } catch (error) { if (error.status === 401) return; if (error.data?.fields) showErrors(form, error.data.fields); status(out, error.status === 409 ? 'הכתובת כבר בשימוש. בחרו כתובת אחרת.' : failText(error), 'error'); }
  };
  const remove = async (query, question, done) => {
    if (!confirm(question)) return;
    try { await api('DELETE', `/api/admin/blog/${encodeURIComponent(slug)}${query}`); dirty = false; status(out, done, 'ok'); location.hash = 'blog'; }
    catch (error) { status(out, failText(error), 'error'); }
  };
  $('#delete-post')?.addEventListener('click', () => remove('', 'למחוק את הפוסט? אפשר לשחזר אותו מהגרסאות רק דרך התמיכה.', 'הפוסט נמחק.'));
  $('#reset-builtin')?.addEventListener('click', () => remove('', 'לחזור לנוסח המקורי? השינויים שלכם יימחקו.', 'חזרנו לנוסח המקורי.'));
  $('#hide-builtin')?.addEventListener('click', () => remove('?hide=1', 'להסתיר את המדריך מהאתר? אפשר להחזיר אותו מרשימת הפוסטים.', 'המדריך הוסתר.'));
  $('#versions-button')?.addEventListener('click', () => versions(`/api/admin/blog/${encodeURIComponent(slug)}`, $('#versions'), () => postEditor(slug), (v) => `${esc(v.title || '')} · ${esc(STATE_LABEL[v.status] || '')}`));
}

async function versions(basePath, box, reload, describe = () => '') {
  box.hidden = false; box.innerHTML = '<p class="admin-status">טוענים גרסאות…</p>';
  try {
    const { versions: list } = await api('GET', `${basePath}/versions`);
    box.innerHTML = `<h2>גרסאות קודמות</h2>${list.length ? `<ol class="version-list">${list.map((v) => `<li><span>${esc(when(v.savedAt))} ${describe(v)}</span><button class="button secondary" type="button" data-restore="${v.index}">שחזור</button></li>`).join('')}</ol>` : '<p class="micro-copy">אין עדיין גרסאות קודמות. כל שמירה שומרת את הקודמת (עד 10).</p>'}`;
    $$('[data-restore]', box).forEach((b) => b.onclick = async () => {
      if (dirty && !confirm('יש שינויים שלא נשמרו. לשחזר בכל זאת?')) return;
      try { await api('POST', `${basePath}/restore`, { index: Number(b.dataset.restore) }); dirty = false; await reload(); status($('#post-status') || $('#site-status'), 'הגרסה שוחזרה.', 'ok'); }
      catch (error) { box.insertAdjacentHTML('beforeend', `<p class="admin-status" data-kind="error">${esc(failText(error))}</p>`); }
    });
  } catch (error) { box.innerHTML = `<p class="admin-status" data-kind="error">${esc(failText(error))}</p>`; }
}

// ---------- Site content ----------
const field = (key, label, value, { area = false, max = 200, hint = '', ltr = false, rows = 3 } = {}) => `<div class="lead-field"><label for="s-${esc(key)}">${label}</label>${area
  ? `<textarea id="s-${esc(key)}" data-key="${esc(key)}" maxlength="${max}" rows="${rows}">${esc(value)}</textarea>`
  : `<input id="s-${esc(key)}" data-key="${esc(key)}" maxlength="${max}" value="${esc(value)}"${ltr ? ' dir="ltr"' : ''}>`}${hint ? `<p class="lead-hint">${hint}</p>` : ''}</div>`;

async function siteTab() {
  const p = panel();
  p.innerHTML = '<p class="admin-status" role="status">טוענים…</p>';
  let stored;
  try { stored = (await api('GET', '/api/admin/site')).site; } catch (error) { if (error.status !== 401) p.innerHTML = `<p class="admin-status" data-kind="error">${esc(failText(error))}</p>`; return; }
  const s = mergeSite(stored), d = SITE_DEFAULTS, en = s.en, de = siteDefaultsEn();
  // English inputs show the built-in English as a placeholder; an empty field keeps using it.
  const enField = (key, label, value, placeholder, opts = {}) => field(key, label, value || '', opts).replace(/(data-key="[^"]*")/, `$1${placeholder ? ` placeholder="${esc(placeholder)}"` : ''}`);
  const faqRows = (s.faqs.length ? s.faqs : builtinFaqs.map(([q, a]) => ({ q, a })));
  const faqRow = (f, i, prefix = 'faqs') => `<li class="faq-row"><div class="lead-field"><label for="s-${prefix}-q-${i}">${prefix === 'faqs' ? 'שאלה' : 'Question'}</label><input id="s-${prefix}-q-${i}" data-faq="q" data-key="${prefix}.${i}.q" maxlength="${LIMITS.faqQ}" value="${esc(f.q)}"></div>
    <div class="lead-field"><label for="s-${prefix}-a-${i}">${prefix === 'faqs' ? 'תשובה' : 'Answer'}</label><textarea id="s-${prefix}-a-${i}" data-faq="a" data-key="${prefix}.${i}.a" maxlength="${LIMITS.faqA}" rows="3">${esc(f.a)}</textarea></div>
    <div class="row-actions"><button type="button" class="button secondary" data-faq-move="-1" aria-label="הזזת השאלה למעלה">↑</button><button type="button" class="button secondary" data-faq-move="1" aria-label="הזזת השאלה למטה">↓</button><button type="button" class="button secondary danger" data-faq-remove>מחיקה</button></div></li>`;
  p.innerHTML = `<div class="admin-head"><h1>תוכן האתר</h1></div>
   <p class="micro-copy">משנים טקסט ולוחצים „שמירה”. השינוי מופיע באתר תוך כדקה. שדה שמוחקים לגמרי חוזר לנוסח המקורי.</p>
   <form id="site-form" class="admin-form" novalidate><div class="form-errors" role="alert"></div>
    <fieldset><legend>דף הבית</legend>${field('hero.title', 'כותרת ראשית', s.hero.title, { max: LIMITS.hero })}${field('hero.subtitle', 'תת־כותרת', s.hero.subtitle, { max: LIMITS.hero * 2 })}</fieldset>
    <fieldset><legend>פרטי קשר</legend><div class="admin-grid">${field('contact.whatsapp', 'וואטסאפ', s.contact.whatsapp, { ltr: true, max: 20, hint: 'ספרות בפורמט בינלאומי, למשל 972501234567' })}${field('contact.phone', 'טלפון', s.contact.phone, { ltr: true, max: 20 })}${field('contact.email', 'מייל', s.contact.email, { ltr: true, max: 120 })}</div></fieldset>
    <fieldset><legend>באנר הודעה בראש האתר</legend><label class="lead-check"><input type="checkbox" id="s-banner-on" data-key="banner.enabled"${s.banner.enabled ? ' checked' : ''}><span>להציג את הבאנר</span></label>
     ${field('banner.text', 'טקסט הבאנר', s.banner.text, { max: LIMITS.banner })}${field('banner.link', 'קישור (לא חובה)', s.banner.link, { ltr: true, max: 300, hint: 'למשל #/tailor-made או https://…' })}</fieldset>
    <fieldset><legend>פוטר</legend>${field('footer.tagline', 'שורת המותג', s.footer.tagline)}${field('footer.blurb', 'משפט קצר', s.footer.blurb)}${field('footer.legal', 'שורת זכויות והבהרה (דפים פנימיים)', s.footer.legal)}${field('footer.note', 'הבהרה בתחתית דף הבית', s.footer.note)}</fieldset>
    <fieldset><legend>שאלות נפוצות (דף „שירות ועזרה” באתר)</legend><p class="lead-hint">התשובות של בוט השירות נערכות בנפרד: <a href="#support/content">שיחות שירות › תשובות הבוט</a>.</p><ol id="faq-list" class="faq-list">${faqRows.map(faqRow).join('')}</ol><button type="button" class="button secondary" id="faq-add">הוספת שאלה</button></fieldset>
    <fieldset><legend>מדריכי יעדים</legend>${trips.map((t) => `<details class="guide-box"><summary>${esc(t.name)}</summary>${GUIDE_FIELDS.map(([k, label]) => field(`guides.${t.id}.${k}`, label, s.guides[t.id]?.[k] || destinationInfo[t.id]?.guide?.[k] || '', { area: true, max: LIMITS.guide, rows: 2 })).join('')}</details>`).join('')}</fieldset>
    <fieldset class="en-site"><legend>אנגלית (אופציונלי) ${enChip(Object.keys(en).length > 0)}</legend>
     <p class="lead-hint">הנוסח לגרסה האנגלית של האתר (/en/). שדה ריק = הנוסח האנגלי המובנה; אם ערכתם את השדה בעברית בלבד, הנוסח העברי שלכם מוצג גם באנגלית.</p>
     <details class="en-box"><summary>דף הבית ${enChip(Boolean(en.hero))}</summary><div dir="ltr">${enField('en.hero.title', 'Headline', en.hero?.title, de.hero.title, { max: LIMITS.hero })}${enField('en.hero.subtitle', 'Subheadline', en.hero?.subtitle, de.hero.subtitle, { max: LIMITS.hero * 2 })}</div></details>
     <details class="en-box"><summary>באנר ${enChip(Boolean(en.banner?.text))}</summary><div dir="ltr">${enField('en.banner.text', 'Banner text', en.banner?.text, '', { max: LIMITS.banner })}</div></details>
     <details class="en-box"><summary>פוטר ${enChip(Boolean(en.footer))}</summary><div dir="ltr">${enField('en.footer.tagline', 'Brand line', en.footer?.tagline, de.footer.tagline)}${enField('en.footer.blurb', 'Short blurb', en.footer?.blurb, de.footer.blurb)}${enField('en.footer.legal', 'Rights & disclaimer line', en.footer?.legal, de.footer.legal)}${enField('en.footer.note', 'Homepage disclaimer', en.footer?.note, de.footer.note)}</div></details>
     <details class="en-box"><summary>שאלות נפוצות ${enChip(Boolean(en.faqs?.length))}</summary><p class="lead-hint">ריק = השאלות הנפוצות המובנות באנגלית (או השאלות שלכם בעברית, אם ערכתם אותן).</p><ol id="en-faq-list" class="faq-list" dir="ltr">${(en.faqs || []).map((f, i) => faqRow(f, i, 'en.faqs')).join('')}</ol><button type="button" class="button secondary" id="en-faq-add">הוספת שאלה באנגלית</button></details>
     <details class="en-box"><summary>מדריכי יעדים ${enChip(Boolean(en.guides))}</summary>${trips.map((t) => `<details class="guide-box"><summary>${esc(t.name)} ${enChip(Boolean(en.guides?.[t.id]))}</summary><div dir="ltr">${GUIDE_FIELDS.map(([k, label]) => enField(`en.guides.${t.id}.${k}`, label, en.guides?.[t.id]?.[k], '', { area: true, max: LIMITS.guide, rows: 2 })).join('')}</div></details>`).join('')}</details>
    </fieldset>
    <div class="form-actions sticky-actions"><button class="button yellow" type="submit">שמירה</button><button class="button secondary" type="button" id="site-versions">גרסאות קודמות</button></div>
    <p id="site-status" class="admin-status" role="status"></p><section id="versions" hidden></section>
   </form>`;
  const form = $('#site-form'), list = $('#faq-list'), enList = $('#en-faq-list');
  const renumberList = (ol, prefix) => $$('.faq-row', ol).forEach((li, i) => { $('[data-faq=q]', li).dataset.key = `${prefix}.${i}.q`; $('[data-faq=a]', li).dataset.key = `${prefix}.${i}.a`; });
  const renumber = () => { renumberList(list, 'faqs'); renumberList(enList, 'en.faqs'); };
  $('#en-faq-add').onclick = () => { enList.insertAdjacentHTML('beforeend', faqRow({ q: '', a: '' }, `n${Date.now()}`, 'en.faqs')); renumber(); dirty = true; $$('.faq-row', enList).at(-1).querySelector('input').focus(); };
  form.addEventListener('input', () => { dirty = true; });
  $('#faq-add').onclick = () => { list.insertAdjacentHTML('beforeend', faqRow({ q: '', a: '' }, `n${Date.now()}`)); renumber(); dirty = true; $$('.faq-row', list).at(-1).querySelector('input').focus(); };
  [list, enList].forEach((ol) => ol.addEventListener('click', (e) => {
    const li = e.target.closest('.faq-row'); if (!li) return;
    if (e.target.closest('[data-faq-remove]')) { li.remove(); dirty = true; }
    const move = e.target.closest('[data-faq-move]');
    if (move) { const sibling = move.dataset.faqMove === '-1' ? li.previousElementSibling : li.nextElementSibling; if (sibling) { if (move.dataset.faqMove === '-1') sibling.before(li); else sibling.after(li); move.focus(); dirty = true; } }
    renumber();
  }));
  // Only what differs from the built-in text is stored, so future copy fixes in the code still reach untouched fields.
  const collect = () => {
    const value = (key) => form.querySelector(`[data-key="${key}"]`).value.trim();
    const diff = (key, def) => { const v = value(key); return v === def ? '' : v; };
    const out = { hero: { title: diff('hero.title', d.hero.title), subtitle: diff('hero.subtitle', d.hero.subtitle) },
      contact: { whatsapp: diff('contact.whatsapp', d.contact.whatsapp), phone: diff('contact.phone', d.contact.phone), email: diff('contact.email', d.contact.email) },
      footer: Object.fromEntries(['tagline', 'blurb', 'legal', 'note'].map((k) => [k, diff(`footer.${k}`, d.footer[k])])),
      banner: { enabled: $('#s-banner-on').checked, text: value('banner.text'), link: value('banner.link') }, guides: {} };
    const faqList = $$('.faq-row', list).map((li) => ({ q: $('[data-faq=q]', li).value.trim(), a: $('[data-faq=a]', li).value.trim() })).filter((f) => f.q || f.a);
    out.faqs = JSON.stringify(faqList) === JSON.stringify(builtinFaqs.map(([q, a]) => ({ q, a }))) ? [] : faqList;
    for (const t of trips) for (const [k] of GUIDE_FIELDS) { const v = diff(`guides.${t.id}.${k}`, destinationInfo[t.id]?.guide?.[k] || ''); if (v) (out.guides[t.id] ||= {})[k] = v; }
    // English (spec 21): only what was written and differs from the built-in English.
    out.en = { hero: { title: diff('en.hero.title', de.hero.title), subtitle: diff('en.hero.subtitle', de.hero.subtitle) },
      footer: Object.fromEntries(['tagline', 'blurb', 'legal', 'note'].map((k) => [k, diff(`en.footer.${k}`, de.footer[k])])), banner: { text: value('en.banner.text') },
      faqs: $$('.faq-row', enList).map((li) => ({ q: $('[data-faq=q]', li).value.trim(), a: $('[data-faq=a]', li).value.trim() })).filter((f) => f.q || f.a), guides: {} };
    for (const t of trips) for (const [k] of GUIDE_FIELDS) { const v = value(`en.guides.${t.id}.${k}`); if (v) (out.en.guides[t.id] ||= {})[k] = v; }
    return out;
  };
  form.onsubmit = async (e) => {
    e.preventDefault();
    const out = $('#site-status'), input = collect(), local = normalizeSite(input);
    if (!local.site) { showErrors(form, local.errors); openEnErrors(form, local.errors); status(out, 'יש שדות לתיקון.', 'error'); return; }
    showErrors(form, {}); status(out, 'שומרים…');
    try { await api('PUT', '/api/admin/site', input); dirty = false; status(out, 'נשמר. השינויים יופיעו באתר תוך כדקה.', 'ok'); }
    catch (error) { if (error.status === 401) return; if (error.data?.fields) showErrors(form, error.data.fields); status(out, failText(error), 'error'); }
  };
  $('#site-versions').onclick = () => versions('/api/admin/site', $('#versions'), () => siteTab());
}

// ---------- FX override (ILS pricing module: GET /api/fx, PUT /api/fx/override) ----------
async function fxTab() {
  const p = panel();
  p.innerHTML = `<div class="admin-head"><h1>שער מטבע</h1></div><p class="micro-copy">שער ידני גובר על השער האוטומטי של העברות והמחאות – מכירה. ₪ ליחידה אחת של המטבע.</p>
   <section id="fx-now" class="admin-card-lite"><p class="admin-status" role="status">טוענים את השער הנוכחי…</p></section>
   <form id="fx-form" class="admin-form" novalidate><div class="form-errors" role="alert"></div><div class="admin-grid">
    <div class="lead-field"><label for="fx-usd">דולר (USD)</label><input id="fx-usd" data-key="rates.USD" inputmode="decimal" dir="ltr" placeholder="למשל 3.72"></div>
    <div class="lead-field"><label for="fx-eur">אירו (EUR)</label><input id="fx-eur" data-key="rates.EUR" inputmode="decimal" dir="ltr" placeholder="למשל 4.05"></div>
    <div class="lead-field"><label for="fx-note">הערה (לא חובה)</label><input id="fx-note" data-key="note" maxlength="200"></div>
    <div class="lead-field"><label for="fx-exp">בתוקף עד (לא חובה)</label><input id="fx-exp" data-key="expiresAt" type="date"></div></div>
    <div class="form-actions"><button class="button yellow" type="submit">שמירת שער ידני</button><button class="button secondary danger" type="button" id="fx-clear">ביטול השער הידני</button></div>
    <p id="fx-status" class="admin-status" role="status"></p></form>`;
  const out = $('#fx-status');
  const unavailable = () => { $('#fx-now').innerHTML = '<p class="admin-status" data-kind="warn">היכולת עוד לא זמינה בשרת הזה (מודול השערים לא הותקן).</p>'; $('#fx-form').hidden = true; };
  const show = (fx) => {
    const rates = fx?.rates || {};
    $('#fx-now').innerHTML = `<dl class="fx-now">${['USD', 'EUR', 'GBP'].filter((c) => rates[c]).map((c) => `<dt>${c}</dt><dd dir="ltr">₪${esc(Number(rates[c]).toFixed(4))}${(fx.overridden || []).includes(c) ? ' <b>(ידני)</b>' : ''}</dd>`).join('') || '<dt>אין שער</dt><dd>—</dd>'}</dl><p class="micro-copy">${fx?.asOf ? `נכון ל־${esc(fx.asOf)}` : ''}${fx?.isOverride ? ' · שער ידני בתוקף' : ''}${fx?.stale ? ' · ייתכן שהשער ישן' : ''}</p>`;
    for (const c of ['USD', 'EUR']) if ((fx?.overridden || []).includes(c)) $(`#fx-${c.toLowerCase()}`).value = rates[c];
  };
  try { const r = await fetch('/api/fx', { cache: 'no-store' }); if (r.status === 404) return unavailable(); show(await r.json().catch(() => null)); }
  catch { status($('#fx-now .admin-status'), 'לא הצלחנו לקרוא את השער.', 'error'); }
  const put = async (body, done) => {
    status(out, 'שומרים…');
    try {
      const r = await fetch('/api/fx/override', { method: body ? 'PUT' : 'DELETE', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      const data = await r.json().catch(() => null);
      if (r.status === 404) return unavailable();
      if (r.status === 401) return showLogin('החיבור הסתיים. היכנסו שוב.');
      if (!r.ok) { if (data?.fields) showErrors($('#fx-form'), data.fields); status(out, r.status === 429 ? 'יותר מדי בקשות. נסו שוב בעוד דקה.' : 'השער לא נשמר. בדקו את הערכים.', 'error'); return; }
      show(data); status(out, done, 'ok');
    } catch { status(out, 'אין חיבור לשרת.', 'error'); }
  };
  $('#fx-form').onsubmit = (e) => {
    e.preventDefault();
    const rates = {}, errors = {};
    for (const c of ['USD', 'EUR']) { const raw = $(`#fx-${c.toLowerCase()}`).value.trim().replace(',', '.'); if (!raw) continue; const n = Number(raw); if (!(n >= 0.001 && n <= 100)) errors[`rates.${c}`] = 'מספר בין 0.001 ל־100'; else rates[c] = n; }
    if (!Object.keys(rates).length && !Object.keys(errors).length) errors['rates.USD'] = 'מלאו לפחות מטבע אחד';
    if (Object.keys(errors).length) { showErrors($('#fx-form'), errors); return; }
    showErrors($('#fx-form'), {});
    const exp = $('#fx-exp').value, note = $('#fx-note').value.trim();
    put({ rates, ...(note ? { note } : {}), ...(exp ? { expiresAt: new Date(exp + 'T23:59:59+02:00').toISOString() } : {}) }, 'השער הידני נשמר.');
  };
  $('#fx-clear').onclick = () => { if (confirm('לבטל את השער הידני ולחזור לשער האוטומטי?')) { $('#fx-usd').value = ''; $('#fx-eur').value = ''; put(null, 'השער הידני בוטל. חזרנו לשער האוטומטי.'); } };
}

// ---------- Support escalations (support bot module: GET /api/support/escalations) ----------
const supportNav = (current) => `<nav class="sub-tabs" aria-label="שירות לקוחות"><a href="#support"${current === 'list' ? ' aria-current="page"' : ''}>שיחות שהועברו לנציג</a><a href="#support/content"${current === 'content' ? ' aria-current="page"' : ''}>תשובות הבוט ושעות פעילות</a></nav>`;
async function supportTab(sub) {
  if (sub === 'content') return botContentTab();
  const p = panel();
  p.innerHTML = `<div class="admin-head"><h1>שיחות שירות</h1></div>${supportNav('list')}<p class="micro-copy">שיחות שהבוט העביר לנציג. אחרי שטיפלתם — סמנו „טופל” והבוט יחזור לענות בשיחה.</p>
   <div class="lead-filters" role="group" aria-label="סינון"><button type="button" data-esc="open" aria-pressed="true">פתוחות</button><button type="button" data-esc="" aria-pressed="false">הכול</button></div>
   <p id="esc-status" class="admin-status" role="status">טוענים…</p><section id="esc-list"></section>`;
  let filter = 'open';
  const load = async () => {
    const out = $('#esc-status');
    try {
      const r = await fetch('/api/support/escalations?limit=200' + (filter ? `&status=${filter}` : ''), { credentials: 'same-origin', cache: 'no-store' });
      if (r.status === 404) { status(out, 'היכולת עוד לא זמינה בשרת הזה (בוט השירות לא הותקן).', 'warn'); return; }
      if (r.status === 401) { showLogin('החיבור הסתיים. היכנסו שוב.'); return; }
      if (!r.ok) throw new Error();
      const data = await r.json(), items = Array.isArray(data) ? data : data.escalations || [];
      status(out, items.length ? `${items.length} שיחות${data.open !== undefined ? ` · ${data.open} פתוחות` : ''}.` : 'אין שיחות להצגה.');
      $('#esc-list').innerHTML = items.map((x) => `<article class="lead-card" data-esc-id="${esc(x.id)}"><header><h2>${esc(x.name || 'ללא שם')}</h2><span class="lead-tag">${esc(x.reasonLabel || x.reason || '')}</span><small>${esc(when(x.createdAt))} · ${esc(x.channel === 'whatsapp' ? 'וואטסאפ' : 'אתר')}${x.ref ? ` · <span dir="ltr">${esc(x.ref)}</span>` : ''}</small><span class="state-chip">${x.status === 'handled' ? 'טופל' : 'פתוח'}</span></header>
        <dl>${x.phone ? `<dt>טלפון</dt><dd><a href="tel:${esc(x.phone)}" dir="ltr">${esc(x.phone)}</a></dd>` : ''}${x.summary ? `<dt>סיכום</dt><dd>${esc(x.summary)}</dd>` : ''}</dl>
        ${Array.isArray(x.transcript) && x.transcript.length ? `<details><summary>תמליל (${x.transcript.length})</summary><ol class="transcript">${x.transcript.map((m) => `<li class="from-${esc(m.from)}"><b>${esc({ user: 'לקוח', bot: 'בוט', agent: 'נציג' }[m.from] || m.from)}:</b> ${esc(m.text)}</li>`).join('')}</ol></details>` : ''}
        <div class="lead-actions">${intl(x.phone) ? `<a class="button secondary" href="https://wa.me/${intl(x.phone)}" target="_blank" rel="noopener noreferrer">וואטסאפ</a>` : ''}<button class="button secondary" type="button" data-handle="${x.status === 'handled' ? 'open' : 'handled'}">${x.status === 'handled' ? 'פתיחה מחדש' : 'סימון כטופל'}</button></div></article>`).join('');
      $$('[data-handle]').forEach((b) => b.onclick = async () => {
        const id = b.closest('[data-esc-id]').dataset.escId;
        try { const res = await fetch(`/api/support/escalations/${encodeURIComponent(id)}`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: b.dataset.handle }) }); if (!res.ok) throw new Error(); load(); }
        catch { status(out, 'העדכון לא נשמר.', 'error'); }
      });
    } catch { status(out, 'לא הצלחנו לטעון את השיחות.', 'error'); }
  };
  $$('[data-esc]').forEach((b) => b.onclick = () => { filter = b.dataset.esc; $$('[data-esc]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); load(); });
  await load();
}

// Bot answers + business hours live in the support module's own store (GET/PUT /api/support/content, kv support-content/faq).
const DAY_LABELS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
async function botContentTab() {
  const p = panel();
  p.innerHTML = `<div class="admin-head"><h1>שיחות שירות</h1></div>${supportNav('content')}<p class="admin-status" role="status">טוענים…</p>`;
  let data;
  try {
    const r = await fetch('/api/support/content', { credentials: 'same-origin', cache: 'no-store' });
    if (r.status === 404) { status($('#panel .admin-status'), 'היכולת עוד לא זמינה בשרת הזה (בוט השירות לא הותקן).', 'warn'); return; }
    if (r.status === 401) { showLogin('החיבור הסתיים. היכנסו שוב.'); return; }
    if (!r.ok) throw new Error();
    data = await r.json();
  } catch { status($('#panel .admin-status'), 'לא הצלחנו לטעון את תוכן הבוט.', 'error'); return; }
  const days = data.hours?.days || {};
  p.innerHTML = `<div class="admin-head"><h1>שיחות שירות</h1></div>${supportNav('content')}
   <p class="micro-copy">אלה התשובות שהבוט נותן באתר ובוואטסאפ. אפשר להשתמש ב־{hours}, {phone}, {whatsapp}, {email} — הם יוחלפו בפרטים העדכניים. תשובה שמוחקים לגמרי חוזרת לנוסח המקורי.</p>
   <form id="bot-form" class="admin-form" novalidate><div class="form-errors" role="alert"></div>
    <fieldset><legend>שעות פעילות</legend>
     <div class="lead-field"><label for="h-text">איך השעות מוצגות ללקוחות</label><input id="h-text" maxlength="200" value="${esc(data.hours?.text || '')}"></div>
     <div class="hours-grid">${DAY_LABELS.map((label, d) => { const slot = days[d]; return `<div class="hours-row" data-day="${d}"><strong>${label}</strong>
       <label class="lead-check"><input type="checkbox" data-closed${slot ? '' : ' checked'}><span>סגור</span></label>
       <label><span class="sr-only">פתיחה ביום ${label}</span><input type="time" data-from value="${esc(slot?.[0] || '09:00')}"${slot ? '' : ' disabled'}></label>
       <label><span class="sr-only">סגירה ביום ${label}</span><input type="time" data-to value="${esc(slot?.[1] || '18:00')}"${slot ? '' : ' disabled'}></label></div>`; }).join('')}</div>
    </fieldset>
    <fieldset><legend>תשובות לפי נושא</legend>${(data.intents || []).map((i) => `<div class="lead-field"><label for="a-${esc(i.id)}">${esc(i.title)} <span class="state-chip">${i.default ? 'נוסח מקורי' : 'נערך'}</span></label><textarea id="a-${esc(i.id)}" data-intent="${esc(i.id)}" data-original="${i.default ? '1' : ''}" maxlength="1200" rows="3">${esc(i.answer)}</textarea></div>`).join('')}</fieldset>
    <div class="form-actions sticky-actions"><button class="button yellow" type="submit">שמירה</button></div><p id="bot-status" class="admin-status" role="status"></p></form>`;
  const form = $('#bot-form'), initial = Object.fromEntries((data.intents || []).map((i) => [i.id, i.answer]));
  form.addEventListener('input', () => { dirty = true; });
  form.addEventListener('change', (e) => { if (e.target.matches('[data-closed]')) { const row = e.target.closest('.hours-row'); $$('input[type=time]', row).forEach((x) => { x.disabled = e.target.checked; }); dirty = true; } });
  form.onsubmit = async (e) => {
    e.preventDefault();
    const out = $('#bot-status'), answers = {}, hoursDays = {}, errors = [];
    // Only changed answers are sent; an emptied one goes back to the built-in text.
    $$('[data-intent]', form).forEach((t) => { const v = t.value.trim(); if (v !== initial[t.dataset.intent].trim()) answers[t.dataset.intent] = v; });
    $$('.hours-row', form).forEach((row) => { const d = row.dataset.day; if ($('[data-closed]', row).checked) hoursDays[d] = null; else { const from = $('[data-from]', row).value, to = $('[data-to]', row).value; if (!(from && to && from < to)) errors.push(DAY_LABELS[d]); hoursDays[d] = [from, to]; } });
    if (errors.length) { status(out, `שעות לא תקינות ביום ${errors.join(', ')}: שעת הסגירה צריכה להיות אחרי שעת הפתיחה.`, 'error'); return; }
    status(out, 'שומרים…');
    try {
      const r = await fetch('/api/support/content', { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers, hours: { text: $('#h-text').value.trim(), days: hoursDays } }) });
      if (r.status === 401) { showLogin('החיבור הסתיים. היכנסו שוב.'); return; }
      if (!r.ok) { status(out, r.status === 429 ? 'יותר מדי בקשות. נסו שוב בעוד דקה.' : 'השמירה נכשלה. בדקו את הטקסטים.', 'error'); return; }
      dirty = false; await botContentTab(); status($('#bot-status'), 'נשמר. הבוט עונה מעכשיו בנוסח החדש (עד דקה).', 'ok');
    } catch { status(out, 'אין חיבור לשרת.', 'error'); }
  };
}

// ---------- Start ----------
(async () => {
  try { const r = await fetch('/api/admin/session', { credentials: 'same-origin', cache: 'no-store' }); if (r.ok) return showApp(); showLogin(r.status === 404 ? 'הגישה לניהול לא הוגדרה בשרת (חסר LEADS_ADMIN_TOKEN).' : ''); }
  catch { showLogin('אין חיבור לשרת.'); }
})();
