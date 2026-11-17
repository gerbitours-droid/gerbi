#!/usr/bin/env node
// Fetch a freely-licensed photo for each catalog attraction / day trip from Wikipedia + Wikimedia Commons.
// Re-runnable: entries already in dist/catalog/attraction-images.mjs (with their file on disk) are kept
// unless --refresh is given; a file is re-downloaded only when its Commons source changed.
//
//   node scripts/fetch-attraction-images.mjs [--refresh] [--only=<destinationId>] [--dry]
//
// Matching: candidate titles are derived from the English name (split on "—", "&", ",", parentheses, minus
// activity words), looked up as exact Wikipedia titles (following redirects), then via a search with the
// destination as context. A page is accepted only if it is not a disambiguation page, its title matches the
// candidate, and its coordinates fall within a radius of the destination (or, with no coordinates, its
// short description names the city/country). Only CC0 / PD / CC BY / CC BY-SA files hosted on Commons.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'dist/assets/attractions');
const MAP_FILE = join(ROOT, 'dist/catalog/attraction-images.mjs');
const ASSETS_FILE = join(ROOT, 'ASSETS.md');
// Wikimedia throttles anonymous bots hard; set GERBI_BOT_CONTACT (a URL or role mailbox, never a person's) to
// identify the client per https://meta.wikimedia.org/wiki/User-Agent_policy and get normal rate limits.
const UA = `GerbiToursCatalogBot/1.0 (${process.env.GERBI_BOT_CONTACT ? process.env.GERBI_BOT_CONTACT + '; ' : ''}catalog image fetch)`;
const WP = 'https://en.wikipedia.org/w/api.php';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const CWEBP = existsSync('/opt/homebrew/bin/cwebp') ? '/opt/homebrew/bin/cwebp' : 'cwebp';
const args = new Set(process.argv.slice(2));
const REFRESH = args.has('--refresh');
const DRY = args.has('--dry');
const ONLY = [...args].find((a) => a.startsWith('--only='))?.slice(7);

// Reference article (for coordinates) and acceptance radius in km per destination. Day trips get 2.5x
// unless dayKm is given. Default: the destination's English name, 250 km.
const REF = {
  'milan-lake-como': ['Milan', 250], 'florence-tuscany': ['Florence'], 'amalfi-naples': ['Naples'],
  croatia: ['Split, Croatia', 350], montenegro: ['Budva', 200], cyprus: ['Limassol', 200],
  slovenia: ['Ljubljana', 200], nice: ['Nice'], 'munich-bavaria': ['Munich'], 'swiss-alps': ['Interlaken', 250],
  'austrian-alps': ['Innsbruck', 250], maldives: ['Malé', 600], georgia: ['Tbilisi', 400],
  japan: ['Tokyo', 800], vietnam: ['Da Nang', 1000], 'sri-lanka': ['Kandy', 350], goa: ['Panaji', 150, 400],
  bali: ['Denpasar', 120], zanzibar: ['Zanzibar City', 120, 500], seychelles: ['Victoria, Seychelles', 150],
  mauritius: ['Port Louis', 150], 'cape-town': ['Cape Town', 200], 'kenya-safari': ['Nairobi', 400],
  iceland: ['Reykjavík', 500], 'norway-fjords': ['Bergen', 300], edinburgh: ['Edinburgh', 300],
  florida: ['Miami', 400], cancun: ['Cancún', 250], 'costa-rica': ['San José, Costa Rica', 300],
  peru: ['Cusco', 700], 'buenos-aires': ['Buenos Aires', 100, 3000], rio: ['Rio de Janeiro', 200],
  sydney: ['Sydney', 250], 'new-zealand': ['Rotorua', 1200], 'new-york': ['New York City', 100, 400],
  'los-angeles': ['Los Angeles', 120, 350], 'las-vegas': ['Las Vegas', 120, 450], 'dead-sea': ['Ein Bokek', 100],
  eilat: ['Eilat', 100, 200], 'abu-dhabi': ['Abu Dhabi', 100, 250], dubai: ['Dubai', 80, 250],
  phuket: ['Phuket province', 150], bangkok: ['Bangkok', 100, 700], marrakech: ['Marrakesh', 100, 250],
  istanbul: ['Istanbul', 80, 200], krakow: ['Kraków', 60, 200], porto: ['Porto', 60, 150], lisbon: ['Lisbon', 60, 150],
  tenerife: ['Tenerife', 100], madeira: ['Madeira', 150], mallorca: ['Mallorca', 120], sicily: ['Sicily', 300],
  crete: ['Crete', 200], rhodes: ['Rhodes', 100], santorini: ['Santorini', 80], mykonos: ['Mykonos', 80],
  bansko: ['Bansko', 120], athens: ['Athens', 80, 200], rome: ['Rome', 60, 300], paris: ['Paris', 60, 200],
  london: ['London', 60, 200], barcelona: ['Barcelona', 60, 150], budapest: ['Budapest', 60, 150],
  prague: ['Prague', 50, 200], amsterdam: ['Amsterdam', 40, 100], vienna: ['Vienna', 50, 300],
  berlin: ['Berlin', 50, 250], venice: ['Venice', 40, 150], madrid: ['Madrid', 50, 150],
  copenhagen: ['Copenhagen', 50, 100],
};

