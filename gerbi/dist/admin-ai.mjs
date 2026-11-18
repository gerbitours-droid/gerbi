// Owner-side AI (spec 22 §4.4–4.6, §6): lead priority badge + brief + WhatsApp draft, blog writing assistant,
// daily digest, AI usage/cost view and per-feature kill switches. Every model text is escaped or set as textContent;
// nothing is ever sent to a customer from here — drafts open in WhatsApp for the owner to send.
import { scoreLead, PRIORITY_LABEL, fillName } from './lead-score.mjs';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
let api = null, failText = (e) => e.message;
export function setupAdminAi(deps) { ({ api, failText } = deps); }
const say = (el, text, kind = '') => { if (el) { el.textContent = text; el.dataset.kind = kind; } };
const intl = (phone) => (/^0\d{8,9}$/.test(phone || '') ? '972' + phone.slice(1) : '');
const INTENT_LABEL = { ready_to_book: 'מוכן/ה להזמין', planning: 'בשלב התכנון', price_check: 'בודק/ת מחירים', question: 'שאלה', complaint: 'תלונה', support_existing: 'שירות להזמנה קיימת', unclear: 'לא ברור' };
const BLOCKED = { env_disabled: 'כבוי בהגדרות השרת', switched_off: 'כבוי', no_provider: 'אין מפתח ספק AI — פועל במצב כללים', daily_budget: 'התקרה היומית נוצלה', task_cap: 'הגיע לתקרת הקריאות היומית', '': 'פעיל' };

// ---------- leads ----------
export const priorityOf = (lead) => scoreLead(lead, new Date());
export function priorityChip(lead) {
  const p = priorityOf(lead);
  return `<span class="priority-chip priority-${p.level}" title="${esc(p.reasons.join(' · ') || 'אין נימוקים')}">${esc(PRIORITY_LABEL[p.level])}${p.level === 'done' ? '' : ` · ${p.score}`}</span>`;
}
export const sortByPriority = (leads) => [...leads].sort((a, b) => priorityOf(b).score - priorityOf(a).score || String(b.createdAt).localeCompare(String(a.createdAt)));
export const leadAiHtml = (lead) => `<div class="lead-ai"><button type="button" class="button secondary ai-button" data-ai-lead><img src="/assets/mascot.webp" alt="" width="22" height="22"> תקציר והצעת תשובה</button><div class="lead-ai-panel" hidden></div></div>`;

