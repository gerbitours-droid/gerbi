// Owner dashboard → "הזמנות" (spec 25 §6.3): orders list, detail with the full timeline, manual actions,
// reconciliation flags and CSV export. Hebrew only, like the rest of the admin. Every server value is escaped.
import { extraLabel } from './booking-core.mjs';
let api, failText;
export function setupAdminOrders(deps) { ({ api, failText } = deps); }
const $ = (s, root = document) => root.querySelector(s);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const when = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' }); };
const STATUS = { draft: 'טיוטה', details: 'פרטים נשמרו', priced: 'מחיר אומת', price_changed: 'מחיר השתנה', requested: 'בקשה חדשה', in_progress: 'בטיפול', payment_pending: 'ממתין לתשלום', payment_failed: 'תשלום נכשל', payment_authorized: 'מסגרת אושרה', booking: 'מזמין מול הספק', booked: 'הוזמן (PNR)', ticketed: 'הונפק', confirmed: 'מאושר', needs_agent: 'דורש נציג', booking_failed: 'הזמנה נכשלה', voided: 'מסגרת שוחררה', unavailable: 'לא זמין', expired: 'פג תוקף', cancelled: 'בוטל', refund_pending: 'החזר בתהליך', refunded: 'הוחזר' };
const FLAGS = { void_failed: 'שחרור המסגרת נכשל – לשחרר ידנית אצל חברת הסליקה', booking_unknown: 'תוצאת ההזמנה לא ידועה – לבדוק בפורטל הספק לפי clientRef', ticketing_failed: 'ההנפקה נכשלה – להנפיק בפורטל לפני ה־TTL או לבטל', capture_failed: 'החיוב נכשל – הכרטיסים הונפקו', ticketing_unconfirmed: 'תעריף שמונפק אוטומטית – לא התקבלו מספרי כרטיסים; לבדוק בפורטל לפני חיוב', on_request: 'הספק החזיר On Request', price_mismatch: 'מחיר הספק בהזמנה גבוה מהמאושר', payment_mismatch: 'סכום תשלום לא תואם', hold_expiring: 'מסגרת בת 5+ ימים – לחייב/לשחרר', ticketing_deadline: 'מועד ההנפקה מתקרב', cancel_requested: 'הלקוח ביקש ביטול', final_check_failed: 'הבדיקה הסופית נכשלה', found_by_reconcile: 'נמצאה הזמנה אצל הספק', sold_out: 'אזל' };
const MODE = { request: 'בקשות (נציג משלים ידנית)', mock: 'הדגמה – ספק ותשלום מדומים', live: 'חי – הזמנה ותשלום אמיתיים', off: 'כבוי' };
const filters = { status: '', q: '', flagged: false };
const money = (o) => (o.price?.ils ? `₪${Number(o.price.ils).toLocaleString('he-IL')}` : o.price?.total ? `${o.price.total.value} ${esc(o.price.total.currency)}` : '');