// Reviewed by eye: the matched article is right but its lead image does not show the place well.
const DENY = new Set([
  'sydney|Hunter Valley', // lead image is a ship off Newcastle
  'tenerife|La Gomera', // satellite view
  'cyprus|Limassol Marina & Old Port', // container-port cranes
]);

// Activity / qualifier words stripped to get the place name ("Lake Brienz boat trip" → "Lake Brienz").
const SUFFIXES = [
  'sunset viewpoint', 'viewpoint', 'at sunset', 'at sunrise', 'at night', 'boat cruise', 'river cruise', 'cruise',
  'boat trip', 'boat ride', 'hike', 'sunrise trek', 'trek', 'climb', 'walking tour', 'stadium tour', 'tour',
  'ride', 'safari', 'hiking', 'trail', 'rooftop', 'dome climb', 'show', 'and its lake', 'and its food market',
  'old town', 'town', 'village', 'skywalk', 'museum', 'walk', 'natural pools', 'hot springs', 'cable car', 'gondola',
];
const PREFIXES = [
  'overnight cruise in', 'snorkelling in', 'snorkelling at', 'snorkelling the', 'whale-watching cruise from',
  'whale watching from', 'cycling in', 'game drives in the', 'game drives in', 'sunset from', 'hang-gliding from',
  'hot springs in', 'ziplining in', 'surf lesson in', 'kitesurfing lesson in', 'skiing at', 'snowshoeing in',
  'a day on', 'onward north to', 'walking safari on', 'pletna boat to', 'hot-air balloon over the',
  'a guided night walk in the', 'whitewater rafting on the', 'a show at', 'a local-island visit',
];
const COUNTRY_WORDS = new Set(['croatia', 'montenegro', 'jordan', 'uruguay', 'scotland', 'greece', 'italy', 'spain', 'israel']);
const STOP = new Set(['the', 'a', 'an', 'of', 'de', 'del', 'della', 'dell', 'di', 'la', 'le', 'les', 'el', 'du', 'des',
  'and', 'at', 'in', 'on', 'to', 'from', 'da', 'do', 'dos', 'das', 'i', 'y', 'e', 's', 'l', 'd']);
const BAD_FILE = /(grundriss|lageplan|floor_?plan|_plan_|_plan\.|landkarte|_karte|\bkarte\b|carte_|mapa_|^ISS\d|iss\d{3}e\d|landsat|sentinel-?2|satellite|from_space|_NASA|\bmap\b|_map|map_|locator|location|logo|flag|coat[_ ]of[_ ]arms|\bseal\b|emblem|montage|collage|diagram|\bicon\b|wordmark|signature|\.svg$|\.tiff?$|\.gif$|panorama_layout|floor_?plan)/i;
const BAD_COMMONS = /(stamp|coin|banknote|poster|portrait|ticket|postcard|document|\bbook\b|\bpage\b|letter|scan|drawing|engraving|painting|lithograph|aerial_view_from_iss|\bsign\b)/i;
const FREE = /^(cc0|cc[- ]zero|public domain|pd|cc by(-sa)?( \d(\.\d)?)?( [a-z]{2,3})?$|attribution|attribution-sharealike)/i;
const NONFREE = /(\bnc\b|\bnd\b|non-?commercial|no ?deriv|fair use|non-?free|copyrighted)/i;

