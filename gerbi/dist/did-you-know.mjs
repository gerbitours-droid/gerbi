// "Did you know?" card shown while a flight search runs – docs/specs/26-did-you-know-he.md
import { t, lang } from './i18n.mjs';

const BY_COUNTRY = {
  IT: 'FCO ROM MIL MXP LIN BGY VCE NAP FLR PSA CTA PMO', GR: 'ATH JTR HER RHO SKG JMK CHQ', MV: 'MLE', AE: 'DXB AUH',
  FR: 'PAR CDG ORY BVA NCE', GB: 'LON LHR LGW LTN STN LCY EDI', ES: 'BCN MAD AGP PMI TFS', NL: 'AMS', DE: 'BER MUC FRA',
  CZ: 'PRG', HU: 'BUD', AT: 'VIE INN SZG', PT: 'LIS OPO FNC', CH: 'ZRH GVA', CY: 'LCA PFO', GE: 'TBS BUS KUT',
  TR: 'IST SAW AYT', RO: 'OTP', BG: 'SOF', PL: 'KRK WAW', RS: 'BEG', US: 'NYC JFK EWR LGA LAX MIA LAS MCO', TH: 'BKK HKT',
  BE: 'BRU', DK: 'CPH', IE: 'DUB', HR: 'DBV SPU', ME: 'TIV TGD', AM: 'EVN', AZ: 'GYD', LV: 'RIX', SI: 'LJU', IS: 'KEF',
  NO: 'BGO OSL', MA: 'RAK', TZ: 'ZNZ', SC: 'SEZ', MU: 'MRU', ZA: 'CPT', KE: 'NBO', VN: 'HAN SGN DAD',
  JP: 'TYO NRT HND KIX', ID: 'DPS', LK: 'CMB', IN: 'GOI', MX: 'CUN', CR: 'SJO LIR', PE: 'LIM CUZ', AR: 'BUE EZE AEP',
  BR: 'RIO GIG', AU: 'SYD', NZ: 'AKL ZQN',
};
export const COUNTRY_OF = Object.fromEntries(Object.entries(BY_COUNTRY).flatMap(([cc, codes]) => codes.split(' ').map(code => [code, cc])));

let facts; // loaded on first search, ~100 KB we don't want on the home page
const loadFacts = () => facts ||= Promise.all(['a', 'b', 'c', 'd'].map(g => import(`./facts/group-${g}.mjs`)))
  .then(mods => Object.assign({}, ...mods.map(m => m.default)));

export const factsFor = (all, code) => all[COUNTRY_OF[String(code || '').toUpperCase()]] || all.XX;

const shuffle = list => { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Mounts the card after `anchor`; returns stop(). Fails silently: the card is decoration, the search must not care.
export function startDidYouKnow(anchor, destinationCode, { every = 5000 } = {}) {
  let timer, stopped = false, box;
  loadFacts().then(all => {
    const list = shuffle(factsFor(all, destinationCode)?.[lang] || []);
    if (stopped || !list.length) return;
    box = document.createElement('div');
    box.className = 'did-you-know';
    box.innerHTML = `<img src="/assets/mascot.webp" alt="" width="72" height="72"><div><strong>${t('app.dyk.title')}</strong><p aria-live="off"></p></div>`;
    anchor.after(box);
    const line = box.querySelector('p');
    let i = 0;
    const show = () => { line.classList.remove('dyk-in'); void line.offsetWidth; line.textContent = list[i++ % list.length]; line.classList.add('dyk-in'); };
    show(); timer = setInterval(show, every);
  }).catch(() => {});
  return () => { stopped = true; clearInterval(timer); box?.remove(); };
}
