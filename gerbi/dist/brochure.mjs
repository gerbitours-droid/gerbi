// A4 trip brochure: a photo cover followed by a continuous print layout for the itinerary and logistics.
import { t, lang } from './i18n.mjs';
import { contact } from './data.mjs';
import { byId, TAG_LABELS } from './catalog.mjs';
import { selectedFlight, travellers } from './trip-package.mjs';
import qrcode from './vendor/qrcode.mjs';

// ---- data that is not on the page yet: loaded once, before printing (missing files just mean less detail)
let data = null;
export function loadBrochureData() {
  return data ||= Promise.all([
    ...[1, 2, 3, 4].map((n) => import(`./catalog/info/group-${n}.mjs`).then((m) => m.default).catch(() => ({}))),
    import('./catalog/attraction-images.mjs').then((m) => m.default).catch(() => ({})),
    import('./catalog/country-info.mjs').catch(() => ({ default: {}, packingRules: [] })),
  ]).then(([a, b, c, d, images, country]) => ({ info: { ...a, ...b, ...c, ...d }, images, country: country.default || {}, packing: country.packingRules || [] }));
}

const qr = (text, cell = 3) => { try { const q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: cell, margin: 0, scalable: true }); } catch { return ''; } };
const hm = (h) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
const money = (low, high, fmt) => (!high ? t('build.brochure.free') : low === high ? fmt(low) : `${fmt(low)} – ${fmt(high)}`);
const EVENING = (a) => (a?.tags || []).some((x) => ['evening', 'nightlife'].includes(x));
const PALETTE = { beach: 'coast', all_inclusive: 'coast', nature: 'forest', adventure: 'forest', ski: 'snow', city: 'city', culture: 'city', food: 'city', nightlife: 'city' };