// ---------- helpers ----------
const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[øØ]/g, 'o').replace(/[æÆ]/g, 'ae')
  .replace(/[ðÐ]/g, 'd').replace(/[þÞ]/g, 'th').replace(/ß/g, 'ss').replace(/[łŁ]/g, 'l').replace(/ı/g, 'i').toLowerCase();
const NORM = { saint: 'st', mount: 'mt', mont: 'mt', monte: 'mt', basilica: 'basilica', museu: 'museum', museo: 'museum', musee: 'museum' };
function tokens(s) {
  return fold(s).replace(/[’'`.]/g, '').split(/[^a-z0-9]+/).filter((t) => t && !STOP.has(t)).map((t) => NORM[t] || t);
}
const core = (title) => title.replace(/\s*\([^)]*\)\s*$/, '').replace(/,.*$/, '');
const slugify = (s) => fold(s).replace(/[’'`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
const stripHtml = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/\s+/g, ' ').trim();
function km(a, b) {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ---------- polite HTTP: ≤ 2 requests/second overall (1/s by default), one retry on 429/5xx ----------
// API responses are cached on disk (os tmpdir) so a rerun after tweaking the heuristics costs few requests.
const CACHE_FILE = join(tmpdir(), 'gerbi-attraction-img', 'api-cache.json');
mkdirSync(dirname(CACHE_FILE), { recursive: true });
const cache = existsSync(CACHE_FILE) && !args.has('--no-cache') ? JSON.parse(readFileSync(CACHE_FILE, 'utf8')) : {};
let cacheDirty = 0;
const saveCache = () => { if (cacheDirty) writeFileSync(CACHE_FILE, JSON.stringify(cache)); cacheDirty = 0; };
let gap = 1500, nextSlot = 0;
async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + gap;
  if (wait) await new Promise((r) => setTimeout(r, wait));
}
async function get(url, { binary = false } = {}) {
  if (!binary && cache[url]) return cache[url];
  for (let attempt = 0; attempt < 2; attempt++) {
    await throttle();
    let res;
    try { res = await fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA }, signal: AbortSignal.timeout(15000) }); } catch (e) {
      if (attempt) throw e; await new Promise((r) => setTimeout(r, 5000)); continue;
    }
    if (res.ok) {
      gap = Math.max(1500, gap * 0.97);
      if (binary) return Buffer.from(await res.arrayBuffer());
      const j = await res.json();
      cache[url] = j; if (++cacheDirty > 20) saveCache();
      return j;
    }
    if ((res.status === 429 || res.status >= 500) && !attempt) {
      gap = Math.min(gap * 1.5, 4000); // back off for the rest of the run
      const ra = Number(res.headers.get('retry-after')) || 30;
      console.warn(`\n${res.status} – waiting ${Math.min(ra, 120)} s, interval now ${gap} ms`);
      await new Promise((r) => setTimeout(r, Math.min(ra, 120) * 1000));
      continue;
    }
    throw new Error(`HTTP ${res.status} ${url.slice(0, 160)}`);
  }
}
async function api(base, params) {
  const q = new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  let out = { pages: [], redirects: [], normalized: [] }, cont = {};
  for (let i = 0; i < 10; i++) {
    const j = await get(`${base}?${new URLSearchParams({ ...Object.fromEntries(q), ...cont })}`);
    const qq = j.query || {};
    for (const p of qq.pages || []) {
      const prev = out.pages.find((x) => x.title === p.title);
      if (prev) Object.assign(prev, p, { coordinates: prev.coordinates || p.coordinates }); else out.pages.push(p);
    }
    out.redirects.push(...(qq.redirects || [])); out.normalized.push(...(qq.normalized || []));
    if (!j.continue) break;
    cont = j.continue;
  }
  return out;
}
const PAGE_PROPS = { prop: 'pageimages|coordinates|pageprops|description', piprop: 'original|name', pilimit: '50',
  colimit: 'max', ppprop: 'disambiguation', pilicense: 'free' };

