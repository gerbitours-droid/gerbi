// Magic trip builder page (#/build, spec 24): one sentence → a complete trip. The server plans from the catalog;
// flights and hotels arrive separately (live, with their check time); everything else is an estimate or a quote.
import { t, lang, locale, fmtTime, fmtDate, errorText } from './i18n.mjs';
import { toIls, formatIls, formatOriginal, getFx, onFx, loadFx, fxNote } from './fx.mjs';
import { pricePackage, sanitizePackage, packageLeadFields, isStale, selectedFlight, travellers } from './trip-package.mjs';
import { validateLead, CHANNELS, LIMITS, consentText, optionLabel } from './leads-validate.mjs';
import { searchLink } from './saved-flights.mjs';
import { multiLink } from './multi-city-core.mjs';
import { timeVsIsrael } from './timezone.mjs';
import { account, ready as accountReady } from './account.mjs';
import { bookingConfig, startBooking, prefillFromBooking } from './booking-client.mjs';
import { slingTop } from './sling-top.mjs';
import { brochureHtml, loadBrochureData } from './brochure.mjs';
import { fitPackage, upsellOffers, applyUpsell, flightsInBudget } from './budget.mjs';
import { startDidYouKnow, guessCountry, loadFacts } from './did-you-know.mjs';
import { describeChange, airlineName } from './trip-prefs.mjs';
import { mountFloatingComposer, plannerHeaderHtml, plannerLinksHtml, plannerWelcomeHtml, plannerStartersHtml } from './planner-ui.mjs';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const L = (v) => (v && typeof v === 'object' ? v[lang] || v.he || v.en || '' : v ?? '');
const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const $ = (s, root = document) => root.querySelector(s);
const SAVED_KEY = 'gerbi-packages-v1', CURRENT_KEY = 'gerbi-build-current-v1';
const MONTHS = Array.from({ length: 12 }, (_, i) => new Date(2026, i, 15).toLocaleDateString(locale(), { month: 'long' }));

let decor = [];
const stopDecor = () => { decor.forEach((stop) => stop()); decor = []; };
if (typeof window !== 'undefined') addEventListener('hashchange', () => { if (!location.hash.startsWith('#/build')) { stopDecor(); stopProgress(); } });
let pkg = null, view = null, version = 0, lastInput = null, showAllHotels = new Set(), leadOpen = false;
// Expansions (owner 23.11.2026): open "more ideas" days, the AI answers per day / per stay, the full attractions list.
let openDays = new Set(), dayExpand = {}, stayExpand = {}, showAllAttractions = false;
// Attraction / day-trip photos ('<destId>|<English name>' → { src }), generated separately; optional (spec 28 §ב).
let tripImages = {};
import('./catalog/attraction-images.mjs').then((m) => { tripImages = Object.fromEntries(Object.entries(m.default || {}).filter(([, v]) => typeof v?.src === 'string').map(([k, v]) => [k, '/' + v.src.replace(/^\/+/, '')])); if (pkg?.destination && view?.isConnected) paint('upsell'); }).catch(() => {});

// ---- prices
const fare = (price) => { if (!price) return ''; const v = toIls(price, getFx()); return v === null ? formatOriginal(price) : formatIls(v); };
const checked = (iso) => (iso ? t('build.price.checkedAt', { time: fmtTime(iso), date: fmtDate(iso, { day: 'numeric', month: 'short' }) }) : '');
// A shekel range that never breaks across lines or flips around the dash in RTL.
const range = (low, high) => `<span class="bk-range" dir="ltr">${esc(formatIls(low))} – ${esc(formatIls(high))}</span>`;
const kindPill = (kind) => `<span class="bk-kind bk-${kind}">${t(`build.kind.${kind}`)}</span>`;
const longDay = (iso) => (iso ? new Date(iso + 'T12:00:00').toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' }) : '');
const travellersText = (r) => t('build.travellers', { adults: r.adults, children: r.children });

// ---- input
const EXAMPLES = ['build.example.family', 'build.example.couple', 'build.example.friends'];
const EXAMPLE_ICONS = ['people', 'heart', 'globe'];
const CHIPS = [['who', ['couple', 'family', 'friends', 'solo']], ['budget', ['low', 'mid', 'high']], ['style', ['beach', 'city', 'nature', 'ski', 'allInclusive', 'car']]];
function inputHtml(text = '') {
  return `<form id="build-form" class="planner-composer gb-composer" novalidate>
   <label for="build-text" class="sr-only">${t('build.input.label')}</label>
   <textarea id="build-text" name="text" rows="2" dir="auto" maxlength="1500" placeholder="${esc(t('pages.planner.placeholder'))}" aria-describedby="build-hint">${esc(text)}</textarea>
   <button type="submit" class="button blue build-submit" title="${esc(t('build.input.submit'))}" aria-label="${esc(t('build.input.submit'))}">${icon('send')}</button>
  </form>`;
}
function preferencesHtml() {
  return `<details id="gb-prefs" class="planner-details" ${matchMedia('(min-width: 1001px)').matches ? 'open' : ''}>
   <summary><span class="planner-side-icon">${icon('filter')}</span><span>${t('build.prefs')}</span></summary>
   <div class="planner-details-body gb-prefs">
    ${CHIPS.map(([group, ids]) => `<div class="build-chips" role="group" aria-label="${esc(t(`build.chip.${group}`))}"><span class="build-chip-label" aria-hidden="true">${t(`build.chip.${group}`)}</span>${ids.map((id) => `<button type="button" class="build-chip" data-chip="${group}.${id}" aria-pressed="false">${t(`build.chip.${group}.${id}`)}</button>`).join('')}</div>`).join('')}
    <div class="build-chips"><label class="build-chip-label" for="build-month">${t('build.chip.when')}</label><select id="build-month" class="build-month"><option value="">${t('build.chip.when.any')}</option>${MONTHS.map((m, i) => `<option value="${i}">${esc(m)}</option>`).join('')}</select></div>
   </div>
  </details>`;
}
function showBuilderThread() {
  const intake = $('.gb-intake', view);
  if (!intake?.classList.contains('is-welcome')) return;
  intake.classList.remove('is-welcome');
  $('#gb-prefs', view).open = false;
}
function setChatBusy(chat, busy) {
  const send = $('button[type="submit"]', chat);
  send.disabled = busy;
  if (busy) send.setAttribute('aria-busy', 'true');
  else send.removeAttribute('aria-busy');
}
const chipPhrase = (key) => t(`build.chip.${key}.phrase`);
function toggleChip(button) {
  const area = $('#build-text'), phrase = chipPhrase(button.dataset.chip), on = button.getAttribute('aria-pressed') !== 'true';
  // One choice per "who"/"budget" group: pressing one releases the others (and removes their phrase).
  const [group] = button.dataset.chip.split('.');
  if (on && group !== 'style') view.querySelectorAll(`[data-chip^="${group}."][aria-pressed="true"]`).forEach((b) => { b.setAttribute('aria-pressed', 'false'); area.value = area.value.replace(chipPhrase(b.dataset.chip), '').replace(/\s*,\s*,/g, ',').trim(); });
  button.setAttribute('aria-pressed', String(on));
  area.value = on ? [area.value.trim().replace(/[,.]$/, ''), phrase].filter(Boolean).join(', ') : area.value.replace(phrase, '').replace(/\s*,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim();
  area.dispatchEvent(new Event('input'));
}

// ---- server calls
async function post(path, payload) {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, lang }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(errorText(data.error, data.message, 'build')), { status: response.status });
  return data;
}
function announce(text) { const s = $('#build-status'); if (s) { s.textContent = ''; setTimeout(() => { s.textContent = text; }, 30); } }

let turns = [], pollChoices = [], thinking = false, leadSent = false;
// Funnel counters (owner 18.11.2026): a step name only – no text, no ids. Best-effort; never blocks anything.
const track = (step) => { try { const b = JSON.stringify({ step }); if (!navigator.sendBeacon?.('/api/build/event', b)) fetch('/api/build/event', { method: 'POST', body: b, keepalive: true }).catch(() => {}); } catch { /* counting is optional */ } };
const LAST_KEY = 'gerbi-build-last-v1', RESUME_DAYS = 14;
// The conversation is kept on this device so a visitor who leaves can continue later ("ממשיכים מאיפה שעצרנו").
function remember() { try { if (pkg?.destination && lastInput) localStorage.setItem(LAST_KEY, JSON.stringify({ at: Date.now(), input: lastInput, place: (pkg.stops?.length ? pkg.stops : [pkg.destination]).map((s) => s.name), nights: pkg.request.nights })); } catch { /* private mode */ } }
function lastConversation() { try { const x = JSON.parse(localStorage.getItem(LAST_KEY) || 'null'); return x?.input && Date.now() - x.at < RESUME_DAYS * 86400000 ? x : null; } catch { return null; } } // the conversation so far: [{ you, said }] – earlier turns, shown above the current plan
// "Gerbi is thinking" → the plan as soon as the rules have it (owner 23.11.2026). Live flights, hotels and the AI
// wording arrive into the plan on screen; a live strip keeps ticking the real steps (with did-you-know facts about the
// destination's country) until the last answer is in. The budget fit runs once every price is in, never in between.
const STEPS = ['understand', 'route', 'flights', 'hotels', 'budget'];
const GRACE_MS = 900; // a cached answer (~30 ms) lands with the plan instead of a moment after it
let progress = null;
function stopProgress() { if (!progress) return; clearInterval(progress.timer); progress.facts?.(); progress = null; }
function newProgress(mine, target) {
  stopProgress();
  const p = { mine, started: Date.now(), eta: etaMs(), steps: Object.fromEntries(STEPS.map((s, i) => [s, i ? 'wait' : 'active'])), labels: {}, done: false };
  p.timer = setInterval(() => paintEta(p), 250);
  progress = p; p.target = target;
  return p;
}
function setStep(step, state, label = '') {
  if (!progress) return;
  progress.steps[step] = state;
  progress.labels[step] = label;
  paintSteps();
}
const STEP_ICONS = { understand: 'spark', route: 'pin', flights: 'plane', hotels: 'hotel', budget: 'tag' };
const stepText = (s) => progress.steps[s] === 'wait' ? t('build.step.wait') : progress.labels[s] || t(`build.think.${s}`);
const stepsHtml = () => STEPS.map((s) => `<li data-think="${s}" class="is-${progress.steps[s]}"><span class="bk-step-ico" aria-hidden="true">${icon(STEP_ICONS[s])}</span><span><strong>${t(`build.step.${s}`)}</strong><small class="bk-step-text">${esc(stepText(s))}</small></span></li>`).join('');
function paintSteps() {
  if (!progress || !view) return;
  for (const list of view.querySelectorAll('.bk-think-steps')) for (const s of STEPS) {
    const li = list.querySelector(`[data-think="${s}"]`); if (!li) continue;
    const cls = `is-${progress.steps[s]}`;
    if (!li.classList.contains(cls)) { li.className = cls; li.querySelector('.bk-step-text').textContent = stepText(s); }
  }
  paintEta(progress);
}
function paintEta(p) {
  if (!p || p !== progress || !view) return;
  const states = Object.values(p.steps);
  const completed = states.filter((state) => state === 'done' || state === 'skip').length;
  const pct = Math.round(completed * 100 / states.length);
  const left = Math.ceil((p.eta - (Date.now() - p.started)) / 1000);
  for (const bar of view.querySelectorAll('.bk-think-bar')) {
    bar.classList.toggle('is-starting', pct === 0);
    bar.firstElementChild.style.width = `${pct}%`;
  }
  for (const line of view.querySelectorAll('.bk-think-eta')) line.textContent = p.done ? t('build.think.ready') : left > 0 ? t('build.think.eta', { seconds: left }) : t('build.think.almost');
}
// The supplier calls answer in ~10–20 s the first time, ~30 ms from the cache: the median of this browser's last waits.
const ETA_KEY = 'gerbi-build-ms', ETA_MAX = 25000;
function etaMs() { try { const xs = JSON.parse(localStorage.getItem(ETA_KEY) || '[]').filter(Number.isFinite).sort((a, b) => a - b); return xs.length ? Math.min(ETA_MAX, Math.max(1500, xs[Math.floor(xs.length / 2)])) : 15000; } catch { return 15000; } }
function rememberEta(ms) { try { const xs = JSON.parse(localStorage.getItem(ETA_KEY) || '[]'); localStorage.setItem(ETA_KEY, JSON.stringify([...xs, ms].slice(-7))); } catch { /* convenience only */ } }