export async function ordersTab(sub) {
  const p = $('#panel');
  if (sub) return orderDetail(sub);
  p.innerHTML = `<div class="admin-head"><h1>הזמנות</h1><div class="admin-top-actions"><button class="button secondary" type="button" id="orders-reconcile">בדיקת התאמה עכשיו</button><a class="button secondary" href="/api/orders/admin/export.csv" download>ייצוא CSV</a></div></div>
   <p id="orders-mode" class="admin-status"></p>
   <form class="admin-filters" id="orders-filters"><div class="lead-field"><label for="of-status">מצב</label><select id="of-status"><option value="">הכול</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${filters.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
   <div class="lead-field"><label for="of-q">חיפוש</label><input id="of-q" value="${esc(filters.q)}" placeholder="מספר הזמנה, PNR, שם, טלפון"></div>
   <label class="lead-check"><input type="checkbox" id="of-flagged" ${filters.flagged ? 'checked' : ''}><span>רק מה שדורש טיפול</span></label></form>
   <p id="orders-status" class="admin-status" role="status">טוענים…</p><section id="orders-list" aria-label="רשימת הזמנות"></section>`;
  $('#orders-filters').onsubmit = (e) => e.preventDefault();
  $('#of-status').onchange = (e) => { filters.status = e.target.value; load(); };
  $('#of-q').oninput = (e) => { filters.q = e.target.value; clearTimeout(ordersTab.t); ordersTab.t = setTimeout(load, 250); };
  $('#of-flagged').onchange = (e) => { filters.flagged = e.target.checked; load(); };
  $('#orders-reconcile').onclick = async (e) => { e.currentTarget.disabled = true; try { const r = await api('POST', '/api/orders/admin/reconcile', {}); $('#orders-status').textContent = `נבדקו ${r.checked} · התקדמו ${r.advanced} · פגו ${r.expired} · סומנו ${r.flagged} · נמחקו פרטים ${r.purged}`; await load(false); } catch (error) { $('#orders-status').textContent = failText(error); } finally { e.currentTarget.disabled = false; } };
  await load();
}
async function load(announce = true) {
  const params = new URLSearchParams({ ...(filters.status ? { status: filters.status } : {}), ...(filters.q ? { q: filters.q } : {}), ...(filters.flagged ? { flagged: '1' } : {}) });
  try {
    const data = await api('GET', '/api/orders/admin?' + params);
    $('#orders-mode').innerHTML = `מצב הזמנה באתר: <strong>${esc(MODE[data.mode] || data.mode)}</strong>${data.reason ? ` · ביקשתם <strong>${esc(MODE[data.wanted] || data.wanted)}</strong> אבל ${data.missing?.length ? `חסר: <code dir="ltr">${data.missing.map(esc).join(', ')}</code>` : esc(data.reason)}` : ''}`;
    if (announce) $('#orders-status').textContent = `${data.orders.length} הזמנות`;
    $('#orders-list').innerHTML = data.orders.length ? `<ul class="admin-list">${data.orders.map((o) => `<li class="admin-card-lite"><div><strong><a href="#orders/${esc(o.id)}">${esc(o.ref)}</a></strong> · ${esc(STATUS[o.status] || o.status)} · <bdi dir="ltr">${esc(o.route)}</bdi> · ${esc(o.start)}</div>
      <div class="micro-copy">${esc(o.contact?.name || '—')} · <bdi dir="ltr">${esc(o.contact?.phone || '')}</bdi> · ${money(o)}${o.pnr ? ` · PNR <bdi dir="ltr">${esc(o.pnr)}</bdi>` : ''}${o.insurance ? ' · ביטוח הראל' : ''} · ${esc(when(o.createdAt))}</div>
      ${o.flags.length ? `<div class="admin-flags">${o.flags.map((f) => `<span class="admin-flag">${esc(FLAGS[f] || f)}</span>`).join('')}</div>` : ''}</li>`).join('')}</ul>` : '<p>אין הזמנות.</p>';
  } catch (error) { $('#orders-status').textContent = failText(error); }
}