// ---------- matching ----------
function candidates(name) {
  const out = [];
  const add = (s) => { s = s.replace(/\s+/g, ' ').replace(/^[\s,–—-]+|[\s,–—-]+$/g, '').trim(); if (s.length > 2 && !out.includes(s)) out.push(s); };
  const variants = (s) => {
    const r = [s];
    let t = s.replace(/^(the|a|an)\s+/i, '');
    r.push(t);
    for (const p of PREFIXES) if (fold(t).startsWith(p + ' ')) { t = t.slice(p.length + 1); r.push(t); }
    let changed = true;
    while (changed) {
      changed = false;
      for (const suf of SUFFIXES) if (fold(t).endsWith(' ' + suf)) { t = t.slice(0, -suf.length - 1); r.push(t); changed = true; }
    }
    return r;
  };
  const noParen = name.replace(/\s*\([^)]*\)/g, '');
  const paren = [...name.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]);
  const parts = [name, noParen];
  for (const sep of [' — ', ' – ', ' & ', ' and ', ', ', ' with ']) {
    // "Chapel Bridge, Lucerne": the part after a comma is a locality qualifier, never the attraction itself.
    for (const p of [...parts]) if (p.includes(sep)) parts.push(...(sep === ', ' ? [p.split(sep)[0]] : p.split(sep)));
  }
  for (const p of parts) for (const v of variants(p)) add(v);
  for (const p of paren) if (!COUNTRY_WORDS.has(fold(p)) && /^[A-Z]/.test(p)) for (const v of variants(p)) add(v);
  return out;
}

// Does a Wikipedia title plausibly name the candidate? Core tokens of the title must be covered by the candidate
// (or the destination's place words), and cover at least half of the candidate's tokens.
function titleMatches(cand, title, placeTokens) {
  const A = new Set(tokens(cand)), B = tokens(core(title));
  if (!A.size || !B.length) return false;
  for (const t of B) if (!A.has(t) && !placeTokens.has(t)) return false;
  const covered = [...A].filter((t) => B.includes(t)).length;
  return covered >= Math.max(1, Math.ceil(A.size / 2));
}

function accept(page, d, isTrip, extraPlaces = []) {
  if (!page || page.missing || page.invalid) return 'missing';
  if (page.pageprops && 'disambiguation' in page.pageprops) return 'disambiguation';
  if (d.forbidden.has(fold(page.title))) return 'is the destination itself';
  const c = page.coordinates?.[0];
  if (c && d.ref) {
    const dist = km(d.ref, c), lim = isTrip ? d.dayKm : d.km;
    if (dist > lim) return `too far (${Math.round(dist)} km)`;
    return null;
  }
  const desc = fold(page.description || '') + ' ' + fold(page.title);
  const words = (x) => ` ${x.replace(/[^a-z0-9]+/g, ' ').trim()} `;
  if ([...d.placeWords, ...extraPlaces].some((w) => words(desc).includes(words(w)))) return null;
  return 'no coordinates / unrelated description';
}

// ---------- main ----------
const { destinations } = await import(pathToFileURL(join(ROOT, 'dist/catalog.mjs')).href);
let previous = {};
if (existsSync(MAP_FILE)) previous = (await import(pathToFileURL(MAP_FILE).href + '?t=' + Date.now())).default || {};

const items = [];
for (const d of destinations) {
  if (ONLY && d.id !== ONLY) continue;
  for (const a of d.attractions || []) items.push({ d, en: a.name.en, isTrip: false });
  for (const t of d.dayTrips || []) items.push({ d, en: t.name.en, isTrip: true });
}