// A follow-up keeps what its change did not touch (owner 23.11.2026: "the package updates", not a new one): the same
// flight search (and flight wishes) keeps the flights and the chosen one, the same hotel search keeps its hotels, the
// same day plan keeps the visitor's own edits to it, and insurance / a car toggled by hand stay as they were.
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const flightKey = (p) => ({ s: p.flightSearch, f: Object.entries(p.request?.prefs?.flight || {}).sort(), d: Boolean(p.request?.needs?.direct), b: (p.request?.budget || 0) > 0 });
function keepUnchanged(before, next) {
  const kept = [];
  if (before.flights?.status === 'live' && same(flightKey(before), flightKey(next))) { next.flights = before.flights; next.manual = before.manual; kept.push('flights'); }
  const groups = before.hotels?.stops || [before.hotels], nextGroups = next.hotels.stops || [next.hotels];
  nextGroups.forEach((g, i) => { if (groups[i] && !['pending'].includes(groups[i].status) && same(before.planHotelSearches?.[i], next.hotelSearches?.[i])) { Object.assign(g, groups[i]); next.hotelSearches[i] = before.hotelSearches[i]; kept.push('hotels'); } });
  if (same(before.planItinerary, next.itinerary) && same(before.request?.activities || {}, next.request?.activities || {})) { next.itinerary = before.itinerary; next.spare = before.spare; next.polish = before.polish; kept.push('itinerary'); }
  next.insurance = { ...before.insurance };
  if (before.request?.needs?.car === next.request?.needs?.car && before.destination?.id === next.destination?.id) next.car.include = before.car.include;
  return kept;
}
async function build(input) {
  showBuilderThread();
  const before = pkg?.destination ? pkg : null, followUp = (input.thread || []).length > 1;
  const previousInput = lastInput, previousTurns = [...turns];
  if (!followUp) turns = []; else if (before && lastInput && input.current?.change !== false) turns.push({ you: (lastInput.thread || [lastInput.text]).at(-1), said: planLine(before) });
  lastInput = input; const mine = ++version;
  // In a conversation the turns (and the latest message) read top to bottom inside the reply; the top bubble is for a first message.
  const you = $('.gb-you', view); if (you && input.text) { you.querySelector('p').textContent = input.text; you.hidden = followUp; } leadOpen = false; showAllHotels = new Set(); openDays = new Set(); dayExpand = {}; stayExpand = {}; showAllAttractions = false;
  const out = $('#build-result'), err = $('.build-error', view), button = $('.build-submit', view);
  const chat = $('#bc-chat', view), chatError = $('.bk-chat-error', chat);
  const active = () => mine === version && !view.hidden && out.isConnected;
  chatError.hidden = true;
  const tools = $('.bk-chat-tools', chat);
  tools.open = false; tools.hidden = true;
  chat.hidden = false;
  setChatBusy(chat, true);
  err.hidden = true; button.disabled = true; button.setAttribute('aria-busy', 'true');
  // Facts from the first moment: the plan's country on a follow-up, else a guess from the text (Italy for "ברומא").
  const target = followUp && before ? { id: before.destination.id, code: before.destination.code } : { cc: guessCountry([input.text, ...(input.thread || [])].join(' ')) };
  const p = newProgress(mine, target), place = followUp && before ? L(before.destination.name) : '';
  out.innerHTML = historyHtml() + thinkingHtml(place, !followUp); announce(place ? t('build.think.title', { place }) : t('build.think.titleAny')); pollChoices = followUp ? pollChoices : [];
  p.facts = startDidYouKnow($('.bk-think-facts', out), target, { inside: true, initialFact: t('build.think.fact') });
  paintEta(p); thinking = true;
  try {
    const plan = await post('/api/build', input);
    if (!active()) return;
    pkg = { ...plan, manual: false, fit: null, extras: [], chatReply: followUp ? describeChange(before, plan, lang) : null, flights: { status: plan.flightSearch ? 'pending' : 'quote' },
      hotels: plan.stops?.length ? { stops: plan.hotelSearches.map((s, i) => ({ status: s ? 'pending' : 'quote', stop: i, area: plan.hotelAreas[i] })) } : { status: plan.hotelSearches[0] ? 'pending' : 'quote', area: plan.hotelAreas[0] },
      car: { ...plan.car }, insurance: { include: false }, polish: null,
      planItinerary: JSON.parse(JSON.stringify(plan.itinerary || [])), planHotelSearches: JSON.parse(JSON.stringify(plan.hotelSearches || [])) };
    if (!pkg.destination) {
      stopProgress(); thinking = false; out.removeAttribute('aria-busy'); out.innerHTML = suggestionsOnlyHtml();
      chat.hidden = true; announce(t('build.status.suggest')); return;
    }
    const kept = followUp && before ? keepUnchanged(before, pkg) : [];
    if (followUp && pkg.chatReply && kept.includes('flights')) pkg.kept = kept;
    p.facts?.retarget({ id: pkg.destination.id, code: pkg.destination.code });
    const where = L(pkg.destination.name);
    for (const h of out.querySelectorAll('.bk-think h2')) h.textContent = t('build.think.title', { place: where });
    setStep('understand', 'done', t('build.think.done.understand', { place: where }));
    setStep('route', 'done', t('build.think.done.route', { days: pkg.itinerary.length }));
    if (pkg.flights.status === 'pending') setStep('flights', 'active');
    else setStep('flights', 'done', pkg.flights.status === 'live' ? t('build.think.done.flights', { count: pkg.flights.total }) : t('build.think.done.flightsQuote'));
    const pendingHotels = hotelGroups().map((g, i) => (g.status === 'pending' ? i : -1)).filter((i) => i >= 0);
    if (pendingHotels.length) setStep('hotels', 'active');
    else setStep('hotels', 'done', hotelsLabel());
    // Everything that is still missing, in parallel; the page shows the plan after GRACE_MS whatever has arrived.
    const jobs = [fetchFlights(mine), Promise.all(pendingHotels.map((i) => fetchHotels(mine, i))).then(() => { if (mine === version && pendingHotels.length) setStep('hotels', 'done', hotelsLabel()); })];
    if (!pkg.polish) fetchPolish(mine);
    const all = Promise.allSettled(jobs).then(() => finishProgress(mine));
    await Promise.race([all, new Promise((r) => setTimeout(r, GRACE_MS))]);
    if (!active()) return;
    fitBudget(); render(); remember(); if (!followUp) track('plan_shown'); announce(t('build.status.skeleton', { place: where }));
    paintSteps();
    if (!document.activeElement?.closest('.bk-poll-host, #bc-chat')) {
      const heading = $(p.done ? '.bk-summary h2' : '.bk-think-head h3', out);
      heading?.focus();
    }
    return true;
  } catch (error) {
    if (!active()) return;
    stopProgress(); thinking = false;
    const message = error.message || t('build.err.generic');
    if (before) {
      pkg = before; lastInput = previousInput; turns = previousTurns;
      for (const group of [pkg.flights, ...hotelGroups()]) if (group.status === 'pending') group.status = 'quote';
      render(); chatError.textContent = message; chatError.hidden = false;
    } else {
      out.removeAttribute('aria-busy'); out.innerHTML = ''; err.textContent = message; err.hidden = false;
      chat.hidden = true;
      $('.gb-intake', view)?.classList.add('is-welcome');
    }
  } finally {
    if (mine === version) {
      button.disabled = false; button.removeAttribute('aria-busy');
      setChatBusy(chat, false);
    }
  }
}
const hotelsLabel = () => { const gs = hotelGroups(), n = gs.reduce((a, g) => a + (g.status === 'live' ? g.total || g.picks?.length || 0 : g.estimate?.count || 0), 0); return n ? t('build.think.done.hotels', { count: n }) : t('build.think.done.hotelsQuote'); };
// The last answer is in: the budget fit, then the strip says so and folds (the facts stop).
function finishProgress(mine) {
  if (mine !== version || !progress || progress.mine !== mine) return;
  fitBudget(); if (pkg?.destination && view?.isConnected) repaintPrices(); persist();
  const b = pkg?.request?.budget ? pricePackage(pkg, getFx()).budget : null;
  const budgetLabel = b?.verdict === 'within' ? 'budget' : ['over', 'near'].includes(b?.verdict) ? 'budgetOver' : 'total';
  setStep('budget', 'done', t(`build.think.done.${budgetLabel}`));
  progress.done = true; paintEta(progress); rememberEta(Date.now() - progress.started);
  clearInterval(progress.timer); progress.facts?.(); progress.facts = null; thinking = false;
  const live = $('#bc-live', view);
  if (live) {
    live.classList.add('bk-live-done');
    live.querySelector('.bk-think-facts')?.remove();
    $('.bk-think-head h3', live).textContent = t('build.live.done');
  }
  announce(t('build.live.done'));
}
async function fetchFlights(mine) {
  if (!pkg.flightSearch || pkg.flights.status !== 'pending') return;
  try {
    const result = await post('/api/build/flights', { search: pkg.flightSearch, request: { adults: pkg.request.adults, children: pkg.request.children, needs: pkg.request.needs, budget: pkg.request.budget || null, prefs: pkg.request.prefs || null } });
    if (mine !== version) return;
    pkg.flights = result.status === 'live' ? result : { status: 'quote', reason: result.reason || result.status };
  } catch (error) { if (mine === version) pkg.flights = { status: 'quote', reason: error.status === 429 ? 'rate_limited' : '' }; }
  if (mine !== version) return;
  setStep('flights', 'done', pkg.flights.status === 'live' ? t('build.think.done.flights', { count: pkg.flights.total }) : t('build.think.done.flightsQuote'));
  fitBudget(); repaintPrices(); persist();
  announce(pkg.flights.status === 'live' ? t('build.status.flights', { count: pkg.flights.picks.length }) : t('build.status.flightsQuote'));
}
const hotelGroups = () => (pkg.hotels.stops ? pkg.hotels.stops : [pkg.hotels]);
// Spec 28: once every price is in, fit the package under the budget (cheapest fitting flight → cheaper hotel → lower
// meal plan → a star down → no car). In memory on what arrived; never after the visitor chose something by hand.
function fitBudget() {
  if (!pkg?.request?.budget || pkg.manual || pkg.flights.status === 'pending' || hotelGroups().some((g) => g.status === 'pending')) return;
  const result = fitPackage(pkg, getFx());
  if (result) pkg.fit = { ...result, steps: [...new Set([...(pkg.fit?.steps || []), ...result.steps])] };
}
function repaintPrices() { for (const part of ['flights', 'hotels', 'car', 'total', 'banner', 'upsell', 'stay']) paint(part); }
async function fetchHotels(mine, i, area) {
  const spec = pkg.hotelSearches?.[i];
  if (!spec) return;
  const group = hotelGroups()[i];
  if (area !== undefined) { spec.area = area; group.status = 'pending'; paint('hotels'); }
  try {
    const result = await post('/api/build/hotels', { search: spec });
    if (mine !== version) return;
    Object.assign(group, result.status === 'live' ? { ...result, selected: result.picks[0]?.id } : result.status === 'estimate' ? { ...result, picks: [] } : { status: 'quote', picks: [], reason: result.reason || result.status });
  } catch (error) { if (mine === version) Object.assign(group, { status: 'quote', picks: [], reason: error.status === 429 ? 'rate_limited' : '' }); }
  if (mine !== version) return;
  fitBudget(); repaintPrices(); persist();
  announce(group.status === 'live' ? t('build.status.hotels', { count: group.picks.length }) : group.status === 'estimate' ? t('build.status.hotelsEstimate') : t('build.status.hotelsQuote'));
}
async function fetchPolish(mine) {
  try {
    const data = await post('/api/build/polish', { destination: L(pkg.destination.name), travellers: travellersText(pkg.request), days: pkg.itinerary.map((d) => ({ kind: d.kind, items: d.items.map((x) => x.name) })) });
    if (mine !== version || !data.polish || data.polish.dayTitles.length !== pkg.itinerary.length) return;
    pkg.polish = data.polish; pkg.itinerary.forEach((d, i) => { d.title = data.polish.dayTitles[i]; });
    paint('itinerary'); paint('where'); persist();
  } catch { /* the rules' wording stays */ }
}