export function wireLeadAi(card, lead) {
  const button = $('[data-ai-lead]', card), box = $('.lead-ai-panel', card);
  if (!button || !lead) return;
  button.onclick = async () => {
    button.disabled = true; box.hidden = false; box.innerHTML = '<p class="admin-status" role="status">ג׳רבי מסכם…</p>';
    try {
      const r = await api('POST', `/api/admin/ai/lead/${encodeURIComponent(lead.id)}`, {});
      const draft = fillName(r.whatsapp, lead.name), wa = intl(lead.phone);
      box.innerHTML = `<div class="ai-badge-row"><span class="ai-source">${r.source === 'ai' ? 'ג׳רבי AI' : 'לפי כללים (ללא AI)'}</span>${r.intent ? `<span class="state-chip">${esc(INTENT_LABEL[r.intent] || r.intent)}</span>` : ''}<span class="priority-chip priority-${esc(r.priority.level)}">${esc(PRIORITY_LABEL[r.priority.level])} · ${esc(r.priority.score)}</span></div>
        <p class="lead-ai-summary"><strong>בקצרה:</strong> ${esc(r.summary)}</p>
        ${r.priority.reasons.length ? `<p class="micro-copy">למה העדיפות: ${esc(r.priority.reasons.join(' · '))}</p>` : ''}
        ${r.missing?.length ? `<div><strong>מה חסר כדי להציע מחיר</strong><ul>${r.missing.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>` : ''}
        ${r.nextStep ? `<p><strong>הצעד הבא:</strong> ${esc(r.nextStep)}</p>` : ''}
        <div class="lead-field"><label for="wa-${esc(lead.id)}">טיוטת וואטסאפ — עברו וערכו לפני שליחה</label><textarea id="wa-${esc(lead.id)}" rows="6" maxlength="1000">${esc(draft)}</textarea></div>
        <div class="lead-actions">${wa ? '<button type="button" class="button yellow" data-wa-open>פתיחה בוואטסאפ</button>' : ''}<button type="button" class="button secondary" data-wa-copy>העתקה</button></div>
        <p class="micro-copy">שום הודעה לא נשלחת אוטומטית. ${r.source === 'ai' ? 'לספק ה־AI נשלחו פרטי הנסיעה בלבד — בלי שם, טלפון או מייל.' : ''}</p><p class="admin-status wa-status" role="status"></p>`;
      const text = () => $('textarea', box).value, out = $('.wa-status', box);
      $('[data-wa-open]', box)?.addEventListener('click', () => window.open(`https://wa.me/${wa}?text=${encodeURIComponent(text())}`, '_blank', 'noopener'));
      $('[data-wa-copy]', box).onclick = async () => { try { await navigator.clipboard.writeText(text()); say(out, 'הועתק.', 'ok'); } catch { $('textarea', box).select(); say(out, 'סמנו והעתיקו ידנית (Ctrl+C).'); } };
    } catch (error) { if (error.status !== 401) box.innerHTML = `<p class="admin-status" data-kind="error">${esc(failText(error))}</p>`; }
    button.disabled = false;
  };
}

// ---------- blog ----------
export function mountBlogAssistant(form) {
  form.insertAdjacentHTML('afterbegin', `<details class="ai-blog"><summary><img src="/assets/mascot.webp" alt="" width="24" height="24"> עוזר כתיבה (ג׳רבי AI) — טיוטה מנושא</summary>
    <div class="admin-grid"><div class="lead-field wide"><label for="ai-topic">נושא הפוסט</label><input id="ai-topic" maxlength="160" placeholder="למשל: סופ״ש ברומא עם ילדים"></div>
     <div class="lead-field"><label for="ai-kw">מילות מפתח (בפסיקים)</label><input id="ai-kw" maxlength="200" placeholder="רומא עם ילדים, rome-kids"></div>
     <div class="lead-field"><label for="ai-aud">קהל</label><select id="ai-aud"><option value="general">כללי</option><option value="families">משפחות</option><option value="couples">זוגות</option></select></div>
     <div class="lead-field"><label for="ai-len">אורך</label><select id="ai-len"><option value="short">קצר</option><option value="medium" selected>בינוני</option><option value="long">ארוך</option></select></div></div>
    <div class="form-actions"><button type="button" class="button yellow" id="ai-draft">יצירת טיוטה</button><button type="button" class="button secondary" id="ai-outline">רק מבנה (בלי AI)</button></div>
    <p class="admin-status" id="ai-blog-status" role="status"></p><div id="ai-blog-review" hidden></div></details>`);
  const out = $('#ai-blog-status', form), review = $('#ai-blog-review', form);
  let generated = false;
  const fill = (id, value) => { const el = $(id, form); if (el && value !== undefined && value !== null && !el.readOnly) { el.value = Array.isArray(value) ? value.join(', ') : value; el.dispatchEvent(new Event('input', { bubbles: true })); } };
  const run = async (ai) => {
    const topic = $('#ai-topic', form).value.trim();
    if (topic.length < 3) { say(out, 'כתבו נושא לפוסט.', 'error'); $('#ai-topic', form).focus(); return; }
    if ($('#f-body', form).value.trim() && !confirm('לדרוס את הכותרת, התקציר והגוף שכבר כתובים?')) return;
    $$('#ai-draft, #ai-outline', form).forEach((b) => b.disabled = true); say(out, ai ? 'ג׳רבי כותב טיוטה… (עד דקה)' : 'מכינים מבנה…');
    try {
      const d = await api('POST', '/api/admin/ai/blog-draft', { topic, keywords: $('#ai-kw', form).value, audience: $('#ai-aud', form).value, length: $('#ai-len', form).value, ai });
      fill('#f-title', d.title); fill('#f-excerpt', d.excerpt); fill('#f-body', d.body); fill('#f-category', d.category); fill('#f-tags', d.tags);
      fill('#f-seo-title', d.seoTitle); fill('#f-seo-desc', d.seoDescription); if (!$('#f-slug', form).value && d.slug) fill('#f-slug', d.slug);
      const seo = $('.seo-box', form); if (seo) seo.open = true;
      generated = d.source === 'ai';
      review.hidden = false;
      review.innerHTML = `<div class="ai-review"><strong>${generated ? 'נוצר אוטומטית — טיוטה בלבד.' : 'מבנה התחלתי — השלימו את הטקסט.'}</strong> חובה לקרוא, לבדוק כל עובדה ולערוך לפני פרסום.
        ${d.factsToVerify?.length ? `<p>עובדות לבדיקה:</p><ul>${d.factsToVerify.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
        ${generated ? '<label class="lead-check"><input type="checkbox" id="ai-facts-ok"> <span>קראתי ובדקתי את העובדות (נדרש לפני פרסום)</span></label>' : ''}</div>`;
      say(out, generated ? 'הטיוטה בעורך. היא לא נשמרה עדיין — לחצו „שמירה” כדי לשמור כטיוטה.' : 'המבנה בעורך.', 'ok');
    } catch (error) { if (error.status !== 401) say(out, failText(error), 'error'); }
    $$('#ai-draft, #ai-outline', form).forEach((b) => b.disabled = false);
  };
  $('#ai-draft', form).onclick = () => run(true);
  $('#ai-outline', form).onclick = () => run(false);
  // Publishing an AI draft needs the owner's explicit "I checked the facts".
  form.addEventListener('click', (e) => {
    const publish = e.target.closest('#toggle-publish');
    if (!publish || !generated || /הסרה/.test(publish.textContent) || $('#ai-facts-ok', form)?.checked) return;
    e.preventDefault(); e.stopImmediatePropagation();
    say(out, 'לפני פרסום של טיוטת AI סמנו „קראתי ובדקתי את העובדות”.', 'error'); $('#ai-blog-review', form)?.scrollIntoView({ block: 'center' }); $('.ai-blog', form).open = true;
  }, true);
}

// ---------- AI tab ----------
const money = (usd) => `$${Number(usd || 0).toFixed(usd >= 1 ? 2 : 4)}`;
const pairs = (list, empty = 'אין עדיין נתונים') => (list?.length ? `<ul class="ai-pairs">${list.map(([k, n]) => `<li><span>${esc(k)}</span><b>${esc(n)}</b></li>`).join('')}</ul>` : `<p class="micro-copy">${empty}</p>`);
function digestHtml(d) {
  const f = d.facts;
  return `<p class="ai-headline">${esc(d.headline)}</p><p class="micro-copy">${d.source === 'ai' ? 'ניתוח ג׳רבי AI על בסיס מספרים מצטברים בלבד' : 'לפי כללים (ללא AI)'}</p>
   ${d.bullets?.length ? `<ul class="ai-bullets">${d.bullets.map((b) => `<li data-kind="${esc(b.kind)}">${esc(b.text)}</li>`).join('')}</ul>` : ''}
   <h3>מה לעשות היום</h3><ol class="ai-actions">${(d.actions || []).map((a) => `<li>${esc(a)}</li>`).join('')}</ol>
   <div class="ai-stats"><div><strong>${esc(f.leads.total)}</strong><span>פניות בתקופה</span></div><div><strong>${esc(f.leads.waitingOver24h)}</strong><span>מחכות מעל יממה</span></div><div><strong>${esc(f.leads.highPriorityOpen)}</strong><span>פתוחות בעדיפות גבוהה</span></div><div><strong>${esc(f.searches.total)}</strong><span>חיפושי טיסות</span></div><div><strong>${esc(f.searches.noResults)}</strong><span>חיפושים בלי תוצאות</span></div></div>
   <div class="ai-columns"><section><h3>יעדים בפניות</h3>${pairs(f.leads.topDestinations)}</section><section><h3>מסלולים בחיפוש</h3>${pairs(f.searches.topRoutes)}</section><section><h3>חודשי יציאה</h3>${pairs(f.searches.topMonths)}</section></div>`;
}
const FUNNEL_LABEL = { view: 'נכנסו לבונה', submit: 'שלחו בקשה', plan_shown: 'ראו תוכנית', followup: 'המשיכו לשוחח', lead_open: 'פתחו "שלחו לנציג"', lead_sent: 'שלחו פנייה',
  abandon_thinking: 'עזבו בזמן ההמתנה', chip: 'לחצו שינוי מהיר', option_continue: '"נמשיך מפה"', poll_answer: 'ענו בסקר ההמתנה', poll_apply: 'החילו את הסקר', notify_request: 'ביקשו "שלחו לי כשמוכן"',
  resume_shown: 'הוצע להם להמשיך', resume_used: 'חזרו לשיחה שמורה', exit_prompt: 'ראו "רגע לפני שהולכים"', exit_save: 'שמרו ביציאה', exit_send: 'ביקשו שליחה ביציאה', save: 'שמרו', share: 'שיתפו', print: 'הדפיסו' };
function funnelHtml(f) {
  const rows = (f.path || []).map((x) => `<li><span>${esc(FUNNEL_LABEL[x.step] || x.step)}</span><b>${esc(x.count)}</b>${x.ofPrevious === null ? '' : `<small>${esc(x.ofPrevious)}% מהשלב הקודם</small>`}</li>`).join('');
  const side = Object.entries(f.steps || {}).filter(([k]) => !(f.path || []).some((x) => x.step === k)).map(([k, n]) => [FUNNEL_LABEL[k] || k, n]);
  return `<ol class="ai-pairs ai-funnel">${rows}</ol><h3>עוד פעולות</h3>${pairs(side)}`;
}
export async function aiTab() {
  const p = $('#panel');
  p.innerHTML = `<div class="admin-head"><h1>ג׳רבי AI</h1></div><p id="ai-provider" class="soft-notice-inline">טוענים…</p>
   <section class="admin-card ai-section" aria-labelledby="dg-title"><div class="admin-head"><h2 id="dg-title">תמונת מצב</h2>
     <div class="lead-filters" role="group" aria-label="תקופה">${[[1, 'היום'], [7, '7 ימים'], [30, '30 יום']].map(([d, l]) => `<button type="button" data-days="${d}" aria-pressed="${d === 7}">${l}</button>`).join('')}</div>
     <button type="button" class="button yellow" id="dg-ai">ניתוח עם ג׳רבי AI</button></div><div id="digest" role="status" aria-live="polite"><p class="admin-status">טוענים…</p></div></section>
   <section class="admin-card ai-section" aria-labelledby="fn-title"><h2 id="fn-title">משפך בונה החופשות</h2><p class="micro-copy">כמה הגיעו לכל שלב, ואיזה אחוז מהשלב הקודם המשיך. מונים בלבד, בלי פרטים אישיים.</p><div id="funnel"><p class="admin-status">טוענים…</p></div></section>
   <section class="admin-card ai-section" aria-labelledby="use-title"><h2 id="use-title">שימוש, עלות ומתגים</h2><div id="usage"><p class="admin-status">טוענים…</p></div></section>
   <p class="micro-copy">פרטיות: לפני כל קריאה לספק AI מוסרים טלפונים, מיילים, מספרי כרטיס ות״ז; שם הלקוח לא נשלח לעולם. המונים נשמרים בלי תוכן השיחות.</p>`;
  let days = 7;
  const loadDigest = async (ai) => {
    const box = $('#digest'); box.innerHTML = `<p class="admin-status">${ai ? 'ג׳רבי מנתח…' : 'טוענים…'}</p>`;
    try { box.innerHTML = digestHtml(await api(ai ? 'POST' : 'GET', `/api/admin/ai/insights?days=${days}`, ai ? {} : undefined)); }
    catch (error) { if (error.status !== 401) box.innerHTML = `<p class="admin-status" data-kind="error">${esc(failText(error))}</p>`; }
  };
  const loadFunnel = async () => { const box = $('#funnel'); try { box.innerHTML = funnelHtml(await api('GET', `/api/admin/ai/funnel?days=${days}`)); } catch (error) { if (error.status !== 401) box.innerHTML = `<p class="admin-status" data-kind="error">${esc(failText(error))}</p>`; } };
  $$('[data-days]').forEach((b) => b.onclick = () => { days = Number(b.dataset.days); $$('[data-days]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); loadDigest(false); loadFunnel(); });
  $('#dg-ai').onclick = () => loadDigest(true);
  await Promise.all([loadDigest(false), loadUsage(), loadFunnel()]);
}
async function loadUsage() {
  const box = $('#usage');
  if (!box) return;
  try {
    const u = await api('GET', '/api/admin/ai/usage');
    $('#ai-provider').textContent = u.configured ? `פעיל דרך ${u.providers.join(' ← ')}. כל פיצ׳ר עובד גם בלי AI, ונופל לכללים בתקלה או בחריגה מהתקרה.` : 'אין עדיין מפתח לספק AI. הכול עובד במצב כללים; הוספת ANTHROPIC_API_KEY בשרת מדליקה את הפיצ׳רים.';
    const insights = u.tasks.find((t) => t.id === 'insights'); if (insights && insights.blocked) { $('#dg-ai').disabled = true; $('#dg-ai').title = BLOCKED[insights.blocked] || insights.blocked; }
    const pct = Math.min(100, Math.round((u.budget.usdToday / u.budget.usdCap) * 100));
    const locked = new Set(u.envDisabled);
    box.innerHTML = `<div class="ai-budget"><span>היום: ${money(u.budget.usdToday)} מתוך תקרה של ${money(u.budget.usdCap)}</span><div class="ai-meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="ניצול התקרה היומית"><i style="width:${pct}%"></i></div></div>
     <label class="lead-check ai-master"><input type="checkbox" data-flag="all" ${u.switchedOff.includes('all') ? '' : 'checked'} ${locked.has('all') ? 'disabled' : ''}> <span>כל פיצ׳רי ה־AI${locked.has('all') ? ' (כבוי בהגדרות השרת)' : ''}</span></label>
     <div class="table-scroll"><table class="ai-table"><thead><tr><th>פיצ׳ר</th><th>קהל</th><th>מודל</th><th>קריאות</th><th>מהמטמון</th><th>נדחו / שגיאות</th><th>טוקנים</th><th>עלות</th><th>מצב</th></tr></thead><tbody>
     ${u.tasks.map((t) => `<tr><td>${esc(t.label)}</td><td>${t.audience === 'owner' ? 'בעלים' : 'לקוחות'}</td><td dir="ltr">${esc(t.model || '—')}</td><td>${t.usage.calls}${t.dailyCalls ? `<small> / ${t.dailyCalls}</small>` : ''}</td><td>${t.usage.cacheHits}</td><td>${t.usage.rejected} / ${t.usage.errors}</td><td>${t.usage.inTok + t.usage.outTok}</td><td>${money(t.usage.usd)}</td>
       <td><label class="ai-switch"><input type="checkbox" data-flag="${esc(t.id)}" ${u.switchedOff.includes(t.id) ? '' : 'checked'} ${locked.has(t.id) || locked.has('all') ? 'disabled' : ''} aria-label="${esc(t.label)}"> <span>${esc(BLOCKED[t.blocked] ?? t.blocked)}</span></label></td></tr>`).join('')}</tbody></table></div>
     <h3>7 הימים האחרונים</h3><div class="table-scroll"><table class="ai-table"><thead><tr><th>יום</th><th>קריאות</th><th>מהמטמון</th><th>טוקנים</th><th>עלות</th></tr></thead><tbody>${u.history.map((h) => `<tr><td dir="ltr">${esc(h.day)}</td><td>${h.calls}</td><td>${h.cacheHits}</td><td>${h.tokens}</td><td>${money(h.usd)}</td></tr>`).join('')}</tbody></table></div>
     <p class="admin-status" id="flag-status" role="status"></p>`;
    $$('[data-flag]', box).forEach((input) => input.onchange = async () => {
      try { await api('PUT', '/api/admin/ai/flags', { task: input.dataset.flag, on: input.checked }); say($('#flag-status'), input.checked ? 'הופעל.' : 'כובה. הפיצ׳ר חוזר לכללים תוך חצי דקה בכל השרתים.', 'ok'); loadUsage(); }
      catch (error) { input.checked = !input.checked; say($('#flag-status'), failText(error), 'error'); }
    });
  } catch (error) { if (error.status !== 401) box.innerHTML = `<p class="admin-status" data-kind="error">${esc(failText(error))}</p>`; }
}