// Destination context: reference coordinates + words that may appear in descriptions/qualifiers.
const ctx = {};
{
  const refTitles = [...new Set(destinations.map((d) => (REF[d.id]?.[0]) || d.name.en))];
  const res = { pages: [], redirects: [], normalized: [] };
  for (let i = 0; i < refTitles.length; i += 50) { // the API takes at most 50 titles per request
    const r = await api(WP, { action: 'query', redirects: '1', titles: refTitles.slice(i, i + 50).join('|'), prop: 'coordinates', colimit: 'max' });
    for (const k of Object.keys(res)) res[k].push(...r[k]);
  }
  const resolve = makeResolver(res);
  for (const d of destinations) {
    const [refTitle, kmA = 250, kmT] = REF[d.id] || [d.name.en];
    const page = resolve(refTitle);
    const c = page?.coordinates?.[0];
    if (!c) { console.error(`! no reference coordinates for ${d.id} (${refTitle}) – fix REF before running`); process.exitCode = 1; continue; }
    // Whole place names only (single tokens like "port" or "lake" are far too generic).
    const placeWords = [...new Set([d.name.en, d.country.en, core(refTitle), ...(d.areas || []).map((a) => a.name.en)]
      .map((s) => fold(core(s)).trim()).filter((w) => w.length > 3))];
    ctx[d.id] = {
      ref: c ? { lat: c.lat, lon: c.lon } : null, km: kmA, dayKm: kmT || kmA * 2.5,
      placeWords, placeTokens: new Set([d.name.en, d.country.en, refTitle].flatMap(tokens)),
      // The destination itself is never an attraction photo; its reference city only when the name contains it
      // (Mauritius → Port Louis is a legitimate day trip, "Milan & Lake Como" → Milan is not).
      forbidden: new Set([d.name.en, d.country.en, ...(fold(d.name.en).includes(fold(core(refTitle))) ? [refTitle, page?.title || ''] : [])].map(fold)),
      city: core(refTitle),
    };
  }
}

if (process.exitCode) process.exit(1);

function makeResolver(res) {
  const byTitle = new Map(res.pages.map((p) => [p.title, p]));
  const norm = new Map(res.normalized.map((n) => [n.from, n.to]));
  const redir = new Map(res.redirects.map((r) => [r.from, r.to]));
  return (t) => {
    let x = norm.get(t) || t;
    for (let i = 0; i < 3 && redir.has(x); i++) x = redir.get(x);
    return byTitle.get(x);
  };
}

const results = {}; // key → { page, file }
const skipped = [];
const keyOf = (it) => `${it.d.id}|${it.en}`;
const todo = [];
for (const it of items) {
  const prev = previous[keyOf(it)];
  const reviewedOut = DENY.has(keyOf(it)) || (prev && BAD_FILE.test(decodeURIComponent(prev.source)));
  if (!REFRESH && prev && !reviewedOut && existsSync(join(ROOT, 'dist', prev.src))) results[keyOf(it)] = { entry: prev };
  else todo.push(it);
}
console.log(`${items.length} items, ${items.length - todo.length} kept from previous run, ${todo.length} to match`);

// Phase 1: exact titles (batched 50 per request).
const allCands = new Map();
for (const it of todo) { it.cands = candidates(it.en); for (const c of it.cands) allCands.set(c, null); }
const titleList = [...allCands.keys()];
const pageFor = new Map();
for (let i = 0; i < titleList.length; i += 50) {
  const batch = titleList.slice(i, i + 50);
  let res;
  try { res = await api(WP, { action: 'query', redirects: '1', titles: batch.join('|'), ...PAGE_PROPS }); }
  catch (e) { console.warn(`\ntitle batch failed: ${e.message.slice(0, 80)}`); continue; }
  const resolve = makeResolver(res);
  for (const t of batch) pageFor.set(t, resolve(t));
  process.stdout.write(`\rtitle lookup ${Math.min(i + 50, titleList.length)}/${titleList.length}`);
}
console.log();

function pickFrom(it, pages, viaSearch) {
  const d = ctx[it.d.id];
  const reasons = [];
  for (const [cand, page] of pages) {
    if (!page || page.missing) continue;
    if (viaSearch && !titleMatches(cand, page.title, d.placeTokens)) { reasons.push(`${page.title}: title mismatch`); continue; }
    if (!viaSearch && !titleMatches(cand, page.title, d.placeTokens) && !titleMatches(page.title, cand, d.placeTokens)) {
      // A redirect to a differently named article (e.g. "The Acropolis" → "Acropolis of Athens") is fine as long
      // as the geo check passes; only flag it when nothing in common at all.
      if (!tokens(page.title).some((t) => tokens(cand).includes(t))) { reasons.push(`${page.title}: redirect unrelated`); continue; }
    }
    const why = accept(page, d, it.isTrip, [...it.en.matchAll(/\(([^)]*)\)/g)].map((m) => fold(m[1])).filter((w) => COUNTRY_WORDS.has(w)));
    if (why) { reasons.push(`${page.title}: ${why}`); continue; }
    return { page, cand };
  }
  return { reasons };
}