// ---- rendering
// While it thinks: three one-tap questions (labour that improves the result keeps people in; answers apply in one tap).
const POLL = [['flight', ['direct', 'cheap', 'noNight']], ['hotel', ['beach', 'center', 'any']], ['pace', ['relaxed', 'balanced', 'packed']]];
function pollHtml(i = 0) {
  if (i >= POLL.length) return `<p class="bk-poll-done" tabindex="-1">${t('build.poll.done')}</p>`;
  const [q, opts] = POLL[i];
  return `<fieldset class="bk-poll" data-poll-step="${i}"><legend>${t(`build.poll.${q}`)} <small>${t('build.poll.step', { current: i + 1, total: POLL.length })}</small></legend><div class="bk-poll-choices">${opts.map((o) => `<button type="button" class="chip" data-poll="${q}.${o}">${t(`build.poll.${q}.${o}`)}</button>`).join('')}</div></fieldset>`;
}
// "No time to wait?" – a name and a phone; the plan as it stands goes to an agent with the request to send it on
// WhatsApp (a person sends it: the site does not message customers by itself).
function notifyHtml() {
  return `<details class="bk-notify"><summary>${icon('send')}<span>${t('build.notify.summary')}</span>${icon('down')}</summary><form id="build-notify" class="bk-notify-form" novalidate>
   <label>${t('leads.field.name')}<input name="name" autocomplete="name" maxlength="80" required></label>
   <label>${t('leads.field.phone')}<input name="phone" type="tel" autocomplete="tel" inputmode="tel" required></label>
   <div class="lead-trap" aria-hidden="true"><label>${t('leads.trap')}<input name="website" tabindex="-1" autocomplete="off"></label></div>
   <label class="lead-check"><input type="checkbox" name="consent" required><span>${consentText()}</span></label>
   <p class="lead-form-error" role="alert" hidden></p><button type="submit" class="button yellow">${t('build.notify.send')}</button></form></details>`;
}
async function sendNotify(form) {
  const d = new FormData(form), snapshot = sanitizePackage(pkg), err = $('.lead-form-error', form);
  const input = { type: 'package', name: String(d.get('name') || ''), phone: String(d.get('phone') || ''), email: '', channel: 'whatsapp', consent: d.get('consent') === 'on', marketing: false,
    website: String(d.get('website') || ''), source: '/build#notify', lang, ...packageLeadFields(snapshot, lang), package: snapshot };
  const { errors } = validateLead(input, { lang });
  if (Object.keys(errors).length) { err.textContent = Object.values(errors)[0]; err.hidden = false; return; }
  err.hidden = true;
  form.querySelector('[type=submit]').disabled = true;
  try {
    const response = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(errorText(data.error, data.message, 'leads'));
    const done = document.createElement('p');
    done.className = 'bk-notify-done';
    done.tabIndex = -1;
    done.innerHTML = t('build.notify.done', { ref: `<bdi dir="ltr">${esc(data.id)}</bdi>` });
    form.closest('details').replaceWith(done);
    done.focus();
    leadSent = true; track('notify_request');
  } catch (error) { err.textContent = error.message || t('build.err.generic'); err.hidden = false; form.querySelector('[type=submit]').disabled = false; }
}
// "Before you go": once a session, on a desktop exit gesture, when there is a plan and nothing was sent yet.
function exitPrompt() {
  if (!pkg?.destination || leadSent || thinking || sessionStorage.getItem('gerbi-exit-shown')) return;
  try { sessionStorage.setItem('gerbi-exit-shown', '1'); } catch { /* fine */ }
  const dlg = document.createElement('dialog'); dlg.className = 'bk-exit'; dlg.setAttribute('aria-labelledby', 'bk-exit-title');
  dlg.innerHTML = `<img src="/assets/mascot.webp" alt="" width="72" height="72"><h2 id="bk-exit-title">${t('build.exit.title')}</h2><p>${t('build.exit.text', { place: esc((pkg.stops?.length ? pkg.stops : [pkg.destination]).map((s) => L(s.name)).join(' ← ')) })}</p>
   <div class="bk-exit-acts"><button type="button" class="button yellow" data-exit="send">${t('build.exit.send')}</button><button type="button" class="button secondary" data-exit="save">${t('build.exit.save')}</button><button type="button" class="link-button" data-exit="close">${t('build.exit.close')}</button></div>`;
  document.body.append(dlg); dlg.showModal(); track('exit_prompt');
  dlg.addEventListener('click', (e) => {
    const what = e.target.closest('[data-exit]')?.dataset.exit; if (!what && e.target !== dlg) return;
    dlg.close(); dlg.remove();
    if (what === 'send') { track('exit_send'); leadOpen = true; paintLead(); const w = $('#bc-lead input[name="channel"][value="whatsapp"]', view); if (w) w.checked = true; $('#bc-lead', view)?.scrollIntoView({ block: 'center' }); $('#bc-lead h3', view)?.focus(); }
    else if (what === 'save') { track('exit_save'); $('[data-act="save"]', view)?.click(); }
  });
}
function resumeHtml(last) {
  const place = last.place.map((n) => L(n)).join(' ← '), when = Math.max(0, Math.round((Date.now() - last.at) / 86400000));
  return `<section class="bk-card bk-resume"><h2 tabindex="-1">${t('build.resume.title')}</h2><p>${t('build.resume.text', { place: esc(place), nights: last.nights, days: when })}</p>
   <p class="micro-copy">${esc((last.input.thread || [last.input.text]).join(' · ').slice(0, 220))}</p>
   <div class="bk-resume-acts"><button type="button" class="button yellow" data-resume="go">${t('build.resume.go')}</button><button type="button" class="button secondary" data-resume="new">${t('build.resume.new')}</button></div></section>`;
}
const mascotHtml = () => '<div class="bk-think-mascot" aria-hidden="true"><img src="/assets/mascot.webp" alt="" width="52" height="52"></div>';
function thinkingHtml(place, poll = true) {
  return `<section class="bk-card bk-think"><div class="bk-think-top">${mascotHtml()}<div class="bk-think-head"><h2 tabindex="-1">${place ? t('build.think.title', { place: esc(place) }) : t('build.think.titleAny')}</h2>
   <p class="bk-think-eta micro-copy" aria-live="off"></p></div></div><div class="bk-think-bar" aria-hidden="true"><span></span></div>
   <div class="bk-think-facts"></div><ol class="bk-think-steps">${stepsHtml()}</ol>${poll ? `<div class="bk-poll-host">${pollHtml(0)}</div>` : ''}</section>`;
}
// Keep the poll available when the plan arrives, including when the price checks finish quickly.
function liveHtml(poll) {
  if (!progress || (progress.done && !poll)) return '';
  return `<section class="bk-card bk-think bk-live${progress.done ? ' bk-live-done' : ''}" id="bc-live"><div class="bk-think-top">${mascotHtml()}<div class="bk-think-head"><h3 tabindex="-1">${t(progress.done ? 'build.live.done' : 'build.live.title')}</h3>
   <p class="bk-think-eta micro-copy" aria-live="off"></p></div></div><div class="bk-think-bar" aria-hidden="true"><span></span></div>
   ${progress.done ? '' : '<div class="bk-think-facts"></div>'}<ol class="bk-think-steps">${stepsHtml()}</ol>
   <div class="bk-live-tools">${poll ? `<div class="bk-poll-host">${poll}</div><div class="bk-poll-apply-host">${pollApplyHtml()}</div>` : ''}${notifyHtml()}</div></section>`;
}
function skeletonHtml() {
  return `<div class="build-skeleton" aria-hidden="true">${['where', 'flights', 'hotels', 'itinerary'].map(() => '<div class="bk-card bk-skel"><span></span><span></span><span></span></div>').join('')}</div><p class="micro-copy">${t('build.status.planning')}</p>`;
}
function suggestionsOnlyHtml() {
  return `<section class="bk-card"><h2 tabindex="-1">${t('build.where.pick')}</h2>${suggestionsHtml()}</section>`;
}
function builderPlacePhoto(s) {
  return `<div class="photo-place-frame">
   ${s.image ? `<img src="${esc(s.image)}" alt="" loading="lazy" width="320" height="200" data-fallback>` : ''}
   <span class="photo-place-caption"><strong>${esc(L(s.name))}</strong>${s.country ? ` <small>${esc(L(s.country))}</small>` : ''}</span>
  </div>`;
}
function suggestionsHtml() {
  if (!pkg.suggestions?.length) return '';
  return `<ul class="bk-suggestions">${pkg.suggestions.map((s) => `<li class="bk-suggestion photo-place-card${s.id === pkg.destination?.id ? ' current' : ''}">${builderPlacePhoto(s)}<div>
   <p class="micro-copy">${esc(s.reasons.join(' · ') || t('build.where.fit'))}</p>${s.advisory ? `<p class="micro-copy bk-advisory">${esc(s.advisory)}</p>` : ''}${s.flightHours ? `<p class="micro-copy">${t('build.where.flight', { hours: s.flightHours })}${s.direct ? ' · ' + t('build.where.direct') : ''}</p>` : ''}</div>
   ${s.id === pkg.destination?.id ? `<span class="bk-current" aria-current="true">${t('build.where.chosen')}</span>` : `<button type="button" class="button secondary" data-choose="${esc(s.id)}">${t('build.where.choose', { place: esc(L(s.name)) })}</button>`}</li>`).join('')}</ul>`;
}
const JUMPS = [['flights', 'plane', 'build.flights.title'], ['hotels', 'hotel', 'build.hotels.title'], ['itinerary', 'pin', 'build.itinerary.title'], ['total', 'tag', 'build.total.title']];
const jumpHtml = () => `<nav class="bk-jumps" aria-label="${t('build.sections')}">${JUMPS.map(([id, symbol, label]) => `<button type="button" data-build-jump="${id}">${icon(symbol)}${t(label)}${icon('down')}</button>`).join('')}</nav>`;
function render() {
  showBuilderThread();
  const r = pkg.request, out = $('#build-result');
  const poll = $('.bk-poll-host', out);
  const facts = $('.bk-think-facts', out);
  const pollFocus = poll?.contains(document.activeElement) ? document.activeElement.dataset.poll || '' : null;
  out.removeAttribute('aria-busy');
  const stops = pkg.stops?.length ? pkg.stops : [pkg.destination];
  const stale = pkg.sharedAt && isStale(pkg.flights?.searchedAt || pkg.sharedAt);
  out.innerHTML = `${historyHtml()}${pkg.chatReply ? `<p class="bk-reply">${pkg.chatReply.length ? t('build.chat.reply', { list: esc(pkg.chatReply.join(' · ')) }) : t('build.chat.noChange')}${pkg.kept?.includes('flights') ? ` <small>${t('build.chat.kept')}</small>` : ''}</p>` : ''}${liveHtml(poll?.innerHTML)}<div class="bk-summary">
    ${pkg.destination.image ? `<img class="bk-hero-img" src="${esc(pkg.destination.image)}" alt="" data-fallback>` : ''}
    <div class="bk-summary-body"><span class="eyebrow">${t('build.result.kicker')}</span><h2 tabindex="-1">${esc(stops.map((s) => L(s.name)).join(' ← '))}</h2>
    <p class="bk-summary-meta"><span>${icon('calendar')}${esc(longDay(r.start))} – ${esc(longDay(r.end))}</span><span>${icon('clock')}${t('build.nights', { count: r.nights })}</span><span>${icon('people')}${esc(travellersText(r))}</span></p>
    ${pkg.understood?.length ? `<p class="bk-understood"><span class="reply-label">${t('build.understood')}</span> ${pkg.understood.map((u) => `<span class="understood-chip">${esc(u.label)}</span>`).join('')}</p>` : ''}
    ${pkg.assumed?.length ? `<p class="micro-copy bk-assumed">${t('build.assumed', { list: esc(pkg.assumed.join(' · ')) })}</p>` : ''}
    ${pkg.questions?.length ? `<p class="next-question">${pkg.questions.map(esc).join('<br>')}</p>` : ''}
    ${pkg.sharedAt ? '' : `<p class="bk-talk"><button type="button" class="link-button" data-chat-jump>${icon('edit')}${t('build.chat.talk')}</button></p>`}
    ${stale ? `<p class="notice">${t('build.shared.stale', { time: esc(fmtDate(pkg.sharedAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) })} <button type="button" class="link-button" data-act="refresh">${t('build.shared.refresh')}</button></p>` : ''}
    </div></div>
   ${jumpHtml()}
   <div id="bc-banner" class="bk-banner-host"></div>
   ${optionsHtml()}
   ${editHtml()}
   <div class="bk-grid">
    <div class="bk-main">
     <section class="bk-card" id="bc-where" aria-labelledby="bh-where"></section>
     <section class="bk-card" id="bc-flights" aria-labelledby="bh-flights"></section>
     <section class="bk-card" id="bc-hotels" aria-labelledby="bh-hotels"></section>
     <section class="bk-card bk-stay-card" id="bc-stay" aria-labelledby="bh-stay"></section>
     <section class="bk-card" id="bc-car" aria-labelledby="bh-car"></section>
     <section class="bk-card" id="bc-insurance" aria-labelledby="bh-insurance"></section>
     <section class="bk-card" id="bc-itinerary" aria-labelledby="bh-itinerary"></section>
     <section class="bk-card bk-att-card" id="bc-attractions" aria-labelledby="bh-attractions"></section>
     <section class="bk-card" id="bc-practical" aria-labelledby="bh-practical"></section>
    </div>
    <aside class="bk-side"><section class="bk-card bk-total" id="bc-total" aria-labelledby="bh-total"></section>
     <section class="bk-card bk-upsell" id="bc-upsell" aria-labelledby="bh-upsell"></section>
     <div class="bk-actions" role="group" aria-label="${esc(t('build.actions'))}">
      <button type="button" class="button yellow full-width" data-act="lead">${icon('send')}${t('build.act.lead')}</button>
      <button type="button" class="button secondary" data-act="save">${icon('heart')}${t('build.act.save')}</button>
      <button type="button" class="button secondary" data-act="share">${icon('send')}${t('build.act.share')}</button>
      <button type="button" class="button secondary" data-act="print">${icon('case')}${t('build.act.print')}</button>
      <button type="button" class="button secondary" data-act="rebuild">${icon('spark')}${t('build.act.rebuild')}</button>
      <p class="micro-copy" id="build-act-status" role="status"></p>
     </div>
     <section class="bk-card bk-lead" id="bc-lead" ${leadOpen ? '' : 'hidden'}></section>
    </aside>
   </div>`;
  if (facts?.firstElementChild) $('#bc-live .bk-think-facts', out)?.replaceWith(facts);
  for (const part of ['where', 'flights', 'hotels', 'stay', 'car', 'insurance', 'itinerary', 'attractions', 'practical', 'total', 'banner', 'upsell']) paint(part);
  if (leadOpen) paintLead();
  wireImages(out);
  if (pollFocus !== null) $(pollFocus ? `[data-poll="${pollFocus}"]` : '.bk-poll-done', out)?.focus({ preventScroll: true });
  // Details (what it is, a tip, a rough ticket price) fill the attractions and the day ideas once loaded.
  loadBrochureData().then((x) => { const first = !brochureData; brochureData = x; if (first && pkg?.destination && view?.isConnected) { paint('attractions'); if (openDays.size) paint('itinerary'); } }).catch(() => {});
  const chat = $('#bc-chat', view);
  $('.bk-chat-chips', chat).innerHTML = followChipsHtml();
  $('.bk-chat-tools', chat).hidden = false;
  chat.hidden = false;
}
function jumpToChat() {
  $('#build-follow-text', view)?.focus({ preventScroll: true });
}
// ---- the conversation (owner 18.11.2026): options with "נמשיך מפה", a follow-up box with quick chips, the turns so far.
const planLine = (p) => `${(p.stops?.length ? p.stops : [p.destination]).map((s) => L(s.name)).join(' ← ')} · ${t('build.nights', { count: p.request.nights })}`;
function historyHtml() {
  if (!turns.length) return '';
  const now = (lastInput?.thread || []).at(-1) || '';
  return `<ol class="bk-history" aria-label="${esc(t('build.chat.history'))}">${turns.map((x) => `<li><p class="bk-history-you">${esc(x.you)}</p><p class="bk-history-said">${esc(x.said)}</p></li>`).join('')}<li><p class="bk-history-you">${esc(now)}</p></li></ol>`;
}
// Up to three other ways to go (the suggestions, else the budget's alternatives); each continues the conversation.
function optionsHtml() {
  const list = [...(pkg.suggestions || []), ...(pkg.budgetPlan?.alternatives || [])].filter((s, i, all) => s.id !== pkg.destination.id && all.findIndex((x) => x.id === s.id) === i).slice(0, 3);
  if (!list.length) return '';
  return `<section class="bk-options-row" aria-labelledby="bh-options"><h3 id="bh-options">${t('build.options.title')}</h3><ul>${list.map((s) => `<li class="bk-option-card photo-place-card">
    ${builderPlacePhoto(s)}<div>
    ${s.reasons?.length ? `<small>${esc(s.reasons.slice(0, 2).join(' · '))}</small>` : ''}${s.estimate ? `<small dir="ltr">${esc(formatIls(Math.round((s.estimate.low + s.estimate.high) / 2)))}~</small>` : ''}</div>
    <button type="button" class="button secondary" data-continue="${esc(s.id)}">${t('build.options.continue')}</button></li>`).join('')}</ul></section>`;
}
const FOLLOW_CHIPS = ['cheaper', 'better', 'direct', 'noNight', 'moreNight', 'lessNight', 'relaxed', 'packed', 'beach', 'center', 'bag', 'car'];
function followChipsHtml() {
  const r = pkg.request, n = r.needs, fp = r.prefs?.flight || {};
  const chips = FOLLOW_CHIPS.filter((c) => !(c === 'direct' && (n.direct || fp.direct)) && !(c === 'noNight' && fp.noNight) && !(c === 'bag' && fp.checkedBag) && !(c === 'car' && pkg.car?.include) && !(c === 'lessNight' && r.nights <= 2));
  return chips.map((c) => `<button type="button" class="chip" data-say="${esc(t(`build.chat.chip.${c}.say`))}">${t(`build.chat.chip.${c}`)}</button>`).join('');
}
function chatHtml() {
  return `<section class="bk-chat floating-composer-dock" id="bc-chat" aria-label="${esc(t('build.chat.title'))}" hidden>
   <div class="bk-chat-inner">
    <p class="bk-chat-error" role="alert" hidden></p>
    <div class="bk-chat-row">
     <details class="bk-chat-tools"><summary title="${esc(t('build.chat.chipsLabel'))}">${icon('edit')}<span class="sr-only">${t('build.chat.chipsLabel')}</span></summary>
      <div class="bk-chat-menu"><button type="button" class="button secondary" data-chat-edit>${icon('calendar')}${t('build.edit.summary')}</button>
       <div class="bk-chat-chips" role="group" aria-label="${esc(t('build.chat.chipsLabel'))}"></div></div>
     </details>
     <form id="build-follow" class="planner-composer" novalidate><label class="sr-only" for="build-follow-text">${t('build.chat.title')}</label>
      <textarea id="build-follow-text" dir="auto" rows="1" maxlength="600" placeholder="${esc(t('build.chat.placeholder'))}"></textarea>
      <button type="submit" class="button blue" title="${esc(t('build.chat.send'))}" aria-label="${esc(t('build.chat.send'))}">${icon('send')}</button>
     </form>
    </div>
   </div>
  </section>`;
}
// The poll can be answered after the plan is on screen.
const pollApplyHtml = () => (pollChoices.length ? `<p class="bk-poll-apply">${t('build.poll.picked', { list: esc(pollChoices.map((x) => x.label).join(' · ')) })} <button type="button" class="button secondary" data-say="${esc(pollChoices.map((x) => x.say).join(', '))}" data-poll-apply>${t('build.poll.apply')}</button></p>` : '');
function paintPollApply() { view.querySelectorAll('.bk-poll-apply-host').forEach((host) => { host.innerHTML = pollApplyHtml(); }); }
function currentTrip(change = false) {
  const stops = pkg.stops?.length ? pkg.stops : [pkg.destination];
  const counts = new Map();
  for (const stop of stops) counts.set(stop.id, (counts.get(stop.id) || 0) + (stop.nights || 0));
  return { change, request: pkg.request, dest: [...counts.keys()], legNights: [...counts.values()] };
}
function rebuildCurrent(edits, chosen = '') {
  return build({ ...lastInput, text: lastInput?.text || pkg.request.text, chosen, edits, current: currentTrip() });
}

function followUp(text) {
  const said = String(text || '').trim();
  if (!said || !pkg?.destination || $('.build-submit', view).disabled) return;
  const thread = [...(lastInput?.thread || [lastInput?.text || '']), said].filter(Boolean).slice(-8);
  track('followup');
  return build({ text: said, thread, current: currentTrip(true) });
}
const hideMissingImage = (event) => event.currentTarget.classList.add('bk-noimg');
const showHotelPhoto = (event) => event.currentTarget.classList.add('bk-photo-ready');
function wireImages(root) {
  root.querySelectorAll('img[data-fallback]').forEach((img) => {
    img.addEventListener('error', hideMissingImage, { once: true });
    if (img.parentElement.matches('.bk-hotel')) {
      if (img.complete && img.naturalWidth > 0) img.classList.add('bk-photo-ready');
      else img.addEventListener('load', showHotelPhoto, { once: true });
    }
  });
}

function editHtml() {
  const r = pkg.request, n = r.needs;
  return `<details class="bk-edit"><summary>${icon('edit')}${t('build.edit.summary')}</summary><form id="build-edit" class="bk-edit-form">
   <label>${t('build.edit.adults')}<input type="number" name="adults" min="1" max="9" value="${r.adults}"></label>
   <label>${t('build.edit.children')}<input type="number" name="children" min="0" max="8" value="${r.children}"></label>
   <label>${t('build.edit.ages')}<input type="text" name="childAges" inputmode="numeric" placeholder="${esc(t('build.edit.agesPlaceholder'))}" value="${esc(r.childAges.join(', '))}"></label>
   <label>${t('build.edit.start')}<input type="date" name="start" value="${esc(r.start)}"></label>
   <label>${t('build.edit.nights')}<input type="number" name="nights" min="1" max="90" value="${r.nights}"></label>
   <label>${t('build.edit.stars')}<select name="minStars">${[0, 3, 4, 5].map((s) => `<option value="${s}" ${n.minStars === s ? 'selected' : ''}>${s ? t('build.edit.starsN', { stars: s }) : t('build.edit.starsAny')}</option>`).join('')}</select></label>
   <label>${t('build.edit.car')}<select name="car">${['auto', 'yes', 'no'].map((c) => `<option value="${c}" ${n.car === c ? 'selected' : ''}>${t(`build.edit.car.${c}`)}</option>`).join('')}</select></label>
   <label class="lead-check"><input type="checkbox" name="allInclusive" ${n.allInclusive ? 'checked' : ''}><span>${t('build.edit.allInclusive')}</span></label>
   <label class="lead-check"><input type="checkbox" name="kosher" ${n.kosher ? 'checked' : ''}><span>${t('build.edit.kosher')}</span></label>
   <label class="lead-check"><input type="checkbox" name="shabbat" ${n.shabbat ? 'checked' : ''}><span>${t('build.edit.shabbat')}</span></label>
   <button type="submit" class="button yellow">${t('build.edit.apply')}</button></form></details>`;
}
function editsFrom(form) {
  const d = new FormData(form), num = (k) => (d.get(k) === '' ? undefined : Number(d.get(k)));
  return { adults: num('adults'), children: num('children'), childAges: String(d.get('childAges') || '').split(/[,\s]+/).filter(Boolean).map(Number).filter(Number.isInteger),
    start: String(d.get('start') || '') || undefined, nights: num('nights'), minStars: num('minStars'), car: String(d.get('car')), allInclusive: d.get('allInclusive') === 'on', kosher: d.get('kosher') === 'on', shabbat: d.get('shabbat') === 'on' };
}

const PAINT = {
  where() {
    const d = pkg.destination;
    return `<h3 id="bh-where">${icon('globe')}${t('build.where.title')}</h3>
     ${pkg.polish?.intro ? `<p class="bk-intro">${esc(pkg.polish.intro)} <small class="bk-ai">${t('build.ai.note')}</small></p>` : ''}
     <p>${esc(L(d.summary))}</p>${d.advisory ? `<p class="notice bk-advisory">${esc(L(d.advisory))}</p>` : ''}${pkg.highlights?.length ? `<ul class="bk-highlights">${pkg.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
     ${pkg.suggestions?.length > 1 ? `<h4>${t('build.where.others')}</h4>${suggestionsHtml()}` : ''}`;
  },
  flights() {
    const f = pkg.flights, head = `<h3 id="bh-flights">${icon('plane')}${t('build.flights.title')}</h3>`;
    if (f.status === 'pending') return head + `<p class="bk-pending" aria-busy="true">${t('build.flights.pending')}</p>`;
    if (f.status !== 'live') return head + `<p>${kindPill('quote')} ${t(f.reason === 'not_connected' ? 'build.flights.notConnected' : f.reason === 'rate_limited' ? 'build.err.rateLimited' : 'build.flights.quote')}</p>`;
    const link = pkg.stops?.length ? multiLink({ legs: f.picks[0].legs.map((l) => ({ from: l.from, to: l.to, date: l.date })), adults: pkg.request.adults, children: pkg.request.children })
      : searchLink({ origin: pkg.request.origin, destination: pkg.destination.code, start: pkg.request.start, end: pkg.request.end, type: 'round', adults: pkg.request.adults, children: pkg.request.children });
    const flightView = flightsInBudget(pkg, getFx()), unmet = f.picks[0]?.unmet || [], fp = pkg.request.prefs?.flight || {};
    const wish = unmet.map((u) => `<p class="notice bk-unmet">${t(`build.flights.unmet.${u}`, { list: esc((u === 'only' ? fp.only : fp.avoid || []).map((k) => airlineName(k, lang)).join(', ')) })}</p>`).join('');
    return head + wish + `<p class="micro-copy">${kindPill('live')} ${t('build.flights.found', { count: f.total })} · ${esc(checked(f.searchedAt))}</p>
     ${flightView.hidden ? `<p class="micro-copy bk-over-note">${t('build.flights.hiddenOver', { count: flightView.hidden, budget: esc(formatIls(pkg.request.budget)) })}</p>` : ''}
     ${flightView.allOver ? `<p class="bk-budget bk-budget-over">${t('build.flights.allOver', { budget: esc(formatIls(pkg.request.budget)) })}</p>` : ''}
     <ul class="bk-options">${flightView.shown.map((p) => `<li><button type="button" class="bk-option travel-card bk-flight-choice" data-pick-flight="${esc(p.key)}" aria-pressed="${p.key === f.selected}">
      <span class="bk-option-main"><strong>${esc(p.carriers.join(' + '))}</strong>${p.badges.length ? `<span class="bk-badges">${p.badges.map((b) => `<span class="flight-badge badge-${esc(b)}">${t(`app.badge.${b}`)}</span>`).join('')}</span>` : ''}
      ${p.legs.map((l) => `<span class="bk-leg" dir="ltr">${esc(l.from)} ${esc(l.depart)} → ${esc(l.to)} ${esc(l.arrive)}${l.dayOffset ? ` +${l.dayOffset}` : ''}</span><small>${esc(longDay(l.date))} · ${l.stops ? t('build.flights.stops', { count: l.stops }) : t('build.flights.direct')}</small>`).join('')}
      ${p.reasons.length ? `<small class="why">${esc(p.reasons.join(' · '))}</small>` : ''}</span>
      <span class="bk-option-price"><strong dir="ltr">${esc(fare(p.price))}</strong><small>${t('build.flights.forAll', { count: travellers(pkg.request) })}</small>${p.key === f.selected ? `<small class="bk-option-chosen">${icon('check')}${t('build.where.chosen')}</small>` : ''}</span></button></li>`).join('')}</ul>
     ${bookable(f) ? `<p class="bo-book-flight"><button type="button" class="button yellow" data-book-flight>${t('booking.builder.book')}</button> <span class="micro-copy">${t('booking.builder.bookNote')}</span></p><p class="micro-copy" id="bo-book-status" role="status"></p>` : ''}
     <p class="micro-copy">${t('build.flights.note')} <a href="${esc(link)}">${t('build.flights.full')}</a></p>`;
  },
  hotels() {
    const groups = hotelGroups(), head = `<h3 id="bh-hotels">${icon('hotel')}${t('build.hotels.title')}</h3>`;
    return head + groups.map((g, i) => {
      const stop = pkg.stops?.length ? pkg.stops[i] : pkg.destination, areas = pkg.areas?.[i] || [];
      const areaLine = g.area ? `<p class="bk-area"><strong>${t('build.hotels.area', { area: esc(L(g.area.name)) })}</strong> ${esc(L(g.area.forWhom))}</p>` : '';
      const areaPick = areas.length > 1 ? `<label class="bk-area-pick">${t('build.hotels.otherArea')}<select data-area="${i}">${areas.map((a) => `<option value="${esc(L(a.name).length ? (a.name.en || L(a.name)) : '')}" ${g.area && L(g.area.name) === L(a.name) ? 'selected' : ''}>${esc(L(a.name))}</option>`).join('')}</select></label>` : '';
      const title = groups.length > 1 ? `<h4>${esc(L(stop.name))} · ${t('build.nights', { count: stop.nights })}</h4>` : '';
      if (g.status === 'pending') return title + areaLine + `<p class="bk-pending" aria-busy="true">${t('build.hotels.pending')}</p>`;
      if (g.status === 'estimate' && g.estimate) {
        const e = g.estimate, conv = (v) => fare({ value: v, currency: e.currency });
        const what = [g.minStars ? t('build.hotels.estStars', { stars: g.minStars }) : '', g.board && !g.boardFallback ? t(`build.board.${g.board}`) : ''].filter(Boolean).join(' · ');
        return title + areaLine + areaPick + `<div class="bk-hotel-est travel-card"><p>${kindPill('estimate')} <strong>${t('build.hotels.estLine', { low: `<span class="bk-range" dir="ltr">${esc(conv(e.perNight.low))} – ${esc(conv(e.perNight.high))}</span>`, what: esc(what || t('build.hotels.estAny')), where: e.areaScope && g.area ? t('build.hotels.estInArea', { area: esc(L(g.area.name)) }) : t('build.hotels.estInDest') })}</strong></p>
          <p>${t('build.hotels.estStay', { nights: e.nights, range: `<span class="bk-range" dir="ltr">${esc(conv(e.stay.low))} – ${esc(conv(e.stay.high))}</span>` })}</p>
          <p class="micro-copy">${t('build.hotels.estNote', { count: e.count, time: esc(checked(g.searchedAt)) })}${g.boardFallback ? ' · ' + t('build.hotels.boardFallback', { board: t(`build.board.${g.board}`) }) : ''}</p></div>`;
      }
      if (g.status !== 'live') return title + areaLine + areaPick + `<p>${kindPill('quote')} ${t(g.reason === 'not_connected' ? 'build.hotels.notConnected' : g.reason === 'rate_limited' ? 'build.err.rateLimited' : 'build.hotels.quote')}</p>`;
      const shown = showAllHotels.has(i) ? g.picks : g.picks.slice(0, 3);
      return title + areaLine + areaPick + `<p class="micro-copy">${kindPill('live')} ${t('build.hotels.found', { count: g.total })} · ${esc(checked(g.searchedAt))}${g.boardFallback ? ' · ' + t('build.hotels.boardFallback', { board: t(`build.board.${g.board}`) }) : ''}${g.relaxedStars ? ' · ' + t('build.hotels.relaxed') : ''}</p>
       <ul class="bk-options bk-hotels">${shown.map((h) => `<li><button type="button" class="bk-option bk-hotel travel-card photo-place-card" data-pick-hotel="${i}:${esc(h.id)}" aria-pressed="${h.id === g.selected}">
        ${h.image ? `<img src="${esc(h.image)}" alt="" decoding="async" width="96" height="72" data-fallback>` : ''}
        <span class="hotel-option-content"><span class="bk-option-main"><strong>${esc(h.name)}</strong>${h.stars ? `<span class="bk-stars" role="img" aria-label="${esc(t('build.hotels.stars', { stars: h.stars }))}">${'★'.repeat(h.stars)}</span>` : ''}
         ${h.role ? `<span class="bk-badges"><span class="flight-badge badge-${h.role === 'value' ? 'recommended' : h.role === 'budget' ? 'cheapest' : 'value'}">${t(`build.hotels.role.${h.role}`)}</span></span>` : ''}
         ${h.address ? `<small>${esc(h.address)}</small>` : ''}
         <span class="bk-tags">${h.board ? `<span class="pill">${t(`build.board.${h.board}`)}</span>` : ''}${h.areaMatch ? `<span class="pill">${t('build.hotels.inArea')}</span>` : ''}${h.family ? `<span class="pill">${t('build.hotels.family')}</span>` : ''}${h.refundable === false ? `<span class="pill pill-warn">${t('build.hotels.nonRefundable')}</span>` : ''}</span></span>
        <span class="bk-option-price"><strong dir="ltr">${esc(fare(h.price))}</strong><small>${t('build.hotels.forStay', { nights: h.nights })}</small>${h.nights > 1 ? `<small><bdi dir="ltr">${esc(fare({ value: h.price.value / h.nights, currency: h.price.currency }))}</bdi> ${t('build.hotels.perNight')}</small>` : ''}${h.id === g.selected ? `<small class="bk-option-chosen">${icon('check')}${t('build.where.chosen')}</small>` : ''}</span></span></button></li>`).join('')}</ul>
       ${g.picks.length > 3 ? `<button type="button" class="link-button" data-more-hotels="${i}" aria-expanded="${showAllHotels.has(i)}">${showAllHotels.has(i) ? t('build.hotels.less') : t('build.hotels.more', { count: g.picks.length })}</button>` : ''}
       <p class="micro-copy">${t('build.hotels.note')}</p>`;
    }).join('<hr>');
  },
  car() {
    const c = pkg.car;
    return `<h3 id="bh-car">${icon('pin')}${t('build.car.title')}</h3><p><strong>${t(`build.car.${c.advice}`)}</strong> ${esc(c.note || '')}</p>
     <label class="lead-check"><input type="checkbox" data-car ${c.include ? 'checked' : ''}><span>${t('build.car.include')}</span></label>
     ${c.include ? `<p>${kindPill('quote')} ${t('build.car.quote')}</p><p class="micro-copy">${esc(c.driverAgeNote || t('build.car.age'))}</p>` : ''}`;
  },
  insurance() {
    const url = pkg.config?.insuranceUrl;
    return `<h3 id="bh-insurance">${icon('shield')}${t('build.insurance.title')}</h3><label class="lead-check"><input type="checkbox" data-insurance ${pkg.insurance?.include ? 'checked' : ''}><span>${t('build.insurance.include')}</span></label>
     ${pkg.insurance?.include ? `<p>${kindPill('quote')} ${t('build.insurance.quote')}</p>` : `<p class="micro-copy">${t('build.insurance.hint')}</p>`}
     ${url ? `<p class="micro-copy"><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${t('build.insurance.partner')}</a></p>` : ''}`;
  },
  itinerary() {
    const days = pkg.itinerary, movable = (d) => ['full', 'daytrip', 'rest', 'free'].includes(d.kind);
    return `<h3 id="bh-itinerary">${icon('calendar')}${t('build.itinerary.title')}</h3><p class="micro-copy">${t('build.itinerary.hint')}${pkg.polish ? ' ' + t('build.ai.note') : ''}</p>
     <ol class="bk-days">${days.map((d, i) => `<li class="bk-day bk-day-${esc(d.kind)}"><div class="bk-day-head"><span class="day-number">${d.day}</span><div><strong>${esc(d.title)}</strong><small>${esc(longDay(d.date))}${pkg.stops?.length ? ' · ' + esc(L(pkg.stops[d.stop]?.name)) : ''}</small></div>
       ${movable(d) ? `<span class="bk-day-move"><button type="button" class="icon-button" data-day-up="${i}" aria-label="${esc(t('build.itinerary.up', { day: d.day }))}" ${i > 0 && movable(days[i - 1]) ? '' : 'disabled'}>▲</button><button type="button" class="icon-button" data-day-down="${i}" aria-label="${esc(t('build.itinerary.down', { day: d.day }))}" ${i < days.length - 1 && movable(days[i + 1]) ? '' : 'disabled'}>▼</button></span>` : ''}</div>
       ${d.items.length ? `<ul>${d.items.map((x, j) => `<li><a href="${esc(x.mapsUrl)}" target="_blank" rel="noopener noreferrer">${esc(x.name)}</a> <small>${x.durationH ? t('build.itinerary.hours', { hours: x.durationH }) : ''}</small><button type="button" class="link-button" data-remove-item="${i}:${j}" aria-label="${esc(t('build.itinerary.remove', { name: x.name }))}">✕</button></li>`).join('')}</ul>` : ''}
       ${d.note ? `<p class="micro-copy">${esc(d.note)}</p>` : ''}${dayMoreHtml(d, i)}</li>`).join('')}</ol>
     ${pkg.spare?.length ? `<details class="bk-spare"><summary>${t('build.itinerary.spare', { count: pkg.spare.length })}</summary><ul>${pkg.spare.map((x, k) => `<li><a href="${esc(x.mapsUrl)}" target="_blank" rel="noopener noreferrer">${esc(x.name)}</a> <button type="button" class="link-button" data-add-spare="${k}">${t('build.itinerary.add')}</button></li>`).join('')}</ul></details>` : ''}`;
  },
  practical() {
    const p = pkg.practical || {};
    const rows = [['visa', p.visa], ['currency', p.currency], ['language', p.language], ['timeZone', p.timeZone && timeVsIsrael(p.timeZone, new Date((pkg.request.start || new Date().toISOString().slice(0, 10)) + 'T12:00:00Z'))], ['kosher', p.kosher], ['shabbat', p.shabbat], ['season', p.season]].filter(([, v]) => v);
    return `<h3 id="bh-practical">${icon('shield')}${t('build.practical.title')}</h3><dl class="bk-practical">${rows.map(([k, v]) => `<div class="${(k === 'kosher' && pkg.request.needs.kosher) || (k === 'shabbat' && pkg.request.needs.shabbat) ? 'bk-flag' : ''}"><dt>${t(`build.practical.${k}`)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><p class="micro-copy">${esc(p.check || t('build.practical.check'))}</p>`;
  },
  total() {
    const pr = pricePackage(pkg, getFx()), label = (l) => l.name || t(`build.line.${l.id.split(':')[0]}`, { place: l.stop !== undefined && pkg.stops?.length ? L(pkg.stops[l.stop]?.name) : '' });
    const value = (l) => l.kind === 'live' ? `<strong dir="ltr">${esc(l.ils === null ? formatOriginal(l.price) : formatIls(l.ils))}</strong>` : l.kind === 'estimate' ? (l.range ? range(l.range.low, l.range.high) : `<span class="bk-range" dir="ltr">${esc(formatOriginal({ value: l.original.low, currency: l.original.currency }))} – ${esc(formatOriginal({ value: l.original.high, currency: l.original.currency }))}</span>`) : l.kind === 'pending' ? `<span class="bk-pending">${t('build.kind.pending')}</span>` : `<span>${t('build.price.byRep')}</span>`;
    return `<h3 id="bh-total">${icon('tag')}${t('build.total.title')}</h3><table class="bk-lines"><tbody>${pr.lines.map((l) => `<tr><th scope="row">${esc(label(l))}<br>${kindPill(l.kind)}</th><td>${value(l)}${l.at ? `<small>${esc(checked(l.at))}</small>` : ''}</td></tr>`).join('')}</tbody></table>
     ${pr.total ? `<div class="bk-sum"><p>${t('build.total.live')} <strong dir="ltr">${esc(formatIls(pr.total.live))}</strong></p><p>${t('build.total.withEstimate')} <strong>${range(pr.total.low, pr.total.high)}</strong></p>
       <p class="micro-copy">${t('build.total.perPerson', { live: esc(formatIls(pr.perPerson.live)), low: esc(formatIls(pr.perPerson.low)), high: esc(formatIls(pr.perPerson.high)), count: pr.people })}</p></div>` : pr.missingFx ? `<p class="micro-copy">${t('build.total.noFx')}</p>` : ''}
     ${pr.budget ? budgetHtml(pr) : ''}
     <div class="bk-legend"><p>${kindPill('live')} ${t('build.legend.live')}</p><p>${kindPill('estimate')} ${t('build.legend.estimate')}</p><p>${kindPill('quote')} ${t('build.legend.quote')}</p></div>
     ${getFx() ? `<p class="micro-copy">${esc(fxNote())}</p>` : ''}`;
  },
  // Above the cards: an over-budget package is never shown as if it fits (spec 28 §א.5).
  banner() {
    const b = pricePackage(pkg, getFx()).budget;
    return b?.verdict === 'over' ? `<p class="bk-budget-banner">${t('build.budget.banner', { diff: esc(formatIls(b.diff)), budget: esc(formatIls(b.amount)) })} <a href="#bc-total" data-budget-jump>${t('build.budget.bannerLink')}</a></p>` : '';
  },
  upsell() { return upsellHtml(); },
  attractions() { return attractionsHtml(); },
  stay() { return stayHtml(); }
};

// ---- variety and expansions (owner 23.11.2026). The rules give every day up to three more ideas of other kinds and
// the catalog's details (what it is, a tip, a rough ticket price); "הרחב עם ג׳רבי" asks the model for a tip and extra
// ideas (marked AI, never a price). Everything works without a key.
const infoOf = (x) => (x?.dest && x?.en ? brochureData?.info?.[`${x.dest}|${x.en}`] : null) || null;
const imageOf = (x) => (x?.dest && x?.en ? tripImages[`${x.dest}|${x.en}`] : '') || '';
function ticketText(x) {
  const p = infoOf(x)?.ticketIls;
  if (!p || !Number.isFinite(p.high)) return '';
  return p.high <= 0 ? `<span class="bk-att-free">${t('build.att.free')}</span>` : `<span class="bk-att-price">${range(p.low, p.high)} <small>${t('build.att.perAdult')}</small> ${kindPill('estimate')}</span>`;
}
const attKind = (k) => t(`build.att.kind.${['landmark', 'museum', 'neighborhood', 'market', 'viewpoint', 'experience', 'park', 'nature', 'beach', 'religious', 'food', 'evening', 'daytrip'].includes(k) ? k : 'experience'}`);
const metaLine = (x) => [attKind(x.kind), x.area && !/^#/.test(x.area) ? x.area : '', x.durationH ? t('build.itinerary.hours', { hours: x.durationH }) : ''].filter(Boolean).map(esc).join(' · ');
function dayMoreHtml(d, i) {
  const can = ['full', 'arrival', 'move', 'daytrip', 'free', 'rest'].includes(d.kind) && (d.more?.length || pkg.config?.ai || d.items.some(infoOf));
  if (!can || pkg.sharedAt) return '';
  const open = openDays.has(i), ai = dayExpand[i];
  const head = `<button type="button" class="bk-more-toggle" data-day-more="${i}" aria-expanded="${open}" aria-controls="bk-more-${i}">${icon('spark')}${t(d.more?.length ? 'build.more.toggle' : 'build.more.toggleDetails', { count: d.more?.length || 0 })}</button>`;
  if (!open) return head;
  const details = d.items.map((x) => ({ x, info: infoOf(x) })).filter((y) => y.info?.about || y.info?.tip);
  const aiPart = !ai ? (pkg.config?.ai ? `<button type="button" class="button secondary bk-expand" data-expand-day="${i}">${icon('spark')}${t('build.more.expand')}</button>` : '')
    : ai.state === 'loading' ? `<p class="bk-pending" aria-busy="true">${t('build.more.loading')}</p>`
    : ai.state === 'none' ? `<p class="micro-copy">${t('build.more.none')}</p>`
    : `<div class="bk-ai-box">${ai.tip ? `<p><strong>${t('build.more.tip')}</strong> ${esc(ai.tip)}</p>` : ''}${ai.ideas?.length ? `<ul class="bk-more-list">${ai.ideas.map((x, k) => `<li><div><a href="${esc(x.mapsUrl)}" target="_blank" rel="noopener noreferrer">${esc(x.name)}</a> <small>${esc(attKind(x.kind))}</small><p class="micro-copy">${esc(x.why)}</p></div>${x.added ? `<span class="bk-added">${t('build.more.added')}</span>` : `<button type="button" class="button secondary" data-add-idea="${i}:${k}">${t('build.itinerary.add')}</button>`}</li>`).join('')}</ul>` : ''}<p class="micro-copy bk-ai">${t('build.more.aiNote')}</p></div>`;
  return head + `<div class="bk-day-more" id="bk-more-${i}">
    ${details.length ? `<ul class="bk-day-details">${details.map(({ x, info }) => `<li><strong>${esc(x.name)}</strong>${info.about ? ` ${esc(L(info.about))}` : ''}${info.tip ? `<br><small><b>${t('build.more.tip')}</b> ${esc(L(info.tip))}</small>` : ''} ${ticketText(x)}</li>`).join('')}</ul>` : ''}
    ${d.more?.length ? `<h5>${t('build.more.title')}</h5><ul class="bk-more-list">${d.more.map((x, k) => `<li>${imageOf(x) ? `<img src="${esc(imageOf(x))}" alt="" loading="lazy" width="64" height="48" data-fallback>` : ''}<div><a href="${esc(x.mapsUrl)}" target="_blank" rel="noopener noreferrer">${esc(x.name)}</a> <small>${metaLine(x)}</small>${infoOf(x)?.about ? `<p class="micro-copy">${esc(L(infoOf(x).about))}</p>` : ''} ${ticketText(x)}</div><button type="button" class="button secondary" data-add-more="${i}:${k}">${t('build.itinerary.add')}</button></li>`).join('')}</ul>` : ''}
    ${aiPart}</div>`;
}
// Adds an item to a day and takes it out of every list of ideas (spare, other days' ideas).
function addToDay(day, x) {
  day.items.push(x);
  const sameItem = (y) => y.name === x.name && (y.dest || '') === (x.dest || '');
  pkg.spare = (pkg.spare || []).filter((y) => !sameItem(y));
  for (const d of pkg.itinerary) if (d.more) d.more = d.more.filter((y) => !sameItem(y));
  if (day.kind === 'free') { day.kind = 'full'; day.note = ''; day.title = x.name; }
  for (const a of pkg.attractions || []) if (sameItem(a)) a.day = day.day;
}
// Where a place from the attractions list goes: a full day in its area with room, else a free day, else the lightest.
function bestDayFor(x) {
  const days = pkg.itinerary.filter((d) => ['full', 'free'].includes(d.kind) && (!pkg.stops?.length || L(pkg.stops[d.stop]?.name) === x.where || pkg.stops[d.stop]?.id === x.dest));
  const pool = days.length ? days : pkg.itinerary.filter((d) => ['full', 'free'].includes(d.kind));
  return pool.find((d) => d.kind === 'full' && d.items.length < 4 && d.items.some((y) => y.area && y.area === x.area)) || pool.find((d) => d.kind === 'free')
    || [...pool].sort((a, b) => a.items.length - b.items.length)[0] || pkg.itinerary[0];
}
async function expandDay(i) {
  const d = pkg.itinerary[i], mine = version;
  dayExpand[i] = { state: 'loading' }; paint('itinerary'); $(`[data-day-more="${i}"]`, view)?.focus();
  const known = [...(pkg.spare || []), ...pkg.itinerary.flatMap((x) => [...x.items, ...(x.more || [])])].map((x) => x.name);
  try {
    const where = L((pkg.stops?.length ? pkg.stops[d.stop] : pkg.destination)?.name);
    const data = await post('/api/build/expand', { kind: 'day', destination: where, travellers: travellersText(pkg.request), area: d.items.find((x) => x.area && !/^#/.test(x.area))?.area || '', planned: d.items.map((x) => x.name), known });
    if (mine !== version) return;
    dayExpand[i] = data.expand ? { state: 'ok', tip: data.expand.tip, ideas: (data.expand.ideas || []).map((x) => ({ ...x, mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${x.name}, ${where}`)}`, where })) } : { state: 'none' };
  } catch { if (mine === version) dayExpand[i] = { state: 'none' }; }
  if (mine !== version) return;
  paint('itinerary'); announce(dayExpand[i].state === 'ok' ? t('build.more.ready', { day: d.day }) : t('build.more.none'));
}

// ---- the attractions section: the destination's places that suit these travellers, with photo, area, time, a rough
// ticket price and whether (and when) they are in the plan; one tap adds one to a day.
function attractionsHtml() {
  const list = pkg.attractions || [];
  if (!list.length) return '';
  const shown = showAllAttractions ? list : list.slice(0, 6), multi = new Set(list.map((a) => a.dest)).size > 1;
  return `<h3 id="bh-attractions">${icon('pin')}${t('build.att.title', { place: esc((pkg.stops?.length ? [...new Set(pkg.stops.map((s) => L(s.name)))] : [L(pkg.destination.name)]).join(', ')) })}</h3>
   <p class="micro-copy">${t('build.att.intro')}</p>
   <ul class="bk-attractions">${shown.map((a) => { const k = list.indexOf(a), img = imageOf(a), info = infoOf(a); return `<li class="bk-att photo-place-card${a.must ? ' bk-att-must' : ''}">
    <div class="photo-place-frame"><div class="bk-att-img">${img ? `<img src="${esc(img)}" alt="" loading="lazy" data-fallback>` : `<span class="bk-att-ph" aria-hidden="true">${icon('pin')}</span>`}${a.must ? `<span class="bk-att-badge">${t('build.att.must')}</span>` : ''}</div>
    <h4 class="photo-place-caption"><a href="${esc(a.mapsUrl)}" target="_blank" rel="noopener noreferrer">${esc(a.name)}</a></h4></div>
    <div class="bk-att-body">
     <p class="bk-att-meta">${metaLine(a)}${multi ? ` · ${esc(a.where)}` : ''}</p>
     ${info?.about ? `<p class="bk-att-about">${esc(L(info.about))}</p>` : ''}
     <p class="bk-att-tags">${ticketText(a)}${a.tags.map((x) => `<span class="pill">${esc(t(`build.att.tag.${x}`))}</span>`).join('')}${a.offSeason ? `<span class="pill pill-warn">${t('build.att.offSeason')}</span>` : ''}</p>
     ${a.day ? `<p class="bk-att-in">${icon('calendar')}${t('build.att.inPlan', { day: a.day })}</p>` : `<button type="button" class="button secondary" data-add-att="${k}">${t('build.att.add')}</button>`}</div></li>`; }).join('')}</ul>
   ${list.length > 6 ? `<button type="button" class="link-button" data-more-att aria-expanded="${showAllAttractions}">${showAllAttractions ? t('build.att.less') : t('build.att.more', { count: list.length })}</button>` : ''}`;
}

// ---- where to sleep: the catalog's areas of each stop – who it suits, how many planned places are there, the one
// chosen for the hotel search (another one in one tap) and, with Gerbi, pros / cons / price level.
function stayHtml() {
  const stops = pkg.stops?.length ? pkg.stops : [pkg.destination], groups = hotelGroups();
  const blocks = stops.map((s, i) => ({ s, i, areas: pkg.areas?.[i] || [] })).filter((b) => b.areas.length > 1 || (b.areas.length && !pkg.stops?.length));
  if (!blocks.length || pkg.sharedAt) return '';
  const planned = pkg.itinerary.flatMap((d) => d.items.map((x) => ({ ...x, stop: d.stop })));
  return `<h3 id="bh-stay">${icon('hotel')}${t('build.stay.title')}</h3><p class="micro-copy">${t('build.stay.intro')}</p>` + blocks.map(({ s, i, areas }) => {
    const chosen = groups[i]?.area ? L(groups[i].area.name) : '', ai = stayExpand[i];
    const pro = (a) => ai?.state === 'ok' ? ai.areas.find((x) => x.name.trim().toLowerCase() === L(a.name).trim().toLowerCase()) : null;
    return `${blocks.length > 1 ? `<h4>${esc(L(s.name))}</h4>` : ''}<ul class="bk-stay">${areas.map((a) => {
      const near = planned.filter((x) => x.stop === i && x.area && (x.area === a.name.en || x.area === L(a.name))), here = chosen && chosen === L(a.name), p = pro(a);
      return `<li class="bk-stay-area photo-place-card${here ? ' current' : ''}"><div><strong>${esc(L(a.name))}</strong>${here ? ` <span class="bk-current">${t('build.stay.chosen')}</span>` : ''}${p?.price ? ` <span class="pill">${t(`build.stay.price.${p.price}`)}</span>` : ''}
        <p>${esc(L(a.forWhom))}</p>${near.length ? `<p class="micro-copy">${t('build.stay.near', { count: near.length, list: esc(near.slice(0, 3).map((x) => x.name).join(', ')) })}</p>` : ''}
        ${p ? `<p class="bk-stay-pc"><span>👍 ${esc(p.pros)}</span>${p.cons ? `<span>👎 ${esc(p.cons)}</span>` : ''}</p>` : ''}</div>
        ${!here && pkg.hotelSearches?.[i] ? `<button type="button" class="button secondary" data-stay-area="${i}" data-value="${esc(a.name.en || L(a.name))}">${t('build.stay.pick')}</button>` : ''}</li>`;
    }).join('')}</ul>${!ai && pkg.config?.ai ? `<button type="button" class="button secondary bk-expand" data-expand-stay="${i}">${icon('spark')}${t('build.stay.expand')}</button>`
      : ai?.state === 'loading' ? `<p class="bk-pending" aria-busy="true">${t('build.more.loading')}</p>` : ai?.state === 'none' ? `<p class="micro-copy">${t('build.more.none')}</p>` : ai?.state === 'ok' ? `<p class="micro-copy bk-ai">${t('build.more.aiNote')}</p>` : ''}`;
  }).join('');
}
async function expandStay(i) {
  const mine = version, s = (pkg.stops?.length ? pkg.stops : [pkg.destination])[i];
  stayExpand[i] = { state: 'loading' }; paint('stay');
  try {
    const data = await post('/api/build/expand', { kind: 'stay', destination: L(s.name), travellers: travellersText(pkg.request), areas: (pkg.areas?.[i] || []).map((a) => ({ name: L(a.name), forWhom: L(a.forWhom) })) });
    if (mine !== version) return;
    stayExpand[i] = data.expand?.areas?.length ? { state: 'ok', areas: data.expand.areas } : { state: 'none' };
  } catch { if (mine === version) stayExpand[i] = { state: 'none' }; }
  if (mine === version) { paint('stay'); announce(stayExpand[i].state === 'ok' ? t('build.stay.ready') : t('build.more.none')); }
}
function setHotelArea(i, value) {
  const area = (pkg.areas[i] || []).find((a) => (a.name.en || L(a.name)) === value);
  hotelGroups()[i].area = area || null; fetchHotels(version, i, value); paint('stay');
}
// The budget box of the total card: within (with what is left), over (closest + three ways out), or not yet known.
function budgetHtml(pr) {
  const b = pr.budget, money = (v) => esc(formatIls(v)), all = pkg.fit?.steps || [], steps = all.filter((s) => s !== 'restored');
  const restored = all.includes('restored') ? `<p class="micro-copy">${t('build.budget.restored', { stars: hotelGroups()[0]?.minStars || '' })}</p>` : '';
  const scope = b.ground ? `<p class="micro-copy">${t('build.budget.scope')}</p>` : '';
  // Up to 10% over: the perfect trip, said warmly with the gap (owner 18.11.2026) – no alarm, no downgrade.
  if (b.verdict === 'near') return `<div class="bk-budget bk-budget-within bk-budget-near"><p><strong>${t('build.budget.near', { diff: money(b.diff), budget: money(b.amount) })}</strong></p>${scope}${steps.length ? `<p class="micro-copy">${t('build.budget.steps', { list: steps.map((s) => t(`build.budget.step.${s}`)).join(', ') })}</p>` : ''}</div>`;
  if (b.verdict === 'within') return `<div class="bk-budget bk-budget-within"><p>${t('build.budget.within', { budget: money(b.amount), left: money(b.left) })}</p>${scope}${restored}${steps.length ? `<p class="micro-copy">${t('build.budget.steps', { list: steps.map((s) => t(`build.budget.step.${s}`)).join(', ') })}</p>` : ''}</div>`;
  if (b.verdict !== 'over') {
    const plan = pkg.budgetPlan;
    return `<p class="bk-budget bk-budget-${b.verdict}">${t(`build.total.budget.${b.verdict}`, { budget: money(b.amount) })}</p>${b.verdict === 'unverified' && plan && !plan.fits ? budgetActions({ overBy: plan.overBy, raiseTo: plan.raiseTo, nights: plan.nights }, b.amount) : ''}`;
  }
  return budgetActions({ overBy: b.diff, raiseTo: Math.ceil(b.cost / 100) * 100, nights: pkg.fit?.nights || pkg.budgetPlan?.nights }, b.amount, steps);
}
function budgetActions({ overBy, raiseTo, nights }, amount, steps = []) {
  const alts = (pkg.budgetPlan?.alternatives || []).filter((a) => a.id !== pkg.destination.id);
  return `<div class="bk-budget bk-budget-over"><p><strong>${t('build.budget.over', { diff: esc(formatIls(overBy)), budget: esc(formatIls(amount)) })}</strong></p>
    ${steps.length ? `<p class="micro-copy">${t('build.budget.steps', { list: steps.map((s) => t(`build.budget.step.${s}`)).join(', ') })}</p>` : ''}
    <p class="micro-copy">${t('build.budget.overLead')}</p>
    <div class="bk-budget-acts" role="group" aria-label="${esc(t('build.budget.overLead'))}">
     ${nights && nights < pkg.request.nights ? `<button type="button" class="button secondary" data-budget-act="nights" data-value="${nights}">${t('build.budget.act.nights', { nights })}</button>` : ''}
     ${alts.map((a) => `<button type="button" class="button secondary" data-budget-act="dest" data-value="${esc(a.id)}">${t('build.budget.act.dest', { place: esc(L(a.name)) })}</button>`).join('')}
     <button type="button" class="button yellow" data-budget-act="raise" data-value="${raiseTo}">${t('build.budget.act.raise', { amount: esc(formatIls(raiseTo)) })}</button>
    </div></div>`;
}

// ---- "add up to ₪500 and get…" (spec 28 §ב): an accessible scroll-snap carousel next to the total.
let offers = [];
const offerTitle = (o) => (o.type === 'trip' ? o.name : t(`build.upsell.${o.type}.title`, { stars: o.stars, board: o.board ? t(`build.board.${o.board}`) : '' }));
const offerWhat = (o) => (o.type === 'trip' ? esc(o.note || t('build.upsell.trip.what')) : t(`build.upsell.${o.type}.what`, { stars: o.stars, carriers: esc((o.carriers || []).join(' + ')), nights: o.nights, was: pkg.request.nights }));
const offerIcon = (o) => (o.type === 'direct' || o.type === 'bag' ? 'plane' : o.type === 'trip' ? 'pin' : 'hotel');
function upsellHtml() {
  offers = pkg.sharedAt ? [] : upsellOffers(pkg, getFx(), { trips: pkg.upsellTrips || [], images: tripImages });
  if (!offers.length) return '';
  const rtl = document.documentElement.dir === 'rtl';
  return `<h3 id="bh-upsell">${icon('spark')}${t('build.upsell.title')}</h3><p class="micro-copy">${t('build.upsell.intro')}</p>
   <div class="bk-carousel" role="region" aria-roledescription="carousel" aria-label="${esc(t('build.upsell.label'))}">
    <ul class="bk-car-track">${offers.map((o, i) => `<li class="bk-car-slide" role="group" aria-roledescription="slide" aria-label="${esc(t('build.upsell.slide', { n: i + 1, count: offers.length }))}: ${esc(offerTitle(o))}">
     <div class="bk-car-img">${o.image ? `<img src="${esc(o.image)}" alt="" loading="lazy" data-fallback>` : ''}<span class="bk-car-badge" aria-hidden="true">${icon(offerIcon(o))}</span></div>
     <div class="bk-car-body"><h4>${esc(offerTitle(o))}</h4><p>${offerWhat(o)}</p>
      <p class="bk-car-price"><strong>${t(o.exact ? 'build.upsell.exact' : 'build.upsell.estimate', { amount: `<bdi dir="ltr">+${esc(formatIls(o.extra))}</bdi>` })}</strong> <span class="bk-kind bk-${o.exact ? 'live' : 'estimate'}">${t(o.exact ? 'build.upsell.kind.exact' : 'build.upsell.kind.estimate')}</span></p>
      <button type="button" class="button yellow" data-upsell="${i}">${t('build.upsell.add')}</button></div></li>`).join('')}</ul>
    ${offers.length > 1 ? `<div class="bk-car-nav"><button type="button" class="icon-button" data-carousel="-1" aria-label="${esc(t('build.upsell.prev'))}">${rtl ? '›' : '‹'}</button><span class="micro-copy" data-car-pos aria-hidden="true">1 / ${offers.length}</span><button type="button" class="icon-button" data-carousel="1" aria-label="${esc(t('build.upsell.next'))}">${rtl ? '‹' : '›'}</button></div>` : ''}
   </div>`;
}
// The slide whose start edge is nearest the track's start edge (works for RTL negative scroll and LTR alike).
function currentSlide(track) {
  const slides = [...track.children], box = track.getBoundingClientRect(), rtl = getComputedStyle(track).direction === 'rtl';
  const edge = (r) => Math.abs(rtl ? box.right - r.right : r.left - box.left);
  return slides.reduce((best, s, i) => (edge(s.getBoundingClientRect()) < edge(slides[best].getBoundingClientRect()) ? i : best), 0);
}
function moveCarousel(root, dir, focus = false) {
  const track = root.querySelector('.bk-car-track'), slides = [...(track?.children || [])];
  if (!slides.length) return;
  const next = slides[Math.min(slides.length - 1, Math.max(0, currentSlide(track) + dir))];
  const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  track.scrollTo({ left: track.scrollLeft + (next.getBoundingClientRect()[getComputedStyle(track).direction === 'rtl' ? 'right' : 'left'] - track.getBoundingClientRect()[getComputedStyle(track).direction === 'rtl' ? 'right' : 'left']), behavior: smooth ? 'smooth' : 'auto' });
  const pos = root.querySelector('[data-car-pos]');
  if (pos) pos.textContent = `${slides.indexOf(next) + 1} / ${slides.length}`;
  if (focus) next.querySelector('button')?.focus({ preventScroll: true });
}
// Spec 25: the chosen flight can be booked on the site while its search is fresh (the supplier token lives an hour).
// Flights only – hotels stay quoted by an agent while HOTELS_PUBLIC_DISPLAY is off.
let bookingEnabled = false;
const bookable = (f) => bookingEnabled && f?.booking?.srk && !pkg?.sharedAt && Date.now() - Date.parse(f.searchedAt || 0) < 45 * 60_000 && Boolean(selectedFlight(pkg)?.offerIndex);
function paint(part) {
  const host = view && $(`#bc-${part}`, view);
  if (!host || !pkg?.destination) return;
  const focus = document.activeElement && host.contains(document.activeElement) ? [...host.querySelectorAll('button,select,input,a')].indexOf(document.activeElement) : -1;
  host.innerHTML = PAINT[part]();
  if (part === 'upsell' || part === 'banner') host.hidden = !host.innerHTML.trim();
  host.toggleAttribute('aria-busy', host.querySelector('[aria-busy="true"]') !== null);
  wireImages(host);
  if (focus >= 0) host.querySelectorAll('button,select,input,a')[focus]?.focus();
}

// ---- hand-off to a representative (lead type "package")
function paintLead() {
  const host = $('#bc-lead', view);
  host.hidden = false;
  host.innerHTML = `<h3 tabindex="-1">${t('build.lead.title')}</h3><p class="micro-copy">${t('build.lead.intro')}</p>
   <form id="build-lead" class="lead-form" novalidate>
    ${[['name', 'text', 'autocomplete="name" maxlength="80" required'], ['phone', 'tel', 'autocomplete="tel" inputmode="tel" dir="ltr" maxlength="20" required placeholder="050-1234567"'], ['email', 'email', `autocomplete="email" dir="ltr" maxlength="${LIMITS.email}"`]].map(([n, type, attrs]) => `<div class="lead-field" data-field="${n}"><label for="bl-${n}">${t(`leads.field.${n}`)}</label><input id="bl-${n}" name="${n}" type="${type}" ${attrs} aria-describedby="bl-${n}-error"><p class="lead-error" id="bl-${n}-error" hidden></p></div>`).join('')}
    <fieldset class="lead-field lead-choices" data-field="channel"><legend>${t('leads.field.channel')}</legend>${Object.keys(CHANNELS).map((v, i) => `<label class="lead-chip"><input type="radio" name="channel" value="${v}" ${i === 0 ? 'checked' : ''}><span>${optionLabel('channel', v)}</span></label>`).join('')}<p class="lead-error" hidden></p></fieldset>
    <div class="lead-field" data-field="consent"><label class="lead-check"><input type="checkbox" name="consent" required aria-describedby="bl-consent-error"><span>${consentText()}</span></label><p class="lead-error" id="bl-consent-error" hidden></p></div>
    <label class="lead-check lead-marketing"><input type="checkbox" name="marketing"><span>${t('leads.marketing')}</span></label>
    <div class="lead-trap" aria-hidden="true"><label>${t('leads.trap')}<input name="website" tabindex="-1" autocomplete="off"></label></div>
    <p class="lead-form-error" role="alert" hidden></p>
    <button type="submit" class="button yellow full-width">${t('build.lead.submit')}</button></form>`;
  // After a flight booking on this device: the same lead traveller and contact (hotel in one click, spec 25 §9).
  prefillFromBooking($('#build-lead', host));
}
async function submitLead(form) {
  const d = new FormData(form), snapshot = sanitizePackage(pkg);
  const input = { type: 'package', name: String(d.get('name') || ''), phone: String(d.get('phone') || ''), email: String(d.get('email') || '').trim(), channel: String(d.get('channel') || ''),
    consent: d.get('consent') === 'on', marketing: d.get('marketing') === 'on', website: String(d.get('website') || ''), source: '/build', lang, ...packageLeadFields(snapshot, lang), package: snapshot };
  const { errors } = validateLead(input, { lang });
  form.querySelectorAll('[data-field]').forEach((box) => { const m = errors[box.dataset.field], slot = box.querySelector('.lead-error'); if (slot) { slot.textContent = m || ''; slot.hidden = !m; } box.classList.toggle('invalid', Boolean(m)); });
  const formError = $('.lead-form-error', form);
  if (Object.keys(errors).length) { form.querySelector('.invalid input')?.focus(); return; }
  const button = $('[type=submit]', form); button.disabled = true;
  try {
    const response = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(errorText(data.error, data.message, 'leads'));
    const host = $('#bc-lead', view);
    host.innerHTML = `<h3 tabindex="-1">${t('build.lead.done')}</h3><p>${t('build.lead.doneText', { ref: `<bdi dir="ltr">${esc(data.id)}</bdi>` })}</p><a class="button secondary" href="#/account">${t('build.lead.account')}</a>`;
    $('h3', host).focus(); announce(t('build.lead.done')); leadSent = true; track('lead_sent');
  } catch (error) { formError.textContent = error.message || t('build.err.generic'); formError.hidden = false; button.disabled = false; }
}

// ---- save / share / print
async function snapshotId() {
  const current = pkg, snapshot = sanitizePackage(current), version = JSON.stringify(snapshot);
  if (current.sharedId && current.sharedVersion === version) return current.sharedId;
  const data = await post('/api/build/share', { package: snapshot });
  current.sharedId = data.id; current.sharedVersion = version;
  return data.id;
}
const shareUrl = (id) => `${location.origin}${location.pathname}#/build?p=${id}`;
const title = () => `${(pkg.stops?.length ? pkg.stops : [pkg.destination]).map((s) => L(s.name)).join(' ← ')} · ${longDay(pkg.request.start)}`;
function savedList() { try { const v = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); return Array.isArray(v) ? v.filter((x) => /^[a-f0-9]{16}$/.test(x?.id)).slice(0, 20) : []; } catch { return []; } }
async function save(status) {
  const id = await snapshotId(), entry = { id, title: title(), savedAt: new Date().toISOString() };
  let local = true; try { localStorage.setItem(SAVED_KEY, JSON.stringify([entry, ...savedList().filter((x) => x.id !== id)].slice(0, 20))); } catch { local = false; }
  // Only a signed-in customer has an account list; a guest keeps it on this device (no 401 noise).
  await accountReady.catch(() => {});
  const response = account.user ? await fetch('/api/account/packages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, title: entry.title, lang }) }).catch(() => null) : null;
  status.innerHTML = response?.ok ? t('build.save.account') : `${local ? t('build.save.device') : t('build.save.failedDevice')} <a href="#/account">${t('build.save.signIn')}</a>`;
}
async function share(status) {
  const url = shareUrl(await snapshotId());
  try { if (navigator.share) { await navigator.share({ title: title(), url }); return; } await navigator.clipboard.writeText(url); status.textContent = t('build.share.copied'); }
  catch (error) { if (error?.name !== 'AbortError') status.innerHTML = `${t('build.share.manual')} <input class="bk-share-url" readonly value="${esc(url)}" aria-label="${esc(t('build.share.link'))}">`; }
}
function persist() { try { sessionStorage.setItem(CURRENT_KEY, JSON.stringify({ input: lastInput, pkg })); } catch { /* convenience only */ } }

// ---- itinerary edits (local, no rebuild)
function moveDay(i, delta) {
  const days = pkg.itinerary, j = i + delta, a = days[i], b = days[j];
  if (!b) return;
  for (const key of ['kind', 'title', 'items', 'note', 'more', 'ideas']) [a[key], b[key]] = [b[key], a[key]];
  paint('itinerary'); persist();
  $(`[data-day-${delta < 0 ? 'up' : 'down'}="${j}"]`, view)?.focus();
  announce(t('build.itinerary.moved', { from: a.day, to: b.day }));
}

// ---- the page
async function openShared(id) {
  showBuilderThread();
  const out = $('#build-result');
  out.setAttribute('aria-busy', 'true'); out.innerHTML = skeletonHtml();
  try {
    const response = await fetch(`/api/build/share/${encodeURIComponent(id)}`), data = await response.json();
    if (!response.ok || !data.package) throw new Error();
    pkg = { ...data.package, understood: [], assumed: [], questions: [], suggestions: [], areas: [], spare: [], highlights: [] };
    lastInput = { text: pkg.request.text, chosen: pkg.destination.id };
    render(); $('#build-result h2')?.focus();
  } catch { out.removeAttribute('aria-busy'); out.innerHTML = `<p class="notice">${t('build.shared.missing')}</p>`; }
}
function refreshFromSnapshot() {
  rebuildCurrent({});
}

function page({ view: host, footer }) {
  view = host;
  const params = new URLSearchParams(location.hash.split('?')[1] || ''), q = params.get('q') || '', dest = params.get('dest') || '', shared = params.get('p') || '';
  stopDecor();
  view.innerHTML = `<div class="build-page gb-page">
   <div class="route-width planner-page gb-stage">
    ${plannerHeaderHtml(t('build.title'), `<a href="#/planner" class="planner-new">${icon('compass')}${t('pages.footer.8')}</a>`)}
    <div class="planner-workspace">
     <aside class="planner-sidebar">
      ${plannerLinksHtml()}
      ${preferencesHtml()}
     </aside>
     <section class="planner-conversation is-welcome gb-intake" aria-label="${esc(t('build.input.label'))}">
      <div class="gb-welcome">${plannerWelcomeHtml(t('build.welcome'))}</div>
      <div class="planner-dock">
       ${inputHtml(q)}
       <p class="build-error" role="alert" hidden></p>
       ${plannerStartersHtml(EXAMPLES.map((key, i) => [EXAMPLE_ICONS[i], t(key + '.short'), t(key + '.detail'), key]), { builder: true })}
       <small id="build-hint" class="planner-disclosure">${t('build.input.hint')}</small>
      </div>
     </section>
    </div>
   </div>
   <div class="route-width gb-thread">
    <p id="build-status" class="sr-only" aria-live="polite"></p>
    <div class="gb-you" hidden><p></p></div>
    <div id="build-result" class="build-result"></div>
    <p class="micro-copy build-disclaimer">${t('build.disclaimer')}</p>
   </div>${chatHtml()}</div>${footer}`;
  const area = $('#build-text', view);
  decor = [slingTop(t('build.toTop')), mountFloatingComposer($('#bc-chat', view))];
  const grow = () => { area.style.height = 'auto'; area.style.height = Math.min(area.scrollHeight, 240) + 'px'; };
  area.addEventListener('input', grow); grow();
  area.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); $('#build-form', view).requestSubmit(); } });
  // Enter sends a follow-up too (Shift+Enter for a new line).
  $('#build-follow-text', view).addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); e.target.form.requestSubmit(); } });
  const chatTools = $('.bk-chat-tools', view);
  chatTools.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !chatTools.open) return;
    e.preventDefault(); chatTools.open = false; $('summary', chatTools).focus();
  });
  chatTools.addEventListener('focusout', (e) => {
    if (e.relatedTarget && !chatTools.contains(e.relatedTarget)) chatTools.open = false;
  });
  loadFx(); track('view'); loadFacts().catch(() => {}); // warm the destination fact deck
  if (shared && /^[a-f0-9]{16}$/.test(shared)) openShared(shared);
  else if (q || dest) build({ text: q, dest });
  else {
    try { const saved = JSON.parse(sessionStorage.getItem(CURRENT_KEY) || 'null'); if (saved?.pkg?.destination) { pkg = saved.pkg; lastInput = saved.input; for (const g of [pkg.flights, ...hotelGroups()]) if (g.status === 'pending') g.status = 'quote'; $('#build-text').value = saved.input?.text || ''; render(); } else { const last = lastConversation(); if (last) { $('#build-result').innerHTML = resumeHtml(last); track('resume_shown'); } } } catch { /* fresh start */ }
  }
}