export function brochureHtml(pkg, h, D = { info: {}, images: {}, country: {}, packing: [] }) {
  const { esc, L, longDay, fare, formatIls, totals, hotelGroups, shareUrl, icon } = h;
  const r = pkg.request, d = pkg.destination, stops = pkg.stops?.length ? pkg.stops : [d];
  const title = stops.map((s) => L(s.name)).join(' · ');
  const flight = selectedFlight(pkg), groups = hotelGroups(), pr = totals(), people = travellers(r);
  const ils = (v) => formatIls(Math.round(v));
  const img = (src, cls = '', fallback = '') => (src ? `<img class="${cls}" src="${esc(src)}" alt=""${fallback ? ` data-fallback="${esc(fallback)}"` : ''}>` : '');
  const destOf = (i) => byId(stops[i]?.id) || null;
  const tripStyle = [...(r.styles || []), ...(destOf(0)?.tags || [])].find((key) => Object.hasOwn(PALETTE, key));
  const palette = PALETTE[tripStyle] || 'city';
  const placesByDay = pkg.itinerary.map((day) => {
    const dest = destOf(day.stop || 0);
    return day.items.map((x) => {
      const a = dest?.attractions?.find((y) => y.name.he === x.name || y.name.en === x.name);
      const dt = !a ? dest?.dayTrips?.find((y) => y.name.he === x.name || y.name.en === x.name) : null;
      const place = a || dt;
      const key = place ? `${dest.id}|${place.name.en}` : '';
      return { x, a, dt, info: D.info[key], im: D.images[key] };
    });
  });
  const credits = new Map();
  const credit = (im, title) => { if (im?.credit && !credits.has(im.src)) credits.set(im.src, { im, title }); };
  const asked = new Set([...(r.styles || []), r.children ? 'family' : '', r.occasion || ''].filter(Boolean));
  const fitLabels = (a) => (a?.tags || []).filter((x) => asked.has(x) && TAG_LABELS[x]).map((x) => L(TAG_LABELS[x]));
  const hotelArea = (i) => groups[i]?.area?.name?.en || '';
  const countryInfo = D.country[destOf(0)?.country?.en || d.country?.en] || null;
  const month = Number((r.start || '').slice(5, 7)) || 0;
  const section = (cls, body) => `<section class="br-flow ${cls}">${body}</section>`;
  const head = (text) => `<h2 class="br-h">${text}</h2>`;

  // ---- 1. cover
  const share = shareUrl?.() || '';
  const coverImg = destOf(0)?.image;
  credit(coverImg, L(d.name));
  const coverPhotos = new Map();
  for (const { im, x } of placesByDay.flat()) {
    if (im?.src && !coverPhotos.has(im.src)) coverPhotos.set(im.src, { im, x });
    if (coverPhotos.size === 3) break;
  }
  const collage = [...coverPhotos.values()].map(({ im, x }) =>
    `<figure class="br-cover-card">${img(im.src)}<figcaption>${esc(x.name)}</figcaption></figure>`).join('');
  const outbound = flight?.legs?.[0];
  const route = outbound?.from && outbound?.to ? `<div class="br-cover-route" dir="ltr"><b>${esc(outbound.from)}</b><span aria-hidden="true"></span>${icon?.('plane') || '✈'}<b>${esc(outbound.to)}</b></div>` : '';
  const countries = [...new Set(stops.map((stop) => L(stop.country)).filter(Boolean))].join(' · ');
  const dateFormat = new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const dateRange = r.start && r.end
    ? dateFormat.formatRange(new Date(r.start + 'T12:00:00'), new Date(r.end + 'T12:00:00'))
    : longDay(r.start || r.end);
  const cover = `<section class="br-page br-cover">
    <div class="br-cover-photo">${img(coverImg?.src || d.image, 'br-cover-img', coverImg?.thumb)}</div>
    <header class="br-brand"><img src="/assets/mascot.webp" alt=""><strong>${t('home.brand.name')}</strong></header>
    <div class="br-cover-title">
      <p>${countries ? esc(countries) + ' · ' : ''}${t('build.brochure.kicker')}</p>
      <h1${stops.length > 1 || title.length > 28 ? ' class="br-cover-title-long"' : ''}>${esc(title)}</h1>
      ${tripStyle ? `<small class="br-cover-script">${esc(L(TAG_LABELS[tripStyle]))}</small>` : ''}
    </div>
    ${collage ? `<div class="br-cover-art">${collage}</div>` : '<div class="br-cover-art" aria-hidden="true"></div>'}
    <div class="br-cover-ticket">
      <div class="br-cover-travel">${route}
        ${dateRange ? `<strong>${esc(dateRange)}</strong>` : ''}
        ${r.datesAssumed ? `<small>${t('build.brochure.suggestedDates')}</small>` : ''}
        <p>${t('build.nights', { count: r.nights })} · ${esc(t('build.travellers', { adults: r.adults, children: r.children }))}</p>
      </div>
      ${share ? `<a class="br-cover-qr" href="${esc(share)}"><div class="br-qr">${qr(share)}</div><small>${t('build.brochure.qrLive')}</small></a>` : ''}
    </div>
   </section>`;

  // ---- 2. at a glance + timeline
  const timeline = pkg.itinerary.map((day) => `<li><b>${day.day}</b><span>${esc(longDay(day.date))}</span><strong>${esc(day.title)}</strong></li>`).join('');
  const glance = section('br-glance', `${head(t('build.brochure.glance'))}
    <p class="br-lead">${esc(pkg.polish?.intro || L(d.summary))}</p>
    <div class="br-facts">
     <div class="br-fact"><small>${t('build.brochure.dates')}</small><strong>${esc(longDay(r.start))} – ${esc(longDay(r.end))}</strong></div>
     <div class="br-fact"><small>${t('build.brochure.nights')}</small><strong>${r.nights}</strong></div>
     <div class="br-fact"><small>${t('build.brochure.who')}</small><strong>${esc(t('build.travellers', { adults: r.adults, children: r.children }))}</strong></div>
     <div class="br-fact"><small>${t('build.brochure.stay')}</small><strong>${esc(groups.map((g) => (g.area ? L(g.area.name) : '')).filter(Boolean).join(' · ') || L(d.name))}</strong></div>
     ${pr.budget ? `<div class="br-fact br-fact-budget"><small>${t('build.brochure.budget')}</small><strong>${esc(ils(pr.budget.amount))}</strong></div>` : ''}
     ${pr.total ? `<div class="br-fact"><small>${t('build.total.withEstimate')}</small><strong dir="ltr">${esc(ils(pr.total.low))} – ${esc(ils(pr.total.high))}</strong></div>` : ''}
    </div>
    ${pkg.highlights?.length ? `<h3 class="br-sub">${t('build.brochure.highlights')}</h3><ul class="br-highlights">${pkg.highlights.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    <h3 class="br-sub">${t('build.brochure.timeline')}</h3><ol class="br-timeline">${timeline}</ol>`);

  // ---- 3. flights, segment by segment
  const segRow = (s) => `<tr><td><strong>${esc(s.number || '')}</strong><small>${esc(s.carrier)}</small></td>
    <td><bdi dir="ltr"><b>${esc(s.depart)}</b> ${esc(s.from)}</bdi><small>${esc(s.fromName)} · ${esc(longDay(s.date))}</small></td>
    <td class="br-seg-arrow" aria-hidden="true">✈</td>
    <td><bdi dir="ltr"><b>${esc(s.arrive)}</b> ${esc(s.to)}</bdi><small>${esc(s.toName)}${s.arriveDate && s.arriveDate !== s.date ? ' · ' + esc(longDay(s.arriveDate)) : ''}</small></td>
    <td>${esc((s.duration || '').replace(':', t('build.brochure.hShort')) )}</td></tr>`;
  const fareFact = (label, v) => `<div><small>${label}</small><strong>${v}</strong></div>`;
  const bagText = (v) => t(`build.brochure.bag.${['included', 'paid'].includes(v) ? v : 'unknown'}`);
  const flights = section('br-flights', `${head(t('build.flights.title'))}
    ${flight ? `${flight.legs.map((leg, i) => `<div class="br-leg-card"><h3>${t(i === 0 ? 'build.brochure.outbound' : i === flight.legs.length - 1 && flight.legs.length > 1 ? 'build.brochure.return' : 'build.brochure.legN', { n: i + 1 })} · ${esc(longDay(leg.date))}</h3>
       ${leg.segments?.length ? `<table class="br-segs"><tbody>${leg.segments.map(segRow).join('')}</tbody></table>` : `<p class="br-legline"><bdi dir="ltr">${esc(leg.from)} ${esc(leg.depart)} → ${esc(leg.to)} ${esc(leg.arrive)}${leg.dayOffset ? ` +${leg.dayOffset}` : ''}</bdi></p>`}
       <p class="br-legmeta">${leg.stops ? t('build.flights.stops', { count: leg.stops }) : t('build.flights.direct')}</p></div>`).join('')}
      <div class="br-farefacts">${fareFact(t('build.brochure.carrier'), esc(flight.carriers.join(' + ')))}${fareFact(t('build.brochure.checked'), bagText(flight.bag))}${fareFact(t('build.brochure.trolley'), bagText(flight.trolley))}${fareFact(t('build.brochure.refund'), t(`build.brochure.refund.${flight.refundable === 'refundable' || flight.refundable === true ? 'yes' : flight.refundable === 'nonrefundable' || flight.refundable === false ? 'no' : 'unknown'}`))}${fareFact(t('build.brochure.price'), `<span dir="ltr">${esc(fare(flight.price))}</span> <small>${t('build.flights.forAll', { count: people })}</small>`)}</div>
      ${flight.longestLayover >= 240 || flight.overnight || flight.airportChange ? `<p class="br-alert">${[flight.longestLayover >= 240 ? t('build.brochure.longLayover') : '', flight.overnight ? t('build.brochure.overnight') : '', flight.airportChange ? t('build.brochure.airportChange') : ''].filter(Boolean).join(' · ')}</p>` : ''}
      <ul class="br-tips"><li>${t('build.brochure.tip.checkin')}</li><li>${t('build.brochure.tip.airport')}</li><li>${t('build.brochure.tip.passport')}</li></ul>`
      : `<p>${t('build.brochure.byRep')}</p>`}`);

  // ---- 4. the stay
  const stay = section('br-stay', `${head(t('build.brochure.stayTitle'))}
    ${groups.map((g, i) => {
      const stop = destOf(i), pick = g.status === 'live' ? g.picks?.find((p) => p.id === g.selected) || g.picks?.[0] : null;
      return `<div class="br-stay-card">${stops.length > 1 ? `<h3>${esc(L(stops[i].name))} · ${t('build.nights', { count: stops[i].nights })}</h3>` : ''}
        ${g.area ? `<p class="br-area"><strong>${t('build.hotels.area', { area: esc(L(g.area.name)) })}</strong> ${esc(L(g.area.forWhom))}</p>` : ''}
        ${pick ? `<div class="br-hotel">${img(pick.image, 'br-hotel-img')}<div><h4>${esc(pick.name)} <span class="br-stars">${'★'.repeat(pick.stars || 0)}</span></h4><p>${esc(pick.address || '')}</p>
          <p>${pick.board ? t(`build.board.${pick.board}`) + ' · ' : ''}${pick.refundable ? t('build.brochure.refund.yes') : t('build.brochure.refund.no')}</p><p class="br-price">${esc(fare(pick.price))} <small>${t('build.hotels.forStay', { nights: pick.nights })}</small></p></div></div>`
          : g.estimate ? `<p>${t('build.brochure.hotelEstimate', { stars: g.minStars || 3, low: esc(fare({ value: g.estimate.stay?.low || 0, currency: g.estimate.currency })), high: esc(fare({ value: g.estimate.stay?.high || 0, currency: g.estimate.currency })) })}</p>` : `<p>${t('build.brochure.byRep')}</p>`}
        ${stop?.areas?.length > 1 ? `<p class="br-small">${t('build.brochure.otherAreas')} ${stop.areas.filter((a) => a.name.en !== g.area?.name?.en).slice(0, 3).map((a) => `<b>${esc(L(a.name))}</b> – ${esc(L(a.forWhom))}`).join(' · ')}</p>` : ''}
        <p class="br-small">${t('build.brochure.checkinTimes')}</p></div>`;
    }).join('')}`);

  // ---- 5. day by day
  const SLOT = (start) => (start < 12 ? 'morning' : start < 17 ? 'afternoon' : 'evening');
  const dayPages = pkg.itinerary.map((day, i) => {
    const base = hotelArea(day.stop || 0);
    const places = placesByDay[i];
    const featured = places.find(({ im }) => im?.src);
    const rows = []; let clock = day.kind === 'arrival' ? 15.5 : 9.5, lunch = false;
    for (const place of places) {
      const { x, a, dt, info, im } = place;
      credit(im, x.name);
      let start = clock;
      if (EVENING(a) && clock < 19) start = 19.5;
      else if (!lunch && clock >= 12.5 && clock < 15) { rows.push({ lunch: true, start: clock }); start = clock + 1.25; lunch = true; }
      const hours = x.durationH || a?.durationH || 2;
      clock = start + hours + 0.5;
      const ticket = info?.ticketIls ? money(info.ticketIls.low, info.ticketIls.high, ils) : dt?.priceIls ? money(dt.priceIls.low, dt.priceIls.high, ils) : '';
      const how = dt ? L(dt.note) : !a?.area || !base ? '' : a.area === base ? t('build.brochure.howWalk') : t('build.brochure.howRide', { area: a.area });
      rows.push({ x, a, info, im: place === featured ? null : im, start, hours, ticket, how });
    }
    const items = rows.map((row) => row.lunch
      ? `<div class="br-slot br-lunch"><time>${hm(row.start)}</time><div><strong>${t('build.brochure.lunch')}</strong>${base ? ` <small>${t('build.brochure.lunchNear')}</small>` : ''}</div></div>`
      : `<article class="br-item">
         <time>${hm(row.start)}<small>${t(`build.brochure.slot.${SLOT(row.start)}`)}</small></time>
         <div class="br-item-body">
          ${row.im ? img(row.im.src, 'br-item-img') : ''}
          <h4>${esc(row.x.name)}${row.a?.name?.en && lang === 'he' ? ` <small dir="ltr">${esc(row.a.name.en)}</small>` : ''}</h4>
          <p class="br-meta">${[t('build.itinerary.hours', { hours: row.hours }), row.a?.area ? esc(row.a.area) : '', row.ticket ? `${t('build.brochure.ticket')} ${esc(row.ticket)}` : '', row.info?.book === 'required' ? `<b class="br-book">${t('build.brochure.bookRequired')}</b>` : row.info?.book === 'recommended' ? `<b class="br-book br-book-soft">${t('build.brochure.bookRecommended')}</b>` : ''].filter(Boolean).join(' · ')}</p>
          ${row.info?.about ? `<p>${esc(L(row.info.about))}</p>` : ''}
          ${fitLabels(row.a).length ? `<p class="br-fit">${t('build.brochure.whyYou')} ${fitLabels(row.a).map((x) => `<span>${esc(x)}</span>`).join('')}</p>` : ''}
          ${row.how ? `<p class="br-how">${t('build.brochure.how')} ${esc(row.how)}</p>` : ''}
          ${row.info?.hours ? `<p class="br-how">${t('build.brochure.hours')} ${esc(L(row.info.hours))}</p>` : ''}
          ${row.info?.tip ? `<p class="br-tip"><img src="/assets/mascot.webp" alt="">${esc(L(row.info.tip))}</p>` : ''}
         </div>
         ${row.x.mapsUrl ? `<a class="br-qr br-qr-small" href="${esc(row.x.mapsUrl)}">${qr(row.x.mapsUrl, 2)}<small>${t('build.brochure.map')}</small></a>` : ''}
        </article>`).join('');
    const empty = !day.items.length ? `<p class="br-note">${esc(day.note || t(`build.brochure.dayKind.${day.kind}`))}</p>` : day.note && !rows.some((row) => row.how === day.note) ? `<p class="br-note">${esc(day.note)}</p>` : '';
    return `<section class="br-day-page${day.items.length <= 1 ? ' br-day-compact' : ''}">
      <header class="br-day-head">
       ${featured ? img(featured.im.src, 'br-day-photo') : ''}
       <div class="br-day-heading"><div class="br-day-num"><small>${t('build.brochure.day')}</small><strong>${day.day}</strong></div>
        <div><h3>${esc(day.title)}</h3><p>${esc(longDay(day.date))}${stops.length > 1 ? ' · ' + esc(L(stops[day.stop]?.name)) : ''}</p></div></div>
       ${featured ? `<small class="br-day-photo-caption">${esc(featured.x.name)}</small>` : ''}
      </header>
      ${items}${empty}</section>`;
  }).join('');
  const days = section('br-days', head(t('build.itinerary.title')) + dayPages);

  // ---- 6. more ideas
  const spare = (pkg.spare || []).slice(0, 12).map((x) => {
    const dest = destOf(0), a = dest?.attractions?.find((y) => y.name.he === x.name || y.name.en === x.name), key = dest && a ? `${dest.id}|${a.name.en}` : '', im = D.images[key], info = D.info[key];
    credit(im, x.name);
    return `<li>${im ? img(im.src) : ''}<div><strong>${esc(x.name)}</strong>${info?.about ? `<small>${esc(L(info.about))}</small>` : ''}</div></li>`;
  }).join('');
  const ideas = spare ? section('br-ideas', `${head(t('build.brochure.moreIdeas'))}<ul class="br-spare">${spare}</ul>`) : '';

  // ---- 7. budget
  const lineLabel = (l) => t(`build.line.${l.id.split(':')[0]}`, { place: l.stop !== undefined && pkg.stops?.length ? L(pkg.stops[l.stop]?.name) : '' });
  const lineValue = (l) => l.kind === 'live' ? (l.ils === null ? fare(l.price) : ils(l.ils)) : l.kind === 'estimate' && l.range ? `${ils(l.range.low)} – ${ils(l.range.high)}` : t('build.price.byRep');
  const budget = section('br-budget', `${head(t('build.total.title'))}
    <table class="br-lines"><thead><tr><th>${t('build.brochure.item')}</th><th>${t('build.brochure.kind')}</th><th>${t('build.brochure.amount')}</th></tr></thead><tbody>
     ${pr.lines.map((l) => `<tr><td>${esc(lineLabel(l))}</td><td><span class="br-kind br-kind-${l.kind}">${t(`build.kind.${l.kind}`)}</span></td><td dir="ltr">${esc(lineValue(l))}</td></tr>`).join('')}
    </tbody>${pr.total ? `<tfoot><tr><td>${t('build.total.withEstimate')}</td><td></td><td dir="ltr">${esc(ils(pr.total.low))} – ${esc(ils(pr.total.high))}</td></tr><tr><td>${t('build.brochure.perPerson')}</td><td></td><td dir="ltr">${esc(ils(pr.perPerson.low))} – ${esc(ils(pr.perPerson.high))}</td></tr></tfoot>` : ''}</table>
    ${pr.budget ? `<p class="br-budget-verdict br-budget-${pr.budget.verdict}">${t(`build.total.budget.${pr.budget.verdict}`, { budget: esc(ils(pr.budget.amount)), diff: esc(ils(Math.abs(pr.budget.diff || 0))) })}</p>` : ''}
    <p class="br-small">${t('build.legend.live')} · ${t('build.legend.estimate')}</p>`);

  // ---- 8. practical
  const p = pkg.practical || {};
  const w = countryInfo?.weather?.[month];
  const prac = [['visa', p.visa], ['currency', p.currency], ['language', p.language], ['season', p.season], ['kosher', p.kosher], ['shabbat', p.shabbat]].filter(([, v]) => v);
  const extra = countryInfo ? [
    [t('build.brochure.weather'), w ? t('build.brochure.weatherLine', { hi: w.hi, lo: w.lo }) : ''],
    [t('build.brochure.plug'), L(countryInfo.plug)], [t('build.brochure.tipping'), L(countryInfo.tipping)],
    [t('build.brochure.driving'), L(countryInfo.driving)], [t('build.brochure.water'), L(countryInfo.water)],
    [t('build.brochure.emergency'), Object.entries(countryInfo.emergency || {}).filter(([, v]) => v).map(([k, v]) => `${t(`build.brochure.em.${k}`)} <b dir="ltr">${esc(v)}</b>`).join(' · ')],
  ].filter(([, v]) => v) : [];
  const phrases = countryInfo?.phrases?.length ? `<section class="br-language">${head(t('build.brochure.phrases'))}<table class="br-phrases"><tbody>${countryInfo.phrases.map((x) => `<tr><td>${esc(lang === 'en' ? x.en || x.he : x.he)}</td><td dir="ltr"><b>${esc(x.local)}</b></td>${lang === 'he' ? `<td>${esc(x.say)}</td>` : ''}</tr>`).join('')}</tbody></table></section>` : '';
  const know = section('br-know', `${head(t('build.practical.title'))}
    <dl class="br-prac">${prac.map(([k, v]) => `<div><dt>${t(`build.practical.${k}`)}</dt><dd>${esc(v)}</dd></div>`).join('')}${extra.map(([k, v]) => `<div><dt>${k}</dt><dd>${v.includes('<b') ? v : esc(v)}</dd></div>`).join('')}</dl>`);

  // ---- 9. packing list
  const kids = (r.childAges || []), toddler = kids.some((a) => a < 4), child = r.children > 0;
  const southern = ['americas-south', 'oceania', 'africa-south'].includes(d.region) || ['Argentina', 'Brazil', 'Peru', 'Australia', 'New Zealand', 'South Africa'].includes(d.country?.en);
  const summer = month && (southern ? [12, 1, 2] : [6, 7, 8]).includes(month), winter = month && (southern ? [6, 7, 8] : [12, 1, 2]).includes(month);
  const styles = new Set([...(r.styles || []), ...((d.tags || []).includes('nature') ? ['hiking'] : []), ...(r.budgetLevel === 'high' ? ['luxury'] : [])]);
  const match = (when) => when.always || ((!when.styles || when.styles.some((s) => styles.has(s))) && (!when.season || (when.season === 'summer' && summer) || (when.season === 'winter' && winter))
    && (when.hot === undefined || (w && w.hi >= 27)) && (when.cold === undefined || (w && w.hi <= 12)) && (!when.kids || (when.kids === 'toddler' ? toddler : child)) && (when.styles || when.season || when.hot !== undefined || when.cold !== undefined || when.kids));
  const pack = [...new Map(D.packing.filter((rule) => match(rule.when)).flatMap((rule) => rule.items).map((i) => [L(i), i])).values()];
  const packing = pack.length ? `<section class="br-pack">${head(t('build.brochure.packing'))}<ul class="br-checklist">${pack.map((i) => `<li><span class="br-box-check"></span>${esc(L(i))}</li>`).join('')}</ul></section>` : '';
  const reference = phrases || packing ? section('br-reference', phrases + packing) : '';

  // ---- 10. photo credits and contact
  const tel = contact.phone && !/0{6,}$/.test(contact.phone) ? contact.phone.replace(/^0(\d)(\d+)$/, '0$1-$2') : '';
  const wa = contact.whatsapp && !/0{6,}$/.test(contact.whatsapp) ? `https://wa.me/${contact.whatsapp}` : '';
  const photoCredits = credits.size ? `<section class="br-photo-credits"><h2>${t('build.brochure.credits')}</h2><ul>${[...credits.values()].map(({ im, title }) =>
    `<li><b>${esc(title)}</b> · ${esc(im.credit)}${im.license ? ` · ${im.source ? `<a href="${esc(im.source)}">${esc(im.license)}</a>` : esc(im.license)}` : ''}</li>`).join('')}</ul></section>` : '';
  const footer = `<div class="br-end">
    <strong>${t('home.brand.name')}</strong>
    <div class="br-contact">${tel ? `<a href="tel:${esc(contact.phone)}"><bdi dir="ltr">${esc(tel)}</bdi></a>` : ''}${contact.email ? `<a href="mailto:${esc(contact.email)}"><bdi dir="ltr">${esc(contact.email)}</bdi></a>` : ''}<a href="https://gerbitours.co.il" dir="ltr">gerbitours.co.il</a></div>
    ${wa ? `<a class="br-back-qr" href="${esc(wa)}"><div class="br-qr">${qr(wa)}</div><small>${t('build.brochure.qrWhatsapp')}</small></a>` : ''}
    <p class="br-fine">${t(flight ? 'build.brochure.fine' : 'build.brochure.fineEstimate', { date: esc(new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'he-IL')) })}</p>
   </div>`;

  return `<div class="br-theme-${palette}">${cover + glance + budget + flights + stay + days + know + reference}
    <div class="br-appendix">${ideas + photoCredits + footer}</div></div>`;
}