if (ONLY) for (const [k, v] of Object.entries(previous)) if (!k.startsWith(ONLY + '|')) results[k] = { entry: v };
const tmp = join(tmpdir(), 'gerbi-attraction-img');
mkdirSync(tmp, { recursive: true });
const usedSlugs = new Set(Object.values(results).map((r) => r.entry.src));

// Rewrites the "Attraction photos" section at the end of ASSETS.md (everything after its heading).
function writeAssets(entries) {
  const md = existsSync(ASSETS_FILE) ? readFileSync(ASSETS_FILE, 'utf8') : '';
  const head = '## Attraction photos';
  const before = md.includes(head) ? md.slice(0, md.indexOf(head)).trimEnd() : md.trimEnd();
  const cell = (x) => String(x).replace(/\|/g, '\\|');
  const rows = entries.map(([k, e]) => {
    const file = decodeURIComponent(e.source.split('File:')[1] || e.source).replace(/_/g, ' ');
    return `| ${cell(k.replace('|', ' / '))} | \`dist${e.src}\` | [${cell(file)}](${e.source}) | ${cell(e.credit)} | ${cell(e.license)} |`;
  });
  const section = `${head}

One photo per catalog attraction / day trip where a matching Wikipedia article with a free lead image exists, fetched by \`scripts/fetch-attraction-images.mjs\` from **Wikimedia Commons** (no hotlinking), converted locally with \`cwebp\` to 640px WebP (q78) in \`dist/assets/attractions/<destinationId>/\`. Only CC0 / public-domain / CC BY / CC BY-SA files were accepted; CC BY(-SA) requires attribution (credit + licence link). Items without a confident match are left without a photo. Metadata (credit, licence, source, article) lives in \`dist/catalog/attraction-images.mjs\`. ${entries.length} photos.

| Item | File | Source (Commons) | Author | Licence |
|---|---|---|---|---|
${rows.join('\n')}
`;
  writeFileSync(ASSETS_FILE, `${before}\n\n${section}`);
}

// Writes the map (catalog order); on the final call also drops files nobody references.
function writeMap(final) {
  const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const allKeys = [...new Set([...items.map(keyOf), ...Object.keys(previous)])].filter((k) => results[k]);
  const lines = allKeys.map((k) => {
    const e = results[k].entry;
    return `  ${q(k)}: { src: ${q(e.src)}, credit: ${q(e.credit)}, license: ${q(e.license)}, source: ${q(e.source)}${e.article ? `, article: ${q(e.article)}` : ''} },`;
  });
  const header = "// Attraction / day-trip photos: '<destinationId>|<English name>' → local 640px WebP + attribution.\n" +
    '// Generated by scripts/fetch-attraction-images.mjs from Wikipedia lead images (Wikimedia Commons, free licences only).\n' +
    '// Items without a confidently matching article are left out (wrong photos are worse than none). Credits: ASSETS.md.\n';
  if (!DRY) {
    writeFileSync(MAP_FILE, `${header}export default {\n${lines.join('\n')}\n};\n`);
    writeAssets(allKeys.map((k) => [k, results[k].entry]));
    if (!final) return;
    const keep = new Set(allKeys.map((k) => join(ROOT, 'dist', results[k].entry.src)));
    if (existsSync(OUT_DIR)) for (const d of readdirSync(OUT_DIR)) {
      const dd = join(OUT_DIR, d);
      if (!statSync(dd).isDirectory()) continue;
      for (const f of readdirSync(dd)) if (!keep.has(join(dd, f))) rmSync(join(dd, f));
      if (!readdirSync(dd).length) rmdirSync(dd);
    }
  }

}