// Spec 27: print/PDF = a designed brochure, not the screen. Also catches ⌘P while a package is shown.
let brochureData = null, preparingBrochure = false;
function mountBrochure(link = '') {
  if (!pkg?.destination || !view?.isConnected) return false;
  document.getElementById('bk-brochure')?.remove();
  const box = document.createElement('div'); box.id = 'bk-brochure'; box.className = 'br'; box.setAttribute('aria-hidden', 'true');
  box.innerHTML = brochureHtml(pkg, { esc, L, longDay, fare, formatIls, totals: () => pricePackage(pkg, getFx()), hotelGroups, shareUrl: () => link, icon }, brochureData || undefined);
  document.body.append(box); document.documentElement.classList.add('printing-brochure'); return box;
}
function unmountBrochure() { document.getElementById('bk-brochure')?.remove(); document.documentElement.classList.remove('printing-brochure'); }
async function decodeBrochureImage(img) {
  try { await img.decode(); }
  catch {
    if (!img.dataset.fallback) { img.hidden = true; return; }
    img.src = img.dataset.fallback;
    await img.decode().catch(() => { img.hidden = true; });
  }
}
async function printBrochure() {
  if (preparingBrochure || !pkg?.destination) return;
  const current = pkg, activeView = view;
  const version = JSON.stringify(sanitizePackage(current));
  preparingBrochure = true;
  try {
    const [details, link] = await Promise.all([
      loadBrochureData().catch(() => null),
      Promise.race([snapshotId().then(shareUrl), new Promise((ok) => setTimeout(() => ok(''), 3000))]).catch(() => ''),
    ]);
    brochureData = details;
    if (current !== pkg || activeView !== view || !view?.isConnected) return;
    const box = mountBrochure(JSON.stringify(sanitizePackage(current)) === version ? link : '');
    const images = [...box.querySelectorAll('img')];
    const coverScript = box.querySelector('.br-cover-script')?.textContent;
    await Promise.race([
      Promise.all([
        ...images.map(decodeBrochureImage),
        document.fonts?.load('900 36pt Heebo', box.querySelector('h1').textContent).catch(() => {}),
        coverScript && document.fonts?.load('700 35pt "Amatic SC"', coverScript).catch(() => {}),
      ]),
      new Promise((ok) => setTimeout(ok, 4000)),
    ]);
    if (current !== pkg || activeView !== view || !box.isConnected) { unmountBrochure(); return; }
    for (const img of images) if (!img.naturalWidth) img.hidden = true;
    window.print();
  } finally {
    preparingBrochure = false;
  }
}
if (typeof window !== 'undefined') {
  addEventListener('beforeprint', () => { if (!document.getElementById('bk-brochure')) mountBrochure(); });
  addEventListener('afterprint', unmountBrochure);
}

