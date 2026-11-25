// "Did you know?" card shown while a flight search runs or the trip builder thinks – docs/specs/26-did-you-know-he.md
import { t, lang } from './i18n.mjs';
import { destinations, byId } from './catalog.mjs';

const BY_COUNTRY = {
  IT: 'FCO ROM MIL MXP LIN BGY VCE NAP FLR PSA CTA PMO', GR: 'ATH JTR HER RHO SKG JMK CHQ', MV: 'MLE', AE: 'DXB AUH',
  FR: 'PAR CDG ORY BVA NCE', GB: 'LON LHR LGW LTN STN LCY EDI', ES: 'BCN MAD AGP PMI TFS', NL: 'AMS', DE: 'BER MUC FRA',
  CZ: 'PRG', HU: 'BUD', AT: 'VIE INN SZG', PT: 'LIS OPO FNC', CH: 'ZRH GVA', CY: 'LCA PFO', GE: 'TBS BUS KUT',
  TR: 'IST SAW AYT', RO: 'OTP', BG: 'SOF', PL: 'KRK WAW', RS: 'BEG', US: 'NYC JFK EWR LGA LAX MIA LAS MCO ORL', TH: 'BKK HKT',
  BE: 'BRU', DK: 'CPH', IE: 'DUB', HR: 'DBV SPU', ME: 'TIV TGD', AM: 'EVN', AZ: 'GYD', LV: 'RIX', SI: 'LJU', IS: 'KEF REK AEY',
  NO: 'BGO OSL', MA: 'RAK', TZ: 'ZNZ', SC: 'SEZ', MU: 'MRU', ZA: 'CPT', KE: 'NBO', VN: 'HAN SGN DAD',
  JP: 'TYO NRT HND KIX OSA UKY', ID: 'DPS', LK: 'CMB', IN: 'GOI', MX: 'CUN', CR: 'SJO LIR', PE: 'LIM CUZ', AR: 'BUE EZE AEP',
  BR: 'RIO GIG', AU: 'SYD', NZ: 'AKL ZQN ROT', IL: 'ETM VDA',
};
export const COUNTRY_OF = Object.fromEntries(Object.entries(BY_COUNTRY).flatMap(([cc, codes]) => codes.split(' ').map(code => [code, cc])));
// The catalog's country names (English, without "(Scotland)" / "(Canary Islands)") → ISO code. A builder plan knows its
// destination id, which is more reliable than an airport code (the Dead Sea flies to TLV, a Japan base sleeps in Kyoto).
const ISO = { Greece: 'GR', Cyprus: 'CY', Italy: 'IT', 'United Arab Emirates': 'AE', France: 'FR', 'United Kingdom': 'GB', Spain: 'ES', Hungary: 'HU',
  'Czech Republic': 'CZ', Georgia: 'GE', Israel: 'IL', 'United States': 'US', Thailand: 'TH', Netherlands: 'NL', Austria: 'AT', Germany: 'DE', Portugal: 'PT',
  Croatia: 'HR', Montenegro: 'ME', Switzerland: 'CH', Bulgaria: 'BG', Maldives: 'MV', Poland: 'PL', Slovenia: 'SI', Turkey: 'TR', Morocco: 'MA', Japan: 'JP',
  Vietnam: 'VN', 'Sri Lanka': 'LK', India: 'IN', Indonesia: 'ID', Tanzania: 'TZ', Seychelles: 'SC', Mauritius: 'MU', 'South Africa': 'ZA', Kenya: 'KE',
  Iceland: 'IS', Norway: 'NO', Denmark: 'DK', Mexico: 'MX', 'Costa Rica': 'CR', Peru: 'PE', Argentina: 'AR', Brazil: 'BR', Australia: 'AU', 'New Zealand': 'NZ' };
export const countryOfDest = (d) => ISO[String(d?.country?.en || '').replace(/\s*\(.*\)$/, '')] || '';
// What a plan or a search points at → the country: a catalog id first, then the airport/city code.
export const countryFor = ({ id = '', code = '' } = {}) => countryOfDest(byId(id)) || COUNTRY_OF[String(code || '').toUpperCase()] || '';

// Before the server answers, the text alone: the first catalog place or country it names ("ברומא", "Italy", "לאיטליה").
// Hebrew prefixes (ב ל מ ו ה ש) are allowed before a name; a name must end at a word boundary ("ניס" is not "ניסיון").
// Names split into their parts ("Florence & Tuscany", "מילאנו ואגם קומו") plus a few everyday aliases.
const ALIASES = { מלדיבים: 'MV', אמלפי: 'IT', אמאלפי: 'IT', Amalfi: 'IT', קומו: 'IT', Como: 'IT', סקוטלנד: 'GB', Scotland: 'GB', אנגליה: 'GB', England: 'GB',
  'ארה״ב': 'US', 'ארה"ב': 'US', USA: 'US', Czechia: 'CZ', 'צ\'כיה': 'CZ', Bavaria: 'DE', 'Lake Bled': 'SI', בלד: 'SI', אמירויות: 'AE', Emirates: 'AE' };