async function orderDetail(id) {
  const p = $('#panel');
  p.innerHTML = '<p class="admin-status" role="status">טוענים…</p>';
  let order;
  try { order = (await api('GET', `/api/orders/admin/${encodeURIComponent(id)}`)).order; }
  catch (error) { p.innerHTML = `<p class="admin-status">${esc(failText(error))}</p><a href="#orders">חזרה</a>`; return; }
  const pax = (order.passengers || []).map((x) => `<tr><td>${esc(x.ptc)}</td><td dir="ltr">${esc(x.title || '')} ${esc(x.firstName)} ${esc(x.lastName)}</td><td>${esc(x.birthDate || '')}</td><td dir="ltr" data-doc="${esc(x.firstName)} ${esc(x.lastName)}">${x.document ? `${esc(x.document.type)} <span data-doc-number>${esc(x.document.number)}</span> · ${esc(x.document.issuingCountry || '')} · ${esc(x.document.nationality)} · ${esc(x.document.issueDate || '-')} → ${esc(x.document.expiryDate)}` : '—'}</td></tr>`).join('');
  // Extras per traveller, in Hebrew wording (spec 25 §6.2 step 2).
  const extras = (order.extras || []).filter((x) => order.addons?.extras?.[x.bookingCode] !== undefined).map((x) => { const o = x.options.find((y) => y.code === order.addons.extras[x.bookingCode]); const who = order.passengers?.[x.pax]; return o ? `${esc(who ? `${who.firstName} ${who.lastName}` : `נוסע ${x.pax + 1}`)}: ${esc(extraLabel(o.description, 'he').text)} (<bdi dir="ltr">${esc(x.from)}-${esc(x.to)}</bdi>, ${esc(o.price.value)} ${esc(o.price.currency)})` : ''; }).filter(Boolean);
  const act = (action, label, extra = '') => `<button class="button secondary" type="button" data-action="${action}" ${extra}>${label}</button>`;
  p.innerHTML = `<p><a href="#orders">← כל ההזמנות</a></p><div class="admin-head"><h1>הזמנה <bdi dir="ltr">${esc(order.ref)}</bdi></h1><span class="admin-badge">${esc(STATUS[order.status] || order.status)}</span></div>
   ${order.flags.length ? `<div class="admin-flags">${order.flags.map((f) => `<span class="admin-flag">${esc(FLAGS[f] || f)} <button class="text-button" data-action="resolve_flag" data-flag="${esc(f)}">טופל</button></span>`).join('')}</div>` : ''}
   <section class="admin-card-lite"><h2>טיסה</h2><ul>${order.legs.map((l) => `<li dir="ltr">${esc(l.from)} ${esc(l.date)} ${esc(l.time)} → ${esc(l.to)} ${esc(l.arriveTime)} · ${esc(l.carrier)} ${esc(l.flight)}</li>`).join('')}</ul>
    <p>מחיר: <strong>${money(order)}</strong> (${esc(order.price?.total?.value)} ${esc(order.price?.total?.currency)}, שער ${esc(order.price?.rate ?? '-')}) · ${order.autoTicketable ? 'מונפק אוטומטית' : 'הנפקה נפרדת'} · מקור: ${esc(order.source)} · אופן: ${esc(MODE[order.mode] || order.mode)}</p>
    <p class="micro-copy">מגבלות זמן: הצעה עד ${esc(when(order.quote?.timeLimits?.offerExpiration))} · הנפקה עד ${esc(when(order.quote?.timeLimits?.ticketingTimeLimit))} · מסגרת אשראי אצל הספק: ${order.quote?.paymentAvailable ? 'זמינה' : '<strong>לא זמינה</strong>'}</p>
    ${order.quote?.notices?.length ? `<p class="micro-copy">הודעות ספק: ${order.quote.notices.map((n) => esc(n.text)).join(' · ')}</p>` : ''}</section>
   <section class="admin-card-lite"><h2>נוסעים ואיש קשר</h2>${order.piiPurged ? '<p>הפרטים האישיים נמחקו לפי מדיניות השמירה.</p>' : `<table class="ai-table"><thead><tr><th>סוג</th><th>שם</th><th>לידה</th><th>דרכון (מספר · מנפיקה · אזרחות · הנפקה → תוקף)</th></tr></thead><tbody>${pax}</tbody></table>
    ${(order.passengers || []).some((x) => x.document) ? '<p><button class="button secondary" type="button" id="order-docs">הצגת מספרי הדרכון המלאים (נרשם ביומן)</button></p>' : ''}
    <p>${esc(order.contact?.name)} · <bdi dir="ltr">${esc(order.contact?.phone)}</bdi> · <bdi dir="ltr">${esc(order.contact?.email)}</bdi></p>`}
    <p>תוספות: ${extras.join(' · ') || 'אין'}${order.addons?.insurance ? ' · <strong>ביקש הצעת ביטוח הראל</strong>' : ''}${order.hotelRequested ? ' · <strong>ביקש מלון בקליק</strong>' : ''}</p></section>
   <section class="admin-card-lite"><h2>ספק ותשלום</h2><p>PNR: <strong dir="ltr">${esc(order.supplier?.pnr || '—')}</strong> · clientRef <code dir="ltr">${esc(order.supplier?.clientRef || '—')}</code> · מזהה הזמנה אצל הספק <code dir="ltr">${esc(order.supplier?.reservationId || '—')}</code> · כרטיסים: <bdi dir="ltr">${esc((order.supplier?.tickets || []).map((t) => t.number).join(', ') || '—')}</bdi></p>
    <p>תשלום: ${order.payment ? `${esc(order.payment.provider)} · ${esc(order.payment.status)} · ₪${esc(order.payment.amount / 100)} · ${esc(order.payment.installments || 1)} תשלומים · ניסיון ${esc(order.payment.attempt)}` : 'אין (מצב בקשה – הנציג גובה מחוץ לאתר)'}</p></section>
   <section class="admin-card-lite"><h2>פעולות</h2><div class="admin-actions">
    ${act('in_progress', 'סמן בטיפול')}${act('mark_ticketed', 'סמן "הונפק"')}${act('resume', 'המשך אוטומטי (חיוב/הנפקה)')}${act('capture', 'חיוב המסגרת')}${act('void_payment', 'שחרור המסגרת')}${act('refund', 'החזר כספי')}${act('cancel', 'ביטול')}</div>
    <form id="order-confirm" class="admin-filters"><div class="lead-field"><label for="oc-pnr">PNR</label><input id="oc-pnr" dir="ltr" maxlength="8"></div><div class="lead-field"><label for="oc-tickets">מספרי כרטיסים (רווח/פסיק)</label><input id="oc-tickets" dir="ltr"></div><button class="button yellow" type="submit">אישור ידני ושליחת מייל ללקוח</button></form>
    <form id="order-note" class="admin-filters"><div class="lead-field"><label for="on-text">הערה פנימית</label><input id="on-text" maxlength="300"></div><button class="button secondary" type="submit">הוספה</button></form>
    <p id="order-status" class="admin-status" role="status"></p></section>
   <section class="admin-card-lite"><h2>ציר זמן (יומן ביקורת)</h2><ol class="admin-timeline">${order.timeline.map((e) => `<li><time>${esc(when(e.at))}</time> · ${esc(e.by)} · ${e.to ? `${esc(STATUS[e.from] || e.from || '')} → <strong>${esc(STATUS[e.to] || e.to)}</strong>` : esc(e.event)}${e.note ? ` · ${esc(e.note)}` : ''}</li>`).join('')}</ol></section>`;
  const run = async (body, button) => {
    if (button) button.disabled = true;
    try { await api('POST', `/api/orders/admin/${encodeURIComponent(id)}/action`, body); await orderDetail(id); $('#order-status').textContent = 'עודכן.'; }
    catch (error) { $('#order-status').textContent = `${failText(error)} (${esc(error.data?.error || '')})`; if (button) button.disabled = false; }
  };
  p.querySelectorAll('[data-action]').forEach((b) => b.onclick = () => {
    const action = b.dataset.action;
    if (['capture', 'void_payment', 'refund', 'cancel'].includes(action) && !confirm('לבצע? הפעולה עוברת לחברת הסליקה/לספק.')) return;
    const body = { action, ...(b.dataset.flag ? { flag: b.dataset.flag } : {}) };
    if (action === 'refund') { const amount = prompt('סכום להחזר בשקלים (ריק = מלא):'); if (amount === null) return; if (amount) body.amount = Number(amount); }
    if (action === 'mark_ticketed') { const tickets = prompt('מספרי כרטיסים:'); if (tickets === null) return; body.tickets = tickets; }
    run(body, b);
  });
  $('#order-confirm').onsubmit = (e) => { e.preventDefault(); run({ action: 'confirm', pnr: $('#oc-pnr').value, tickets: $('#oc-tickets').value }, e.submitter); };
  const docs = $('#order-docs');
  if (docs) docs.onclick = async () => {
    if (!confirm('להציג את מספרי הדרכון המלאים? הצפייה נרשמת ביומן הביקורת.')) return;
    try { const { documents } = await api('GET', `/api/orders/admin/${encodeURIComponent(id)}/documents`); p.querySelectorAll('[data-doc]').forEach((cell, i) => { const n = cell.querySelector('[data-doc-number]'); if (n && documents[i]?.number) n.textContent = documents[i].number; }); docs.disabled = true; }
    catch (error) { $('#order-status').textContent = failText(error); }
  };
  $('#order-note').onsubmit = (e) => { e.preventDefault(); run({ action: 'note', note: $('#on-text').value }, e.submitter); };
}