let wired = false;
function wire() {
  bookingConfig().then((c) => { bookingEnabled = c.enabled === true; if (pkg?.flights?.status === 'live' && view?.isConnected) paint('flights'); }).catch(() => {});
  if (wired) return; wired = true;
  onFx(() => { if (pkg?.destination && view?.isConnected) { fitBudget(); repaintPrices(); } });
  // Upgrade carousel: arrow keys move between slides (visual direction, so RTL and LTR both feel right); Home / End.
  document.addEventListener('keydown', (e) => {
    const root = e.target.closest?.('.bk-carousel');
    if (!root || !view?.contains(root) || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const rtl = getComputedStyle(root).direction === 'rtl', n = root.querySelectorAll('.bk-car-slide').length;
    const dir = e.key === 'Home' ? -n : e.key === 'End' ? n : (e.key === 'ArrowRight') !== rtl ? 1 : -1;
    e.preventDefault(); moveCarousel(root, dir, true);
  });
  document.addEventListener('scroll', (e) => {
    const track = e.target?.classList?.contains('bk-car-track') ? e.target : null, pos = track?.closest('.bk-carousel')?.querySelector('[data-car-pos]');
    if (pos) pos.textContent = `${currentSlide(track) + 1} / ${track.children.length}`;
  }, { capture: true, passive: true });
  // Leaving: a desktop exit gesture offers to save / send the plan; leaving while it thinks is counted (no data).
  document.addEventListener('mouseout', (e) => { if (view?.isConnected && !e.relatedTarget && e.clientY <= 0) exitPrompt(); });
  window.addEventListener('pagehide', () => { if (thinking && view?.isConnected) track('abandon_thinking'); });
  document.addEventListener('submit', (e) => {
    if (!view?.contains(e.target)) return;
    if (e.target.id === 'build-form') {
      e.preventDefault();
      if ($('.build-submit', e.target).disabled) return;
      const text = $('#build-text').value.trim(), month = $('#build-month').value;
      const full = month !== '' ? `${text}${text ? ', ' : ''}${t('build.chip.when.phrase', { month: MONTHS[Number(month)] })}` : text;
      if (!full) { const err = $('.build-error', view); err.textContent = t('build.err.empty'); err.hidden = false; $('#build-text').focus(); return; }
      history.replaceState(null, '', `#/build?q=${encodeURIComponent(full)}`); track('submit'); build({ text: full, thread: [full] });
    } else if (e.target.id === 'build-edit') { e.preventDefault(); rebuildCurrent(editsFrom(e.target)); }
    else if (e.target.id === 'build-lead') { e.preventDefault(); submitLead(e.target); }
    else if (e.target.id === 'build-notify') { e.preventDefault(); sendNotify(e.target); }
    else if (e.target.id === 'build-follow') {
      e.preventDefault();
      const area = $('#build-follow-text', e.target), draft = area.value;
      followUp(draft)?.then((saved) => { if (saved && area.value === draft) area.value = ''; });
    }
  });
  document.addEventListener('change', (e) => {
    if (!view?.contains(e.target) || !pkg) return;
    if (e.target.matches('[data-insurance]')) { pkg.insurance = { include: e.target.checked }; paint('insurance'); paint('total'); paint('banner'); paint('upsell'); persist(); $('[data-insurance]', view)?.focus(); }
    if (e.target.matches('[data-car]')) { pkg.car.include = e.target.checked; pkg.manual = true; paint('car'); paint('total'); paint('banner'); paint('upsell'); persist(); $('[data-car]', view)?.focus(); }
    if (e.target.matches('[data-area]')) setHotelArea(Number(e.target.dataset.area), e.target.value);
  });
  document.addEventListener('click', async (e) => {
    const chatTools = $('.bk-chat-tools[open]');
    if (chatTools && !chatTools.contains(e.target)) chatTools.open = false;
    if (!view?.contains(e.target)) return;
    const el = (s) => e.target.closest(s);
    if (el('[data-example]')) { const area = $('#build-text'); area.value = t(el('[data-example]').dataset.example); area.dispatchEvent(new Event('input')); area.focus(); return; }
    if (el('[data-chip]')) { toggleChip(el('[data-chip]')); return; }
    if (el('[data-poll]')) {
      const b = el('[data-poll]'), [q, o] = b.dataset.poll.split('.'), host = b.closest('.bk-poll-host'), step = Number(b.closest('[data-poll-step]').dataset.pollStep);
      track('poll_answer');
      if (!['any', 'balanced'].includes(o)) pollChoices.push({ label: t(`build.poll.${q}.${o}`), say: t(`build.poll.${q}.${o}.say`) });
      if (host) host.innerHTML = pollHtml(step + 1);
      paintPollApply();
      host?.querySelector('button, [tabindex="-1"]')?.focus({ preventScroll: true });
      return;
    }
    if (el('[data-resume]')) { const last = lastConversation(); if (el('[data-resume]').dataset.resume === 'go' && last) { track('resume_used'); $('#build-text').value = last.input.thread?.[0] || last.input.text || ''; build(last.input); } else { try { localStorage.removeItem(LAST_KEY); } catch { /* fine */ } $('#build-result').innerHTML = ''; $('#build-text').focus(); } return; }
    if (!pkg) return;
    if (el('[data-choose]')) { build({ ...lastInput, chosen: el('[data-choose]').dataset.choose }); return; }
    if (el('[data-build-jump]')) {
      const section = $(`#bc-${el('[data-build-jump]').dataset.buildJump}`, view);
      section?.scrollIntoView({ block: 'start' });
      const heading = $('h3', section || view);
      heading?.setAttribute('tabindex', '-1');
      heading?.focus({ preventScroll: true });
      return;
    }
    if (el('[data-continue]')) { track('option_continue'); const id = el('[data-continue]').dataset.continue; build({ ...lastInput, thread: lastInput?.thread || [lastInput?.text || ''], chosen: id, current: undefined }); return; }
    if (el('[data-say]')) { track(el('[data-poll-apply]') ? 'poll_apply' : 'chip'); if (el('[data-poll-apply]')) pollChoices = []; followUp(el('[data-say]').dataset.say); return; }
    if (el('[data-book-flight]')) {
      const button = el('[data-book-flight]'), pick = selectedFlight(pkg), f = pkg.flights;
      button.disabled = true; button.setAttribute('aria-busy', 'true');
      try { await startBooking({ offer: { srk: f.booking.srk, offerIndex: pick.offerIndex, searchToken: f.booking.searchToken, itineraryIndex: pick.itineraryIndex ?? 0 }, source: 'builder', insurance: pkg.insurance?.include === true }); }
      catch (error) { button.disabled = false; button.removeAttribute('aria-busy'); const status = $('#bo-book-status', view); if (status) status.textContent = t(error.code === 'offer_unavailable' ? 'booking.offer.gone' : error.status === 429 ? 'booking.offer.busy' : 'booking.offer.failed'); }
      return;
    }
    if (el('[data-pick-flight]')) { pkg.flights.selected = el('[data-pick-flight]').dataset.pickFlight; pkg.manual = true; paint('flights'); paint('total'); paint('banner'); paint('upsell'); persist(); return; }
    if (el('[data-pick-hotel]')) { const [i, id] = el('[data-pick-hotel]').dataset.pickHotel.split(':'); hotelGroups()[Number(i)].selected = id; pkg.manual = true; paint('hotels'); paint('total'); paint('banner'); paint('upsell'); persist(); return; }
    if (el('[data-budget-jump]')) { e.preventDefault(); const box = $('#bc-total', view); box?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); (box?.querySelector('[data-budget-act]') || box)?.focus?.({ preventScroll: true }); return; }
    if (el('[data-budget-act]')) {
      const b = el('[data-budget-act]'), value = b.dataset.value, edits = {};
      if (b.dataset.budgetAct === 'dest') { rebuildCurrent(edits, value); return; }
      if (b.dataset.budgetAct === 'nights') edits.nights = Number(value); else edits.budget = Number(value);
      rebuildCurrent(edits); return;
    }
    if (el("[data-carousel]")) { moveCarousel(el(".bk-carousel"), Number(el("[data-carousel]").dataset.carousel)); return; }
    if (el('[data-upsell]')) {
      const offer = offers[Number(el('[data-upsell]').dataset.upsell)];
      if (!offer) return;
      const done = applyUpsell(pkg, offer, getFx()), title = offer.type === 'trip' ? offer.name : offerTitle(offer);
      lastInput = { ...lastInput, edits: { ...(lastInput?.edits || {}), budget: done.budget } };
      if (done.rebuild) { rebuildCurrent({ budget: done.budget, nights: done.nights }); return; }
      pkg.manual = true; repaintPrices(); persist();
      announce(t('build.upsell.added', { title, budget: formatIls(done.budget) }));
      $('#bh-total', view)?.setAttribute('tabindex', '-1'); $('#bh-total', view)?.focus();
      return;
    }
    if (el('[data-more-hotels]')) { const i = Number(el('[data-more-hotels]').dataset.moreHotels); showAllHotels.has(i) ? showAllHotels.delete(i) : showAllHotels.add(i); paint('hotels'); $(`[data-more-hotels="${i}"]`, view)?.focus(); return; }
    if (el('[data-day-up]')) { moveDay(Number(el('[data-day-up]').dataset.dayUp), -1); return; }
    if (el('[data-day-down]')) { moveDay(Number(el('[data-day-down]').dataset.dayDown), 1); return; }
    if (el('[data-remove-item]')) { const [i, j] = el('[data-remove-item]').dataset.removeItem.split(':').map(Number); const [item] = pkg.itinerary[i].items.splice(j, 1); pkg.spare = [item, ...(pkg.spare || [])]; for (const a of pkg.attractions || []) if (a.name === item.name && a.day === pkg.itinerary[i].day) a.day = 0; paint('itinerary'); paint('attractions'); persist(); announce(t('build.itinerary.removed', { name: item.name })); $('#bh-itinerary', view)?.focus?.(); return; }
    if (el('[data-chat-jump]')) { jumpToChat(); return; }
    if (el('[data-chat-edit]')) {
      const edit = $('.bk-edit', view);
      if (!edit) return;
      $('.bk-chat-tools', view).open = false;
      edit.open = true;
      edit.scrollIntoView({ block: 'start' });
      $('summary', edit).focus({ preventScroll: true });
      return;
    }
    if (el('[data-day-more]')) { const i = Number(el('[data-day-more]').dataset.dayMore); openDays.has(i) ? openDays.delete(i) : openDays.add(i); paint('itinerary'); $(`[data-day-more="${i}"]`, view)?.focus(); return; }
    if (el('[data-expand-day]')) { expandDay(Number(el('[data-expand-day]').dataset.expandDay)); return; }
    if (el('[data-add-more]')) {
      const [i, k] = el('[data-add-more]').dataset.addMore.split(':').map(Number), day = pkg.itinerary[i], item = day.more?.[k];
      if (!item) return;
      addToDay(day, item); paint('itinerary'); paint('attractions'); paint('stay'); persist(); announce(t('build.itinerary.added', { name: item.name, day: day.day })); $(`[data-day-more="${i}"]`, view)?.focus(); return;
    }
    if (el('[data-add-idea]')) {
      const [i, k] = el('[data-add-idea]').dataset.addIdea.split(':').map(Number), day = pkg.itinerary[i], idea = dayExpand[i]?.ideas?.[k];
      if (!idea || idea.added) return;
      idea.added = true; addToDay(day, { name: idea.name, kind: idea.kind, durationH: 0, where: idea.where, mapsUrl: idea.mapsUrl, ai: true });
      paint('itinerary'); persist(); announce(t('build.itinerary.added', { name: idea.name, day: day.day })); $(`[data-day-more="${i}"]`, view)?.focus(); return;
    }
    if (el('[data-add-att]')) {
      const a = pkg.attractions?.[Number(el('[data-add-att]').dataset.addAtt)];
      if (!a || a.day) return;
      const day = bestDayFor(a);
      addToDay(day, { name: a.name, en: a.en, dest: a.dest, kind: a.kind, durationH: a.durationH, area: a.area, where: a.where, mapsUrl: a.mapsUrl });
      paint('itinerary'); paint('attractions'); paint('stay'); persist(); announce(t('build.itinerary.added', { name: a.name, day: day.day }));
      $('#bh-attractions', view)?.setAttribute('tabindex', '-1'); $(`#bc-attractions [data-add-att], #bh-attractions`, view)?.focus(); return;
    }
    if (el('[data-more-att]')) { showAllAttractions = !showAllAttractions; paint('attractions'); $('[data-more-att]', view)?.focus(); return; }
    if (el('[data-stay-area]')) { const b = el('[data-stay-area]'); setHotelArea(Number(b.dataset.stayArea), b.dataset.value); announce(t('build.stay.searching')); return; }
    if (el('[data-expand-stay]')) { expandStay(Number(el('[data-expand-stay]').dataset.expandStay)); return; }
    if (el('[data-add-spare]')) { const k = Number(el('[data-add-spare]').dataset.addSpare), item = pkg.spare[k]; if (!item) return; const day = pkg.itinerary.find((d) => d.kind === 'free') || pkg.itinerary.find((d) => d.kind === 'full' && d.items.length < 3) || pkg.itinerary.find((d) => d.kind === 'full') || pkg.itinerary[0]; addToDay(day, item); paint('itinerary'); paint('attractions'); persist(); announce(t('build.itinerary.added', { name: item.name, day: day.day })); return; }
    const act = el('[data-act]')?.dataset.act, status = $('#build-act-status', view);
    if (!act) return;
    if (['lead', 'save', 'share', 'print'].includes(act)) track(act === 'lead' ? 'lead_open' : act);
    try {
      if (act === 'lead') { leadOpen = true; paintLead(); $('#bc-lead h3', view).focus(); }
      else if (act === 'save') await save(status);
      else if (act === 'share') await share(status);
      else if (act === 'print') printBrochure();
      else if (act === 'rebuild') build(lastInput || { text: $('#build-text').value });
      else if (act === 'refresh') refreshFromSnapshot();
    } catch (error) { status.textContent = error.message || t('build.err.generic'); }
  });
}