const parts = (n) => n.replace(/\s*\(.*\)$/, '').split(/\s+[&—–]\s+|\s+ו(?=\S)|,\s*/).map((x) => x.replace(/^(?:The|the)\s+/, '').trim());
const NAMES = [...destinations.flatMap((d) => [d.name?.he, d.name?.en, d.country?.he, d.country?.en].filter(Boolean).flatMap((n) => [n.replace(/\s*\(.*\)$/, ''), ...parts(n)])
  .filter((n) => n.length >= 3).map((n) => [n.replace(/^The /, ''), countryOfDest(d)])), ...Object.entries(ALIASES)].filter(([n, cc]) => n && cc)
  .sort((a, b) => b[0].length - a[0].length);
const escRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// English names keep their capital ("a nice hotel" is not Nice); Hebrew has no case.
const NAME_RX = NAMES.map(([n, cc]) => [new RegExp(`(?:^|[^\\p{L}])(?:[ובלמהש]{0,2})${escRx(n)}(?![\\p{L}])`, 'u'), cc]);
export function guessCountry(text) {
  const s = String(text || '');
  if (!s.trim()) return '';
  let best = null;
  for (const [rx, cc] of NAME_RX) { const m = rx.exec(s); if (m && (!best || m.index < best.at)) best = { at: m.index, cc }; }
  return best?.cc || '';
}

let facts; // ~100 KB we don't want on the home page: loaded on the first search, or when the builder opens
export const loadFacts = () => facts ||= Promise.all(['a', 'b', 'c', 'd'].map(g => import(`./facts/group-${g}.mjs`)))
  .then(mods => Object.assign({}, ...mods.map(m => m.default)));

// all: the facts by country; target: an IATA code (flight search) or { id, code, cc } (builder). Unknown → general (XX).
export const factsFor = (all, target) => {
  const cc = typeof target === 'object' && target ? target.cc || countryFor(target) : COUNTRY_OF[String(target || '').toUpperCase()];
  return all[cc] || all.XX;
};

const shuffle = list => { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Mounts the card after `anchor` (or inside it with { inside: true }); returns stop(). stop.retarget(target) switches
// the country (the builder guesses from the text, then knows the plan). Fails silently: the card is decoration.
export function startDidYouKnow(anchor, target, { every = 5000, inside = false, initialFact = '' } = {}) {
  let timer, stopped = false, box, list = [], i = 0, current = null, all = null;
  const key = (x) => (typeof x === 'object' && x ? x.cc || countryFor(x) : COUNTRY_OF[String(x || '').toUpperCase()]) || 'XX';
  const show = () => { const line = box?.querySelector('p'); if (!line || !list.length) return; line.classList.remove('dyk-in'); void line.offsetWidth; line.textContent = list[i++ % list.length]; line.classList.add('dyk-in'); };
  const insert = (text = '') => {
    box = document.createElement('div');
    box.className = 'did-you-know';
    const mark = initialFact
      ? '<span class="dyk-icon" aria-hidden="true"><svg><use href="#i-spark"/></svg></span>'
      : '<img src="/assets/mascot.webp" alt="" width="72" height="72">';
    box.innerHTML = `${mark}<div><strong>${t('app.dyk.title')}</strong><p aria-live="off"></p></div>`;
    box.querySelector('p').textContent = text;
    if (inside) anchor.append(box); else anchor.after(box);
  };
  const mount = () => {
    if (stopped || !all) return;
    const k = key(current), next = factsFor(all, typeof current === 'object' && current ? { ...current, cc: k } : current)?.[lang] || [];
    if (!next.length) return;
    if (box?.dataset.country === k) return;
    list = shuffle(next); i = 0;
    if (!box) insert();
    box.dataset.country = k;
    clearInterval(timer); show(); timer = setInterval(show, every);
  };
  current = target;
  if (initialFact) insert(initialFact);
  loadFacts().then((x) => { all = x; mount(); }).catch(() => {});
  const stop = () => { stopped = true; clearInterval(timer); box?.remove(); };
  // A guess that turns out right keeps its card; a different (or a first known) country restarts it at once.
  stop.retarget = (next) => { if (key(next) === key(current) && box) return; current = next; mount(); };
  stop.country = () => box?.dataset.country || '';
  return stop;
}