// Day trips first (the brochure shows them), then attractions; 50 items per chunk, map written after each chunk.
todo.sort((x, y) => Number(y.isTrip) - Number(x.isTrip));
for (let ci = 0; ci < todo.length; ci += 50) {
  const chunk = todo.slice(ci, ci + 50);
  for (const it of chunk) {
    if (DENY.has(keyOf(it))) { it.why = 'denied after manual review'; continue; }
    let r = pickFrom(it, it.cands.map((c) => [c, pageFor.get(c)]), false);
    if (!r.page) {
      const reasons = [...r.reasons];
      for (const cand of it.cands.slice(0, 2)) {
        if (tokens(cand).length === 0) continue;
        let res;
        try {
          res = await api(WP, { action: 'query', generator: 'search', gsrsearch: `${cand} ${ctx[it.d.id].city}`,
            gsrlimit: '6', gsrnamespace: '0', ...PAGE_PROPS });
        } catch (e) { reasons.push(`search failed: ${e.message.slice(0, 40)}`); continue; }
        const ordered = res.pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
        r = pickFrom(it, ordered.map((p) => [cand, p]), true);
        if (r.page) break;
        reasons.push(...r.reasons.slice(0, 2));
      }
      if (!r.page) r.reasons = reasons;
    }
    if (r.page) it.page = r.page; else it.why = r.reasons.slice(0, 3).join('; ') || 'no Wikipedia article found';
  
  }

  // Phase 2: Commons fallback for matched articles without a free lead image.
  for (const it of chunk) {
    if (!it.page) continue;
    const lead = it.page.pageimage;
    if (lead && !BAD_FILE.test(lead) && /\.(jpe?g|webp)$/i.test(lead)) continue;
    if (lead) it.page.rejectedLead = lead, delete it.page.pageimage; // flag / map / montage / png → try Commons
    const title = core(it.page.title);
    let res;
    try {
      res = await api(COMMONS, { action: 'query', generator: 'search', gsrsearch: `${title} ${it.d.country.en} filetype:bitmap`,
        gsrnamespace: '6', gsrlimit: '10', prop: 'coordinates', colimit: 'max' });
    } catch { it.why = `${it.page.title}: commons search failed`; continue; }
    const want = tokens(title);
    const hit = res.pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0)).find((p) => {
      const f = p.title.replace(/^File:/, '');
      if (BAD_FILE.test(f) || BAD_COMMONS.test(f) || !/\.(jpe?g|webp)$/i.test(f)) return false;
      const base = f.replace(/\.[a-z]+$/i, '');
      const ft = new Set(tokens(base));
      if (!want.every((t) => ft.has(t))) return false;
      // Same-name places elsewhere (Patagonia, Arizona): use the file's own coordinates when it has them,
      // otherwise require the destination's city/country in the file name too.
      const c = p.coordinates?.[0], dctx = ctx[it.d.id];
      if (c) return km(dctx.ref, c) <= (it.isTrip ? dctx.dayKm : dctx.km) * 1.2;
      const w = ` ${fold(base).replace(/[^a-z0-9]+/g, ' ')} `;
      const titleWords = ` ${fold(title).replace(/[^a-z0-9]+/g, ' ').trim()} `;
      return dctx.placeWords.some((pw) => {
        const pww = ` ${pw.replace(/[^a-z0-9]+/g, ' ').trim()} `;
        return !titleWords.includes(pww) && w.includes(pww); // a place word beyond the title itself
      });
    });
    if (hit) it.page.pageimage = hit.title.replace(/^File:/, '').replace(/ /g, '_'), it.viaCommons = true;
    else it.why = `${it.page.title}: ${it.page.rejectedLead ? `lead image unusable (${it.page.rejectedLead}), no Commons match` : 'article has no free image'}`;
  }

  // Phase 3: licence + author + thumbnail URL from Commons (batched).
  const files = [...new Set(chunk.filter((it) => it.page?.pageimage).map((it) => it.page.pageimage))];
  const info = new Map();
  for (let i = 0; i < files.length; i += 50) {
    const batch = files.slice(i, i + 50).map((f) => 'File:' + f.replace(/_/g, ' '));
    let res;
    for (let attempt = 0; attempt < 3 && !res; attempt++) {
      try { res = await api(COMMONS, { action: 'query', titles: batch.join('|'), prop: 'imageinfo',
        iiprop: 'url|extmetadata|mime|size', iiurlwidth: '640', iiextmetadatafilter: 'LicenseShortName|Artist|Credit|NonFree|UsageTerms' }); }
      catch (e) { console.warn(`\nimageinfo batch failed: ${e.message.slice(0, 80)}`); await new Promise((r) => setTimeout(r, 60000)); }
    }
    if (!res) { for (const t of batch) info.set(t, 'failed'); continue; }
    const resolve = makeResolver(res);
    for (const t of batch) info.set(t, resolve(t));
  }

  for (const it of chunk) {
    if (!it.page?.pageimage) continue;
    const f = it.page.pageimage;
    const p = info.get('File:' + f.replace(/_/g, ' '));
    if (p === 'failed') { it.why = `${f}: imageinfo request failed (rate limit) – rerun`; continue; }
    const ii = p?.imageinfo?.[0];
    if (!ii) { it.why = `${f}: not on Commons (local / non-free)`; continue; }
    const m = ii.extmetadata || {};
    const lic = stripHtml(m.LicenseShortName?.value);
    if (BAD_FILE.test(f)) { it.why = `${f}: map/logo/collage`; continue; }
    if (!/^image\/(jpeg|webp)$/.test(ii.mime)) { it.why = `${f}: ${ii.mime}`; continue; }
    if (m.NonFree?.value || NONFREE.test(lic) || !FREE.test(lic)) { it.why = `${f}: licence "${lic}"`; continue; }
    if (ii.width < 300) { it.why = `${f}: too small`; continue; }
    let artist = stripHtml(m.Artist?.value) || stripHtml(m.Credit?.value) || 'Unknown author';
    if (artist.length > 100) artist = artist.slice(0, 97).replace(/\s+\S*$/, '') + '…';
    it.img = { thumb: ii.thumburl || ii.url, source: ii.descriptionurl, credit: artist,
      license: /^public domain$/i.test(lic) ? 'Public domain' : lic.replace(/^cc-zero$/i, 'CC0') };
  }

  // Phase 4: download + convert.
  for (const it of chunk) {
    if (!it.img) continue;
    const dir = join(OUT_DIR, it.d.id);
    let slug = slugify(it.en) || 'item';
    let src = `/assets/attractions/${it.d.id}/${slug}.webp`;
    for (let k = 2; usedSlugs.has(src); k++) src = `/assets/attractions/${it.d.id}/${slug}-${k}.webp`;
    usedSlugs.add(src);
    const dest = join(ROOT, 'dist', src);
    const prev = previous[keyOf(it)];
    const entry = { src, credit: it.img.credit, license: it.img.license, source: it.img.source, article: `https://en.wikipedia.org/wiki/${encodeURIComponent(it.page.title.replace(/ /g, '_'))}` };
    if (existsSync(dest) && (!prev || prev.source === entry.source)) { results[keyOf(it)] = { entry }; continue; }
    if (DRY) { results[keyOf(it)] = { entry }; continue; }
    try {
      mkdirSync(dir, { recursive: true });
      const buf = await get(it.img.thumb, { binary: true });
      const ext = it.img.thumb.match(/\.(jpe?g|png|webp)(?:$|\?)/i)?.[1] || 'jpg';
      const raw = join(tmp, `in.${ext}`);
      writeFileSync(raw, buf);
      execFileSync(CWEBP, ['-quiet', '-q', '78', '-resize', '640', '0', '-metadata', 'none', raw, '-o', dest]);
      results[keyOf(it)] = { entry };
    } catch (e) {
      it.why = `download/convert failed: ${e.message}`;
    }
  }


  writeMap(false);
  saveCache();
  console.log(`chunk ${ci / 50 + 1}/${Math.ceil(todo.length / 50)} done: ${Object.keys(results).length} photos so far`);
}
writeMap(true);

const report = { matched: [], skipped: [] };
for (const it of items) {
  const r = results[keyOf(it)];
  if (r) report.matched.push({ key: keyOf(it), trip: it.isTrip, article: it.page?.title, file: it.page?.pageimage, viaCommons: !!it.viaCommons, ...r.entry });
  else report.skipped.push({ key: keyOf(it), trip: it.isTrip, why: it.why || 'not matched' });
}
writeFileSync(join(tmp, 'report.json'), JSON.stringify(report, null, 1));
const cnt = (trip) => [report.matched.filter((m) => m.trip === trip).length, items.filter((i) => i.isTrip === trip).length];
const [a, A] = cnt(false), [t, T] = cnt(true);
saveCache();
console.log(`attractions ${a}/${A}, day trips ${t}/${T}; report: ${join(tmp, 'report.json')}`);