export function buildRoutes() {
  wire();
  return { build: page };
}

// Customer area (spec 24 §10): the packages saved on this device and in the account.
export function packagesSectionHtml() {
  return `<section class="surface-panel" id="acc-packages" aria-labelledby="acc-packages-title"><div class="panel-heading"><h2 id="acc-packages-title">${t('build.account.title')}</h2><a class="button secondary" href="#/build">${t('build.account.new')}</a></div><div data-packages>${packagesList(savedList())}</div></section>`;
}
const packagesList = (list) => (list.length ? `<ul class="account-list">${list.map((p) => `<li><div><strong>${esc(p.title || t('build.account.untitled'))}</strong><span class="micro-copy">${esc(p.savedAt ? fmtDate(p.savedAt) : '')}</span></div><a class="button secondary" href="#/build?p=${esc(p.id)}">${t('build.account.open')}</a></li>`).join('')}</ul>` : `<p>${t('build.account.none')}</p>`);
export async function fillPackages(root) {
  const box = root.querySelector('[data-packages]');
  if (!box) return;
  try {
    await accountReady.catch(() => {});
    if (!account.user) return;
    const response = await fetch('/api/account/packages');
    if (!response.ok) return;
    const { packages } = await response.json(), local = savedList();
    box.innerHTML = packagesList([...packages, ...local.filter((x) => !packages.some((p) => p.id === x.id))].slice(0, 20));
  } catch { /* the device list stays */ }
}
