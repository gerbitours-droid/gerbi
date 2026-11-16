// Printable trip brochure (spec 27): the package as an A4 magazine – cover, the trip at a glance, flights/hotel/
// price, day by day with photos, practical notes, back cover. Built only for print (window.print → "Save as PDF").
import { t, lang } from './i18n.mjs';
import { contact } from './data.mjs';
import { selectedFlight, travellers } from './trip-package.mjs';

export function brochureHtml(pkg, h) {
  const { esc, L, longDay, fare, formatIls, totals, hotelGroups } = h;
  const r = pkg.request, d = pkg.destination, stops = pkg.stops?.length ? pkg.stops : [d];
  const title = stops.map((s) => L(s.name)).join(' · ');
  const flight = selectedFlight(pkg), hotels = hotelGroups().map((g) => g.status === 'live' ? g.picks.find((p) => p.id === g.selected) || g.picks[0] : null);
  const pr = totals(), people = travellers(r);
  const fact = (label, value) => value ? `<div class="br-fact"><small>${label}</small><strong>${value}</strong></div>` : '';
  const img = (src, cls = '') => src ? `<img class="${cls}" src="${esc(src)}" alt="">` : '';
  const practical = pkg.practical || {};
  const prac = [['visa', practical.visa], ['currency', practical.currency], ['language', practical.language], ['season', practical.season], ['kosher', practical.kosher], ['shabbat', practical.shabbat]].filter(([, v]) => v);
  const tel = contact.phone ? contact.phone.replace(/^0(\d)(\d+)$/, '0$1-$2') : '';

  const cover = `<section class="br-page br-cover">${img(d.image, 'br-cover-img')}
    <div class="br-cover-shade"></div>
    <header class="br-brand"><img src="/assets/mascot.webp" alt=""><div><strong>${t('home.brand.name')}</strong><small>${t('build.brochure.tagline')}</small></div></header>
    <div class="br-cover-text"><span>${t('build.brochure.kicker')}</span><h1>${esc(title)}</h1>
     <p>${esc(longDay(r.start))} – ${esc(longDay(r.end))}</p>
     <p class="br-cover-meta">${t('build.nights', { count: r.nights })} · ${esc(t('build.travellers', { adults: r.adults, children: r.children }))}</p></div>
   </section>`;

  const glance = `<section class="br-flow br-glance">
    <h2 class="br-h"><span>01</span>${t('build.brochure.glance')}</h2>
    ${pkg.polish?.intro ? `<p class="br-lead">${esc(pkg.polish.intro)}</p>` : `<p class="br-lead">${esc(L(d.summary))}</p>`}
    <div class="br-facts">${fact(t('build.brochure.dates'), `${esc(longDay(r.start))} – ${esc(longDay(r.end))}`)}${fact(t('build.brochure.nights'), r.nights)}${fact(t('build.brochure.who'), esc(t('build.travellers', { adults: r.adults, children: r.children })))}${fact(t('build.brochure.from'), esc(r.origin || 'TLV'))}</div>
    ${pkg.highlights?.length ? `<h3 class="br-sub">${t('build.brochure.highlights')}</h3><ul class="br-highlights">${pkg.highlights.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    <div class="br-cols">
     <div class="br-box"><h3 class="br-sub">✈ ${t('build.flights.title')}</h3>${flight ? `<p><strong>${esc(flight.carriers.join(' + '))}</strong></p>${flight.legs.map((l) => `<p class="br-leg"><bdi dir="ltr">${esc(l.from)} ${esc(l.depart)} → ${esc(l.to)} ${esc(l.arrive)}${l.dayOffset ? ` +${l.dayOffset}` : ''}</bdi><small>${esc(longDay(l.date))} · ${l.stops ? t('build.flights.stops', { count: l.stops }) : t('build.flights.direct')}</small></p>`).join('')}<p class="br-price">${esc(fare(flight.price))} <small>${t('build.flights.forAll', { count: people })}</small></p>` : `<p>${t('build.brochure.byRep')}</p>`}</div>
     <div class="br-box"><h3 class="br-sub">⌂ ${t('build.hotels.title')}</h3>${hotelGroups().map((g, i) => { const h0 = hotels[i]; return `${g.area ? `<p><strong>${t('build.hotels.area', { area: esc(L(g.area.name)) })}</strong> ${esc(L(g.area.forWhom))}</p>` : ''}${h0 ? `<p><strong>${esc(h0.name)}</strong> ${'★'.repeat(h0.stars || 0)}</p><p class="br-price">${esc(fare(h0.price))} <small>${t('build.hotels.forStay', { nights: h0.nights })}</small></p>` : `<p>${t('build.brochure.byRep')}</p>`}`; }).join('')}</div>
    </div>
    ${pr.total ? `<div class="br-total"><div><small>${t('build.total.withEstimate')}</small><strong dir="ltr">${esc(formatIls(pr.total.low))} – ${esc(formatIls(pr.total.high))}</strong></div><div><small>${t('build.brochure.perPerson')}</small><strong dir="ltr">${esc(formatIls(pr.perPerson.low))} – ${esc(formatIls(pr.perPerson.high))}</strong></div></div>` : ''}
   </section>`;

  const days = `<section class="br-flow br-days-wrap">
    <h2 class="br-h"><span>02</span>${t('build.itinerary.title')}</h2>
    ${pkg.itinerary.map((day) => {
      const pics = day.items.filter((x) => x.image).slice(0, 2);
      return `<article class="br-day br-day-${esc(day.kind)}">
       <div class="br-day-num"><small>${t('build.brochure.day')}</small><strong>${day.day}</strong></div>
       <div class="br-day-body"><h3>${esc(day.title)}</h3><p class="br-day-date">${esc(longDay(day.date))}${pkg.stops?.length ? ' · ' + esc(L(pkg.stops[day.stop]?.name)) : ''}</p>
        ${day.items.length ? `<ul>${day.items.map((x) => `<li><strong>${esc(x.name)}</strong>${x.durationH ? `<small>${t('build.itinerary.hours', { hours: x.durationH })}</small>` : ''}</li>`).join('')}</ul>` : ''}
        ${day.note ? `<p class="br-note">${esc(day.note)}</p>` : ''}</div>
       ${pics.length ? `<div class="br-day-pics br-pics-${pics.length}">${pics.map((x) => img(x.image.src)).join('')}</div>` : ''}
      </article>`; }).join('')}
   </section>`;

  const know = prac.length ? `<section class="br-flow br-know">
    <h2 class="br-h"><span>03</span>${t('build.practical.title')}</h2>
    <dl class="br-prac">${prac.map(([k, v]) => `<div><dt>${t(`build.practical.${k}`)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
   </section>` : '';

  const back = `<section class="br-page br-back">
    <img class="br-back-bear" src="/assets/mascot.webp" alt="">
    <h2>${t('build.brochure.backTitle')}</h2><p>${t('build.brochure.backText')}</p>
    <p class="br-contact">${tel ? `<span>☎ <bdi dir="ltr">${esc(tel)}</bdi></span>` : ''}${contact.email ? `<span>✉ <bdi dir="ltr">${esc(contact.email)}</bdi></span>` : ''}<span><bdi dir="ltr">gerbitours.co.il</bdi></span></p>
    <p class="br-fine">${t('build.brochure.fine', { date: esc(new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'he-IL')) })}</p>
    ${d.imageCredit ? `<p class="br-fine">${esc(d.imageCredit)}</p>` : ''}
   </section>`;

  return cover + glance + days + know + back;
}
