import { styles } from './personalization.mjs';
import { offerPrice, formatFare, carrierOf, hoursText, LONG_LAYOVER_MINUTES, offerFacts, emptyFilters, matchesFilters, sortFacts, TIME_BUCKETS } from './flight-view.mjs';
import { parsePreferences, rankDemoTrips, estimateDemoTotal, validFlightDates } from './planner.mjs';
import { trips, contact } from './data.mjs';
import { places, resolvePlace, placeSuggestions, placeType, placeText, placeByCode } from './places.mjs';
import { initDealsStrip } from './deals-strip.mjs';
import { placeCombobox, openRangePicker, travelersPopover, travelersText } from './search-form.mjs';
import { scoreOffers, rankScored, needsTieBreak, badges, diverseTop, explain, itineraryKey, features } from './scoring.mjs';
import { SAVED_FLIGHTS_KEY, flightSnapshot, restoreSavedFlights, addSavedFlight, searchLink, parseSearchLink, followUpText, contactActions } from './saved-flights.mjs';
import { initPages } from './pages.mjs';
import { leadRoutes, installResultsCta } from './leads.mjs';
import { initSiteContent, cmsRoutes } from './cms-public.mjs';
import { loadFx, onFx, getFx, fxNote, originalHtml, priceBasis, fareText } from './fx.mjs';
import { converterRoutes, converterHtml, wireConverter } from './converter.mjs';
import { legalRoutes } from './legal.mjs';
import { buildRoutes } from './build.mjs';
import { bookingRoutes } from './booking.mjs';
import { bookingConfig, startBooking } from './booking-client.mjs';
import './support-bot.mjs';
import { flightTakeSlot, mountFlightTake } from './ai-client.mjs';
import { initMultiCity } from './multi-city.mjs';
import { legName, routeText, groundGaps, gapText, multiLink, cleanRoute } from './multi-city-core.mjs';
import { perPassenger, PTC_LABEL, seatsLeft, FEW_SEATS, fareInclusions, layoverAirports } from './fare-extras.mjs';
import { t as tr, lang, locale, fmtMoney, errorText } from './i18n.mjs';
import { byId } from './catalog.mjs';
import { startDidYouKnow } from './did-you-know.mjs';
import { homePicks, homeCard, L } from './destinations-ui.mjs';
const icons=name=>`<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const money=n=>fmtMoney(n);
const $=s=>document.querySelector(s);
let favorites=[];try{favorites=JSON.parse(localStorage.getItem('gerbi-favorites')||'[]');if(!Array.isArray(favorites))favorites=[];favorites=[...new Set(favorites.filter(id=>byId(id)))];}catch{}
// Home showcase (spec 23): varied catalog picks for the season and the chosen styles; a destination asked for in the
// planner leads but never hides the rest (it used to filter the showcase down to that one trip — the "only Greece" bug).
function renderCards(){const p=currentShowcasePreferences();$('#cards').innerHTML=homePicks(p).map(({destination,reason})=>homeCard(destination,{favorites,reason:reason?tr('catalog.home.reason')+reason:''})).join('');}
function currentShowcasePreferences(){const p=state.preferences||{};return {beach:p.beach,city:p.city,family:p.family,relaxation:p.relaxation,couple:p.couple,children:state.children,month:p.month,start:state.start,want:p.want,exclude:p.exclude};}
for(const image of document.querySelectorAll('img[src="/assets/mascot.webp"]')){image.onload=()=>image.hidden=false;if(image.complete&&image.naturalWidth)image.hidden=false;}
const state={tab:'flights',adults:2,children:0,start:'',end:'',preferences:{},activeTrip:null,edits:{},requests:{},voleroResults:null};
try {
 const saved=JSON.parse(localStorage.getItem('gerbi-preferences')||'{}');
 for(const style of styles) if(typeof saved?.[style.id]==='boolean')state.preferences[style.id]=saved[style.id];
} catch {}
$('.skip-link').onclick=e=>{e.preventDefault();$('#main-content').focus();$('#main-content').scrollIntoView({block:'start'});};
const modal=$('#modal');
let toastTimer;
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3500);}
function openModal(html){$('#modal-content').innerHTML=html;const title=$('#modal-content h2');if(title){title.id='dialog-title';modal.setAttribute('aria-labelledby','dialog-title');}if(!modal.open)modal.showModal();}
$('.modal-close').addEventListener('click',()=>modal.close());
modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close();}});
const onHome=()=>(location.hash.slice(1)||'/').split('?')[0]==='/';
function localDate(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
function shortDate(value){return new Date(value+'T12:00:00').toLocaleDateString(locale(),{day:'numeric',month:'short'});}
const oneWay=()=>document.querySelector('[name="trip-type"]:checked')?.value==='oneway';
const setTripType=type=>{const input=document.querySelector(`[name="trip-type"][value="${['oneway','multi'].includes(type)?type:'round'}"]`);if(input)input.checked=true;multiCity?.sync();};
const originPlace=()=>resolvePlace($('#origin').value);
function showDates(){const has=oneWay()?Boolean(state.start):Boolean(state.start&&state.end);$('#dates-value').textContent=has?(oneWay()?shortDate(state.start):`${shortDate(state.start)} – ${shortDate(state.end)}`):tr('app.dates.placeholder');$('#dates-value').classList.toggle('muted',!has);}
function longDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(value||'')?new Date(value+'T12:00:00').toLocaleDateString(locale(),{weekday:'short',day:'numeric',month:'numeric',year:'numeric'}):'';}
function openDates(){
 openRangePicker({start:state.start,end:state.end,oneWay:oneWay(),today:localDate(),returnFocus:$('#dates-button'),validate:(start,end,single)=>validFlightDates(start,end,localDate(),single),
  onTripType:type=>{setTripType(type);showDates();markStaleResults();},
  onApply:({start,end,oneWay:single})=>{state.start=start;state.end=single&&end<start?'':end;
   // The planner counts nights; a same-day or one-way flight leaves its night count untouched.
   if(!single&&end>start)state.preferences.nights=Math.round((new Date(end)-new Date(start))/86400000);
   showDates();document.dispatchEvent(new Event('brief-changed'));$('#travelers-button').focus();}});
}
$('#dates-button').onclick=openDates;
$('#travelers-button').setAttribute('aria-haspopup','dialog');$('#travelers-button').setAttribute('aria-expanded','false');
$('#travelers-button').onclick=()=>travelersPopover($('#travelers-button'),{get:()=>({adults:state.adults,children:state.children}),
 set:({adults,children})=>{state.adults=adults;state.children=children;$('#travelers-value').textContent=travelersText(adults,children);},
 onClose:()=>document.dispatchEvent(new Event('brief-changed'))});
// Spec 10: the third trip type, "כמה יעדים" (2–5 legs, open jaw included). Seeds from and back to the main fields.
const multiCity=initMultiCity({form:$('#search-form'),today:()=>localDate(),
 seed:()=>({from:$('#origin').value,to:$('#destination').value,start:state.start,end:state.end}),
 unseed:({from,to,start,end})=>{$('#origin').value=from;$('#destination').value=to;state.start=start;state.end=end&&end>=start?end:'';showDates();}});
const isMulti=()=>multiCity.active()&&state.tab==='flights';
function selectTab(tab){if(activeSearch)return;state.tab=tab;$('.trip-type').hidden=tab!=='flights';$('#search-mode-note').textContent=tab==='flights'?tr('app.mode.flights'):tr('app.mode.inspiration');document.querySelectorAll('[data-tab]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.tab===tab));b.tabIndex=b.dataset.tab===tab?0:-1;});$('.origin-field').style.display=tab==='hotels'?'none':'';$('.swap').style.display=tab==='hotels'?'none':'';$('.search-fields').classList.toggle('hotel-mode',tab==='hotels');$('.search-submit').innerHTML=icons('search')+({flights:tr('app.tab.flights.submit'),hotels:tr('app.tab.hotels.submit'),packages:tr('app.tab.packages.submit')})[tab];}
const tabButtons=[...document.querySelectorAll('[data-tab]')];tabButtons.forEach((b,i)=>{b.tabIndex=i===0?0:-1;b.onclick=()=>selectTab(b.dataset.tab);b.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?2:(i+(e.key===(lang==='en'?'ArrowRight':'ArrowLeft')?1:-1)+3)%3;selectTab(tabButtons[n].dataset.tab);tabButtons[n].focus();}};});
function currentPreferences(){return{...state.preferences,adults:state.adults,children:state.children,...(state.start&&state.end?{nights:Math.round((new Date(state.end)-new Date(state.start))/86400000)}:{})};}
function voleroSearchRequest(){
 if(isMulti())return multiCity.request(state.adults,state.children);
 const destination=($('#destination').value||'').trim(), place=resolvePlace(destination), code=place?.code||'';
 const from=originPlace(), single=oneWay();
 const fail=(message,field)=>Object.assign(new Error(message),{field});
 const unknown=(value,example)=>{const near=placeSuggestions(value);return near.length?tr('app.err.unknownNear', { value, options: near.map(x=>x.label).join(' / ') }):tr('app.err.unknownPlace', { value, example });};
 if(!from) throw fail($('#origin').value.trim()?unknown($('#origin').value.trim(),tr('app.err.exampleOrigin')):tr('app.err.noOrigin'),'#origin');
 if(!destination) throw fail(tr('app.err.noDestination'),'#destination');
 if(!validFlightDates(state.start,state.end,localDate(),single)) throw fail(single?tr('app.err.noDate'):tr('app.err.noDates'),'#dates-button');
 if(!place) throw fail(unknown(destination,tr('app.err.exampleDestination')),'#destination');
 if(code===from.code) throw fail(tr('app.err.sameRoute'),'#destination');
 $('#destination').value=placeText(place);$('#origin').value=placeText(from);
 const leg=(a,b,date)=>({origin:{code:a,type:placeType(a)},destination:{code:b,type:placeType(b)},date});
 return {originDestinations:single?[leg(from.code,code,state.start)]:[leg(from.code,code,state.start),leg(code,from.code,state.end)],passengers:{ptcList:[{ptc:'ADT',count:state.adults},...(state.children?[{ptc:'CHD',count:state.children}]:[] )]},sellingChannel:'B2B',language:'en_GB',timeout:10};
}
let savedFlights=[];try{savedFlights=restoreSavedFlights(localStorage.getItem(SAVED_FLIGHTS_KEY));}catch{ /* Saving needs browser storage; the search still works without it. */ }
function storeSavedFlights(list){savedFlights=list;try{localStorage.setItem(SAVED_FLIGHTS_KEY,JSON.stringify(list));return true;}catch{toast(tr('app.save.storageFailed'));return false;}}
const verifiedPrices=new Map();
const verifiedStamp=v=>`<p class="verified-stamp">${tr('app.verified.at', { time: escapeHTML(v.at.toLocaleTimeString(locale(),{hour:'2-digit',minute:'2-digit'})) })} <strong dir="ltr">${escapeHTML(formatFare(v.price))}</strong>${v.changed?tr('app.verified.changed'):''}</p>`;
let pendingFilters=null;
let searchContext=null, activeSearch=null, visibleOfferCount=12, flightSort='recommended';
// ---- Decision layer (docs/gerbi-decision-engine-spec-he.md): score → memory boost → LLM only on a near tie.
let partnerAvailable=false;fetch('/api/status').then(r=>r.json()).then(s=>{partnerAvailable=s.partner?.available===true;}).catch(()=>{});
const decision={boosts:{},learned:{},pick:null,reason:'',asked:new Set(),order:[]};
const BADGE_LABELS={recommended:tr('app.badge.recommended'),cheapest:tr('app.badge.cheapest'),fastest:tr('app.badge.fastest'),value:tr('app.badge.value')};
// The brief that weighs the score: the planner's request plus what this search asked for.
const decisionBrief=()=>{const p=state.preferences||{};return {cheaper:p.cheaper===true,children:state.children,adults:state.adults,stops:p.stops,out:p.out,back:p.back,checkedBag:p.checkedBag===true,carrier:p.carrier};};
const memoryBrief=()=>({...decisionBrief(),origin:searchContext?.search?.origin,destination:searchContext?.destinationCode,start:searchContext?.search?.start,tripType:searchContext?.search?.type,nights:state.preferences?.nights,beach:state.preferences?.beach,city:state.preferences?.city,relaxation:state.preferences?.relaxation,family:state.preferences?.family,couple:state.preferences?.couple});
// A verify/save on an offer the list ranked lower carries the features of the offers above it (no identities).
function choiceOf(key){const i=decision.order.findIndex(x=>x.key===key);if(i<=0)return undefined;const brief=decisionBrief();return {chosen:features(decision.order[i].facts,brief),above:decision.order.slice(0,Math.min(i,5)).map(x=>features(x.facts,brief))};}
function aiEvent(event,items){const list=[].concat(items).filter(Boolean);if(!list.length||!searchContext)return;const choice=['verify','save'].includes(event)?choiceOf(list[0]):undefined;fetch('/api/ai/event',{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({brief:memoryBrief(),items:list,event,choice})}).catch(()=>{});}
async function loadBoosts(payload){
 try{const items=[...new Set(factsOf(payload).map(itineraryKey))].slice(0,200);const response=await fetch('/api/ai/memory',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({brief:memoryBrief(),items})});
  const data=await response.json();if(state.voleroResults!==payload)return;decision.learned=data.learned||{};const changed=Object.values(data.boosts||{}).some(v=>v)||Object.values(decision.learned).some(v=>v);decision.boosts=data.boosts||{};if(changed)renderVoleroOffers(payload);}catch{ /* Memory is a refinement only. */ }
}
async function askTieBreak(payload,ranked){
 const top=ranked.slice(0,3),signature=payload.srk+'|'+top.map(x=>x.key).join(',');
 if(!partnerAvailable||decision.asked.has(signature))return;decision.asked.add(signature);
 const candidates=top.map(x=>({key:x.key,price:x.facts.price?.value,currency:x.facts.price?.currency,minutes:x.facts.totalMinutes,stops:x.facts.stops,longestWait:x.facts.longestLayover,departs:x.facts.legs.map(l=>l.segments[0]?.departure?.time).filter(Boolean),bag:x.facts.checked,carrier:x.facts.carriers.join(' + ')}));
 try{const data=await(await fetch('/api/ai/tiebreak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({brief:decisionBrief(),candidates,lang})})).json();
  if(data.pick&&state.voleroResults===payload){decision.pick=data.pick;decision.reason=data.reason||'';renderVoleroOffers(payload);}}catch{ /* The computed order stands. */ }
}
const searchParams=()=>isMulti()?JSON.stringify(['multi',multiCity.signature(),state.adults,state.children]):JSON.stringify([originPlace()?.code||$('#origin').value.trim(),resolvePlace($('#destination').value)?.code||$('#destination').value.trim(),oneWay()?'oneway':'round',state.start,oneWay()?'':state.end,state.adults,state.children]);
// F02: a refresh brings back the search details (no passenger data, no prices: those must be fetched again).
const LAST_SEARCH_KEY='gerbi-last-flight-search-v1';
function saveLastSearch(){try{localStorage.setItem(LAST_SEARCH_KEY,JSON.stringify(isMulti()?{type:'multi',legs:searchContext.search.legs}:{origin:originPlace()?.code||'',destination:$('#destination').value.trim(),start:state.start,end:oneWay()?'':state.end,type:oneWay()?'oneway':'round'}));}catch{ /* Restoring is a convenience only. */ }}
function restoreLastSearch(){
 let saved=null;try{saved=JSON.parse(localStorage.getItem(LAST_SEARCH_KEY)||'null');}catch{return;}
 if(saved?.type==='multi'){const legs=cleanRoute(saved.legs);if(!legs||legs[0].date<localDate())return;setTripType('multi');multiCity.setLegs(legs);$('#search-feedback').textContent=tr('app.restore.route');$('#search-feedback').hidden=false;return;}
 const place=resolvePlace(saved?.destination);if(!place||!validFlightDates(saved.start,saved.end,localDate(),saved.type==='oneway'))return;
 setTripType(saved.type);const from=resolvePlace(saved.origin);if(from)$('#origin').value=placeText(from);
 $('#destination').value=placeText(place);state.start=saved.start;state.end=saved.end;
 $('#search-feedback').textContent=tr('app.restore.search');$('#search-feedback').hidden=false;
}
// Results stay visible after the traveler edits the brief, but never look like an answer to the new details.
function markStaleResults(){
 const host=$('#live-results');if(!searchContext||host.hidden)return;
 const stale=searchParams()!==searchContext.params;host.classList.toggle('stale',stale);
 host.querySelectorAll('[data-volero-offer]').forEach(b=>b.disabled=stale);
 const note=$('#stale-note');
 if(stale&&!activeSearch)$('#search-feedback').hidden=true;
 if(stale&&!note){host.insertAdjacentHTML('afterbegin',`<div id="stale-note" class="stale-note" role="status"><p>${tr('app.stale.text', { destination: escapeHTML(searchContext.destination), dates: escapeHTML(searchContext.dates), count: searchContext.travelers })}</p><button type="button" class="button yellow" id="search-again">${tr('app.stale.again')}</button></div>`);$('#search-again').onclick=()=>$('#search-form').requestSubmit();}
 else if(!stale)note?.remove();
}
$('#destination').addEventListener('input',markStaleResults);$('#origin').addEventListener('input',markStaleResults);
document.querySelectorAll('[name="trip-type"]').forEach(input=>input.addEventListener('change',()=>{showDates();markStaleResults();}));
$('#swap-route').onclick=()=>{const origin=$('#origin').value;$('#origin').value=$('#destination').value;$('#destination').value=origin;$('#swap-route').classList.toggle('is-flipped');markStaleResults();toast(tr('app.swap.done'));};
// Autocomplete: Hebrew, English or IATA code; choosing the origin moves on to the destination, the destination to the dates.
placeCombobox($('#origin'),{kind:'origin',exclude:()=>resolvePlace($('#destination').value)?.code||'',onCommit:()=>{if(!$('#destination').value.trim())$('#destination').focus();}});
placeCombobox($('#destination'),{kind:'destination',exclude:()=>originPlace()?.code||'',onCommit:()=>{if(state.tab==='flights'&&!(oneWay()?state.start:state.start&&state.end))setTimeout(openDates,60);}});
document.addEventListener('brief-changed',markStaleResults);
// ---- Live results: facts once per search; filters, sort, open details and the comparison survive every re-render.
let flightFilters=emptyFilters(),filtersOpen=!window.matchMedia('(max-width: 760px)').matches;
const openDetails=new Set(),compareOffers=new Map(),factsCache=new WeakMap();
const factsOf=payload=>{if(!factsCache.has(payload))factsCache.set(payload,(Array.isArray(payload?.offers)?payload.offers:[]).map(offer=>offerFacts(offer,payload)));return factsCache.get(payload);};
const point=p=>`${escapeHTML(p?.time||'—')} <small>${escapeHTML(p?.airport?.code||'')}</small>`;
const stopsText=n=>n===0?tr('app.stops.direct'):n===1?tr('app.stops.one'):tr('app.stops.many', { count: n });
const layoverText=l=>`${tr('app.layover.wait', { time: hoursText(l.minutes) })} · <span dir="ltr">${escapeHTML(l.city?`${l.city} (${l.airport})`:l.airport)}</span>${l.overnight?tr('app.layover.overnight'):''}${l.changeAirport?` · <strong>${tr('app.layover.changeAirport', { airport: escapeHTML(l.nextAirport) })}</strong>`:''}`;
const carrierLine=segment=>{const c=carrierOf(segment);return `${escapeHTML(c.name||tr('app.carrier.unknown'))}${c.number?` · ${tr('app.carrier.flight', { number: escapeHTML(c.number) })}`:''}${c.operator?` · ${tr('app.carrier.operatedBy', { operator: escapeHTML(c.operator) })}`:''}`;};
// "Not provided" must never read like a perk: only supplier-confirmed baggage gets the positive style.
const BAG={included:['yes',tr('app.bag.included')],paid:['no',tr('app.bag.paid')],none:['no',tr('app.bag.none')],mixed:['unknown',tr('app.bag.mixed')],unknown:['unknown',tr('app.bag.unknown')]};
const TROLLEY={included:['yes',tr('app.trolley.included')],paid:['no',tr('app.trolley.paid')],mixed:['unknown',tr('app.trolley.mixed')],unknown:['unknown',tr('app.trolley.unknown')]};
const bagPill=([kind,text])=>`<span class="bag bag-${kind}">${text}</span>`;
// Multi-city: this leg leaves another airport of the city the previous leg landed in (ORY → CDG).
function legAirportChange(f,i){const landed=f.legs[i-1]?.segments.at(-1)?.arrival,leaves=f.legs[i]?.segments[0]?.departure;if(!i||!landed?.airport?.code||!leaves?.airport?.code||landed.airport.code===leaves.airport.code||(landed.city?.code&&leaves.city?.code&&landed.city.code!==leaves.city.code))return '';return `${tr('app.leg.otherAirport', { from: escapeHTML(landed.airport.code), to: escapeHTML(leaves.airport.code) })}`;}
// Boarding-pass route row (spec: flight card UX). The route itself is an isolated LTR run, origin left and destination right,
// so times, codes and the path never flip on the RTL page; the text inside it keeps the page direction.
const icon=id=>`<svg aria-hidden="true"><use href="#${id}"/></svg>`;
const textDir=lang==='en'?'ltr':'rtl';
const shortDay=d=>{const at=new Date(d+'T12:00:00');return Number.isNaN(at.getTime())?d:new Intl.DateTimeFormat(locale(),{weekday:lang==='en'?'short':'narrow',day:'numeric',month:'numeric'}).format(at);};
const placeName=p=>{const known=placeByCode(p?.airport?.code),city=known?.city?placeByCode(known.city):known;return city?.name||p?.city?.name||'';};
const routeEnd=(p,cls,plus='',note='')=>`<span class="fc-end ${cls}"><b class="fc-time">${escapeHTML(p?.time||'—')}${plus}</b><span class="fc-code">${escapeHTML(p?.airport?.code||'')}</span>${(n=>n?`<span class="fc-place" dir="auto">${escapeHTML(n)}</span>`:'')(placeName(p))}${note}</span>`;
function legRoute(leg){
 const first=leg.segments[0],last=leg.segments.at(-1),s=leg.summary,via=s.layovers.map(l=>l.airport).filter(Boolean);
 // Landing on another day sits next to the landing time, with the date spelled out.
 const plus=s.dayOffset>0?`<sup class="fc-plus">+${s.dayOffset}</sup>`:'',note=s.dayOffset>0?`<span class="fc-arrdate" dir="${textDir}">${tr('app.leg.landsOn',{date:escapeHTML(shortDay(s.arriveDate))})}</span>`:'';
 return `<div class="fc-route" dir="ltr">${routeEnd(first.departure,'fc-from')}<span class="fc-path"><span class="fc-dur" dir="${textDir}">${Number.isFinite(leg.minutes)?hoursText(leg.minutes):tr('app.duration.unknown')}</span><span class="fc-line${s.stops?'':' is-direct'}" aria-hidden="true">${'<i></i>'.repeat(s.stops)}</span><span class="fc-stops${s.stops?'':' is-direct'}" dir="${textDir}">${stopsText(s.stops)}${via.length?` · <span dir="ltr">${via.map(escapeHTML).join(', ')}</span>`:''}</span></span>${routeEnd(last.arrival,'fc-to',plus,note)}</div>`;
}
function legRowsOf(f){
 const multi=searchContext?.multi;
 return f.legs.map((leg,i)=>{
  const name=escapeHTML(legName(i,multi));
  if(!leg.segments[0]||!leg.segments.at(-1))return `<div class="flight-leg"><div class="fc-leg-head"><span class="fc-dir">${name}</span></div>${tr('app.leg.noSegments')}</div>`;
  const s=leg.summary;
  // Facts that change the decision (a long or overnight wait, another airport) stay visible while the details are closed.
  const alerts=[...s.layovers.filter(l=>l.overnight||l.changeAirport||l.minutes>=LONG_LAYOVER_MINUTES).map(layoverText),i===1&&f.airportChange&&!multi?tr('app.leg.returnOtherAirport',{airports:escapeHTML(f.airports.join(' / '))}):'',multi?legAirportChange(f,i):''].filter(Boolean);
  return `<div class="flight-leg"><div class="fc-leg-head"><span class="fc-dir">${name}</span><small class="fc-date">${escapeHTML(longDate(s.departDate))}</small></div>${legRoute(leg)}${alerts.length?`<ul class="fc-alerts">${alerts.map(a=>`<li class="leg-warning">${icon('i-clock')}<span>${a}</span></li>`).join('')}</ul>`:''}</div>`;
 }).join('');
}
// One "flight details" disclosure per offer: segments, carriers, baggage per direction and fare inclusions.
function legDetailsOf(f,key){
 const id=`${key}:all`,multi=searchContext?.multi;
 const body=f.legs.map((leg,i)=>{
  if(!leg.segments[0])return '';const s=leg.summary;
  return `<div class="fc-seg-leg"><p class="fc-seg-title"><strong>${escapeHTML(legName(i,multi))}</strong> · ${escapeHTML(longDate(s.departDate))}</p>${leg.segments.map((segment,n)=>`${n?`<p class="layover">${layoverText(s.layovers[n-1])}</p>`:''}<p><strong dir="ltr">${point(segment.departure)} → ${point(segment.arrival)}</strong><br><span>${tr('app.leg.times', { dep: escapeHTML(longDate(segment.departure?.date)||tr('app.notGiven')), arr: escapeHTML(longDate(segment.arrival?.date)||tr('app.notGiven')) })}</span><br><span>${carrierLine(segment)}</span></p>`).join('')}<p class="leg-bags">${bagPill(BAG[leg.baggage.checked])}${leg.baggage.pieces>1?` <small>${tr('app.bag.pieces', { count: leg.baggage.pieces })}</small>`:''} ${bagPill(TROLLEY[leg.baggage.trolley])}${leg.baggage.fare?` <small>${tr('app.bag.fare', { fare: escapeHTML(leg.baggage.fare) })}${leg.baggage.cabin?' · '+escapeHTML(leg.baggage.cabin):''}</small>`:''}</p>${(list=>list.length?`<p class="fare-inclusions"><small>${tr('app.fare.includes')}</small> ${list.map(x=>bagPill([x.state==='included'?'yes':x.state==='no'?'no':'unknown',x.text])).join('')}</p>`:'')(fareInclusions(f.offer,leg))}</div>`;
 }).join('');
 return `<details class="flight-segments" data-detail="${escapeHTML(id)}" ${openDetails.has(id)?'open':''}><summary>${tr('app.card.details')}</summary>${body}<p class="micro-copy">${tr('app.leg.note')}</p></details>`;
}
function legMarkupOf(f,key){return legRowsOf(f)+legDetailsOf(f,key);}
function legMarkup(offer,payload){return legMarkupOf(offerFacts(offer,payload),'check-'+offer.index);}
// Spec 10 §7.1: per-person price by passenger type, only when it adds up to the total (and more than one person).
function paxLine(f){const list=perPassenger(f.offer,f.price);if(!list||(list.length===1&&list[0].count===1))return '';return `<small class="pax-prices">${list.map(x=>`${PTC_LABEL[x.ptc]} <span dir="ltr">${escapeHTML(formatFare({value:x.value,currency:x.currency}))}</span>`).join(' · ')}</small>`;}
// Baggage, carry-on and refund in one line: icon + words. "Not provided" is never styled as a perk.
const fact=([kind,text],id)=>`<li class="bag bag-${kind}">${icon(id)}<span>${text}</span></li>`;
const REFUND={no:['no',tr('app.refund.no')],yes:['yes',tr('app.refund.yes')],unknown:['unknown',tr('app.refund.unknown')]};
function flightCard(f,payload,scoredItem,badgeList=[],reasons=[]){
 const key=payload?.srk+':'+f.index;
 return `<article class="flight-card" data-offer-card="${escapeHTML(f.index)}" data-itinerary="${escapeHTML(scoredItem?.key||'')}"><div class="flight-details"><div class="fc-head"><h3>${escapeHTML(f.carriers.join(' + ')||tr('app.carrier.none'))}</h3>${badgeList.length?`<p class="flight-badges">${badgeList.map(b=>`<span class="flight-badge badge-${b}">${BADGE_LABELS[b]}</span>`).join('')}</p>`:''}</div>${reasons.length?`<p class="why">${tr('app.card.why', { reasons: reasons.map(escapeHTML).join(' · ') })}</p>`:''}${legRowsOf(f)}<ul class="bag-line" aria-label="${tr('app.card.facts')}">${fact(BAG[f.checked],'i-case')}${fact(TROLLEY[f.trolley],'i-case')}${fact(REFUND[f.refundable]||REFUND.unknown,'i-shield')}</ul>${legDetailsOf(f,f.index)}</div><div class="flight-price"><small>${searchContext.multi?tr('app.price.wholeRoute'):''}${tr('app.price.allTravelers',{count:searchContext.travelers})}</small><strong dir="ltr">${escapeHTML(formatFare(f.price))}</strong>${paxLine(f)}${originalHtml(f.price)}${(n=>n&&n<=FEW_SEATS?`<span class="seats-left">${n===1?tr('app.seats.one'):tr('app.seats.many',{count:n})}</span>`:'')(seatsLeft(f.offer))}<button class="yellow button" data-volero-offer="${escapeHTML(f.index)}"${tr('app.card.check')}${verifiedPrices.has(key)?verifiedStamp(verifiedPrices.get(key)):''}<label class="compare-check"><input type="checkbox" data-compare-offer="${escapeHTML(f.index)}" ${compareOffers.has(f.index)?'checked':''}>${tr('app.card.compare')}</div></article>`;
}
const filterLabels={stops:{'0':tr('app.stops.direct'),'1':tr('app.filter.upToOne')},bucket:Object.fromEntries(TIME_BUCKETS.map(([id,label,from,to])=>[id,`${label} (${String(from).padStart(2,'0')}–${String(to%24).padStart(2,'0')})`]))};
function activeChips(){
 const chips=[];
 if(flightFilters.stops!=='any')chips.push(['stops',flightFilters.stops,filterLabels.stops[flightFilters.stops]]);
 flightFilters.out.forEach(v=>chips.push(['out',v,tr('app.filter.outPrefix')+filterLabels.bucket[v]]));
 flightFilters.back.forEach(v=>chips.push(['back',v,tr('app.filter.backPrefix')+filterLabels.bucket[v]]));
 flightFilters.carriers.forEach(v=>chips.push(['carriers',v,v]));
 flightFilters.airports.forEach(v=>chips.push(['airports',v,tr('app.filter.airportPrefix')+v]));
 if(flightFilters.checkedBag)chips.push(['checkedBag','true',tr('app.bag.included')]);
 (flightFilters.avoid||[]).forEach(v=>chips.push(['avoid',v,tr('app.filter.avoidPrefix')+v]));
 return chips;
}
const chipMarkup=chips=>chips.map(([k,v,label])=>`<button type="button" class="filter-chip" data-remove-filter="${k}" data-value="${escapeHTML(v)}" aria-label="${tr('app.filter.remove', { label: escapeHTML(label) })}">${escapeHTML(label)} ✕</button>`).join('');
function filterPanel(all){
 // An option's count = results if that option alone were chosen in its group, everything else unchanged.
 const count=(group,patch)=>all.filter(f=>matchesFilters(f,{...flightFilters,...patch})).length;
 const toggle=(group,value,label,pressed,n)=>`<button type="button" class="filter-option" data-filter="${group}" data-value="${escapeHTML(value)}" aria-pressed="${pressed}" ${n||pressed?'':'disabled'}>${escapeHTML(label)} <small>${n}</small></button>`;
 const carriers=[...all.reduce((m,f)=>{f.carriers.forEach(c=>m.set(c,(m.get(c)||0)+1));return m;},new Map())].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([c])=>c);
 const buckets=group=>TIME_BUCKETS.map(([id])=>toggle(group,id,filterLabels.bucket[id],flightFilters[group].includes(id),count(group,{[group]:[id]}))).join('');
 const active=activeChips().length;
 return `<details class="flight-filters" id="flight-filters" ${filtersOpen?'open':''}><summary>${tr('app.filter.title')}${active?tr('app.filter.active',{count:active}):''}</summary><div class="filter-groups">
  <fieldset>${tr('app.filter.stops')}${[['any',tr('app.filter.any')],['0',tr('app.filter.directOnly')],['1',tr('app.filter.upToOne')]].map(([v,l])=>toggle('stops',v,l,flightFilters.stops===v,count('stops',{stops:v}))).join('')}</fieldset>
  <fieldset><legend>${searchContext?.multi?tr('app.filter.departFirst'):tr('app.filter.departOut')}</legend>${buckets('out')}</fieldset>
  ${all.some(f=>f.legs.length>1)?`<fieldset><legend>${searchContext?.multi?tr('app.filter.departLast'):tr('app.filter.departBack')}</legend>${buckets('back')}</fieldset>`:''}
  ${(airports=>airports.length>1?`<fieldset><legend>${searchContext?.multi?tr('app.filter.routeAirports'):tr('app.filter.destAirport')}</legend>${airports.map(code=>toggle('airports',code,code,flightFilters.airports.includes(code),count('airports',{airports:[code]}))).join('')}</fieldset>`:'')([...new Set(all.flatMap(f=>f.airports))].sort())}
  <fieldset>${tr('app.filter.airline')}${carriers.map(c=>toggle('carriers',c,c,flightFilters.carriers.includes(c),count('carriers',{carriers:[c]}))).join('')}</fieldset>
  ${(stops=>stops.length?`<fieldset>${tr('app.filter.avoid')}${stops.map(([code])=>toggle('avoid',code,code,(flightFilters.avoid||[]).includes(code),count('avoid',{avoid:[...(flightFilters.avoid||[]).filter(v=>v!==code),code]}))).join('')}<small class="micro-copy">${tr('app.filter.avoidHint')}</small></fieldset>`:'')(layoverAirports(all))}
  <fieldset>${tr('app.filter.baggage')}${toggle('checkedBag','true',tr('app.filter.bagIncluded'),flightFilters.checkedBag,count('checkedBag',{checkedBag:true}))}<small class="micro-copy">${tr('app.filter.bagHint')}</small></fieldset>
 </div></details>`;
}
function compareTray(){
 const n=compareOffers.size;if(!n)return '';
 return `<div class="flight-compare-tray" role="region" ${tr('app.compare.regionAttr')}><span>${tr('app.compare.tray', { count: n })}</span><div><button type="button" class="button yellow" data-open-compare ${n<2?'disabled':''}${tr('app.compare.open')}<button type="button" class="button secondary" data-clear-compare${tr('app.compare.clear')}</div></div>`;
}
function openFlightComparison(){
 const list=[...compareOffers.values()];if(list.length<2)return;
 const basis=new Map(list.map(f=>[f,priceBasis(f.price)])),currencies=new Set([...basis.values()].map(b=>b?.currency).filter(Boolean)),same=currencies.size===1;
 const cheapest=same?Math.min(...list.map(f=>basis.get(f)?.value??Infinity)):null;
 const shortest=Math.min(...list.map(f=>f.totalMinutes??Infinity));
 const leg=(f,i)=>{const l=f.legs[i];if(!l?.segments.length)return tr('app.notGiven');const s=l.summary;return `<span dir="ltr">${escapeHTML(l.segments[0].departure?.time||'')} → ${escapeHTML(l.segments.at(-1).arrival?.time||'')}</span>${s.dayOffset>0?` (+${s.dayOffset})`:''}<br><small>${escapeHTML(longDate(s.departDate))} · ${stopsText(s.stops)} · ${hoursText(l.minutes)}</small>`;};
 const row=(label,cell)=>`<tr><th scope="row">${label}</th>${list.map(f=>`<td>${cell(f)}</td>`).join('')}</tr>`;
 openModal(`<span class="dialog-kicker">${tr('app.compare.kicker', { count: searchContext.travelers })}</span>${tr('app.compare.title')}<div class="compare-table-wrap"><table class="flight-compare" style="--cols:${list.length}"><thead><tr><th scope="col">${tr('app.compare.topic')}</th>${list.map(f=>`<th scope="col">${escapeHTML(f.carriers.join(' + ')||tr('app.notGiven'))}</th>`).join('')}</tr></thead><tbody>
  ${row(tr('app.compare.total'),f=>(b=>`<strong dir="ltr" class="${same&&b?.value===cheapest?'best':''}">${escapeHTML(formatFare(f.price))}</strong>${originalHtml(f.price)}${same&&b&&b.value>cheapest?`<small dir="ltr" class="fare-diff">+${escapeHTML(formatFare({value:b.value-cheapest,currency:b.currency}))}</small>`:''}`)(basis.get(f)))}
  ${searchContext?.multi?Array.from({length:Math.max(...list.map(f=>f.legs.length))},(_,i)=>row(legName(i,true),f=>leg(f,i))).join(''):`${row(tr('app.leg.out'),f=>leg(f,0))}${list.some(f=>f.legs.length>1)?row(tr('app.leg.back'),f=>leg(f,1)):''}`}
  ${row(searchContext?.multi?tr('app.compare.timeAll'):list.some(f=>f.legs.length>1)?tr('app.compare.timeBoth'):tr('app.compare.time'),f=>`<span class="${f.totalMinutes===shortest?'best':''}">${hoursText(f.totalMinutes)}</span>`)}
  ${row(tr('app.compare.longest'),f=>f.longestLayover?hoursText(f.longestLayover)+(f.overnight?tr('app.layover.overnight'):''):tr('app.compare.none'))}
  ${row(tr('app.compare.bag'),f=>bagPill(BAG[f.checked]))}${row(tr('app.compare.trolley'),f=>bagPill(TROLLEY[f.trolley]))}
  ${row('',f=>`<button type="button" class="button secondary" data-goto-offer="${escapeHTML(f.index)}">${tr('app.compare.goto')}</button>`)}
 </tbody></table></div>${same?'':tr('app.compare.currencies')}${getFx()?`<p class="micro-copy">${tr('app.compare.fx', { note: escapeHTML(fxNote()) })}</p>`:''}<p class="micro-copy">${tr('app.compare.note')}</p>`);
}
function renderVoleroOffers(payload){
 state.voleroResults=payload;
 const all=factsOf(payload),host=$('#live-results');host.hidden=false;
 const focusKey=(el=>el&&host.contains(el)?el.dataset.filter?`[data-filter="${el.dataset.filter}"][data-value="${CSS.escape(el.dataset.value)}"]`:el.id?'#'+el.id:el.dataset.compareOffer?`[data-compare-offer="${CSS.escape(el.dataset.compareOffer)}"]`:null:null)(document.activeElement);
 const mixed=new Set(all.map(f=>priceBasis(f.price)?.currency).filter(Boolean)).size>1;
 const filtered=all.filter(f=>matchesFilters(f,flightFilters)),chips=activeChips();
 const scored=scoreOffers(filtered,decisionBrief(),{boosts:decision.boosts,partnerPick:decision.pick,learned:decision.learned}),ranked=rankScored(scored),byFacts=new Map(scored.map(x=>[x.facts,x])),tags=badges(scored);
 // Recommended order: the top three are diversified (MMR) so they are not three versions of one flight.
 const leaders=diverseTop(ranked,3);
 const order=flightSort==='recommended'?[...leaders,...ranked.filter(x=>!leaders.includes(x))]:sortFacts(filtered,flightSort).map(f=>byFacts.get(f));decision.order=order;
 const visible=order.map(x=>x.facts);
 const why=new Map(leaders.map(x=>[x.facts,explain(x,scored,value=>formatFare({value,currency:x.facts.price?.currency||'USD'})).concat(x.partner&&decision.reason?[decision.reason]:[]).filter((r,i,a)=>a.indexOf(r)===i).slice(0,3)]));
 host.innerHTML=`<div class="live-heading"><div><span class="eyebrow">${tr('app.live.eyebrow')}</span><h2 tabindex="-1">${escapeHTML(searchContext?.destination||tr('app.live.title'))}</h2><p>${escapeHTML(searchContext?.dates||'')} · ${tr('app.live.travelers', { count: searchContext?.travelers||2 })} · ${searchContext?.multi?tr('app.live.multi', { count: searchContext.search.legs.length }):searchContext?.oneWay?tr('app.live.oneWay'):tr('app.live.round')}</p>${searchContext?.multi?groundGaps(searchContext.search.legs).map(g=>`<p class="micro-copy leg-gap">${escapeHTML(gapText(g))}</p>`).join(''):''}${(place=>place?.airports?`<p class="micro-copy">${tr('app.live.allAirports', { city: escapeHTML(lang==='en'?place.name:place.names[0]), airports: place.airports.join(', ') })}</p>`:'')(places.find(p=>p.code===searchContext?.destinationCode))}</div><div class="live-actions"><button type="button" class="button secondary" id="edit-flight-search">${tr('app.live.editShare')}</button></div><label>${tr('app.sort.label')}<select id="flight-sort"><option value="recommended" ${flightSort==='recommended'?'selected':''}>${tr('app.sort.recommended')}</option><option value="supplier" ${flightSort==='supplier'?'selected':''}${tr('app.sort.supplier')}/option><option value="price" ${mixed?'disabled':''} ${flightSort==='price'?'selected':''}>${tr('app.sort.price')}</option><option value="duration" ${flightSort==='duration'?'selected':''}>${tr('app.sort.duration', { scope: searchContext?.multi?tr('app.sort.allFlights'):tr('app.sort.bothWays') })}</option></select></label></div>
 ${all.length?filterPanel(all):''}
 ${chips.length?`<div class="filter-chips">${chipMarkup(chips)}<button type="button" class="link-button" data-clear-filters>${tr('app.filter.reset')}</button></div>`:''}
 <p class="micro-copy" role="status">${chips.length?tr('app.live.countOf', { shown: visible.length, total: all.length }):tr('app.live.count', { count: all.length })}${tr('app.live.showing', { shown: Math.min(visible.length,visibleOfferCount), currency: getFx()?tr('app.live.inShekels'):tr('app.live.inSupplierCurrency') })}${mixed?tr('app.live.mixed'):''}</p><p class="fx-line micro-copy">${getFx()?escapeHTML(fxNote())+'. ':''}<button type="button" class="link-button" data-open-converter>${tr('app.fx.converter')}</button></p>
 ${flightSort==='recommended'&&leaders.length>1?flightTakeSlot():''}<div class="flight-list">${visible.length?visible.slice(0,visibleOfferCount).map(f=>flightCard(f,payload,byFacts.get(f),tags.get(byFacts.get(f)?.key)||[],why.get(f)||[])).join(''):all.length?`<div class="empty-panel">${tr('app.empty.filters')}<div class="filter-chips">${chipMarkup(chips)}</div></div>`:searchContext?.multi?tr('app.empty.multi'):tr('app.empty.flights')}</div>
 ${visible.length>visibleOfferCount?tr('app.live.more'):''}${compareTray()}`;
 if(focusKey)host.querySelector(focusKey)?.focus();
 markStaleResults();
 if(flightSort==='recommended'&&leaders.length>1)mountFlightTake(host,leaders.map(x=>x.facts),{formatPrice:formatFare,brief:{adults:state.adults,children:state.children,route:searchContext?.destination||'',prefs:chips.map(c=>c[2])}});
 if(flightSort==='recommended'&&needsTieBreak(ranked))askTieBreak(payload,ranked);
}
const liveHost=$('#live-results');
// Shekel rates load in the background (dist/fx.mjs); results already on screen switch to ₪ when they arrive.
loadFx();onFx(()=>{if(state.voleroResults&&!liveHost.hidden)renderVoleroOffers(state.voleroResults);});
liveHost.addEventListener('toggle',e=>{const d=e.target;if(d.id==='flight-filters')filtersOpen=d.open;else if(d.dataset?.detail){if(d.open){openDetails.add(d.dataset.detail);aiEvent('open',d.closest('[data-itinerary]')?.dataset.itinerary);}else openDetails.delete(d.dataset.detail);}},true);
liveHost.addEventListener('change',e=>{
 const payload=state.voleroResults;if(!payload)return;
 if(e.target.id==='flight-sort'){flightSort=e.target.value;renderVoleroOffers(payload);}
 const id=e.target.dataset.compareOffer;
 if(id){if(!e.target.checked)compareOffers.delete(id);else if(compareOffers.size>=3){e.target.checked=false;toast(tr('app.compare.max'));return;}else{compareOffers.set(id,factsOf(payload).find(f=>f.index===id));aiEvent('compare',e.target.closest('[data-itinerary]')?.dataset.itinerary);}renderVoleroOffers(payload);}
});
liveHost.addEventListener('click',e=>{
 const payload=state.voleroResults;if(!payload)return;
 if(e.target.closest('[data-open-converter]')){openModal(`<span class="dialog-kicker">${tr('app.fx.kicker')}</span><h2>${tr('app.fx.converter')}</h2>${converterHtml({id:'fx-modal'})}`);wireConverter($('#modal-content [data-fx-converter]'));return;}
 const filter=e.target.closest('[data-filter]'),remove=e.target.closest('[data-remove-filter]');
 if(filter||remove){
  const {filter:group=remove.dataset.removeFilter,value}=(filter||remove).dataset,on=Boolean(filter)&&filter.getAttribute('aria-pressed')!=='true';
  if(group==='stops')flightFilters.stops=on?value:'any';
  else if(group==='checkedBag')flightFilters.checkedBag=on;
  else flightFilters[group]=on?[...flightFilters[group],value]:flightFilters[group].filter(v=>v!==value);
  visibleOfferCount=12;renderVoleroOffers(payload);if(remove)$('#flight-filters summary')?.focus();return;
 }
 if(e.target.closest('[data-clear-filters]')){flightFilters=emptyFilters();visibleOfferCount=12;renderVoleroOffers(payload);$('#flight-filters summary')?.focus();return;}
 if(e.target.closest('#more-flights')){const firstNew=visibleOfferCount;visibleOfferCount+=12;renderVoleroOffers(payload);liveHost.querySelectorAll('[data-volero-offer]')[firstNew]?.focus();return;}
 if(e.target.closest('#share-flight-search')){shareSearch();return;}
 if(e.target.closest('#edit-flight-search')||(isMulti()&&e.target.closest('[data-edit-search]'))){$('#search-form').scrollIntoView({block:'center'});(isMulti()?$('#multi-legs [data-part="from"]'):$('#destination')).focus();return;}
 if(e.target.closest('[data-edit-search]')){$('#dates-button').click();return;}
 if(e.target.closest('[data-open-compare]')){openFlightComparison();return;}
 if(e.target.closest('[data-clear-compare]')){compareOffers.clear();renderVoleroOffers(payload);return;}
});
$('#modal-content').addEventListener('click',e=>{
 const go=e.target.closest('[data-goto-offer]');if(!go)return;
 modal.close();const card=document.querySelector(`[data-offer-card="${CSS.escape(go.dataset.gotoOffer)}"]`);
 if(card){card.scrollIntoView({block:'center'});card.querySelector('[data-volero-offer]').focus();}else toast(tr('app.compare.hidden'));
});
// The same context shape as a round trip, so every later step (cards, saving, sharing, memory) reads it alike.
function multiContext(request){
 const legs=request.originDestinations.map(l=>({from:l.origin.code,to:l.destination.code,date:l.date})),route=routeText(legs);
 return {params:searchParams(),destination:route,destinationCode:legs[0].to,dates:`${longDate(legs[0].date)} – ${longDate(legs.at(-1).date)}`,travelers:state.adults+state.children,oneWay:false,multi:true,
  search:{type:'multi',legs,origin:legs[0].from,destination:route,start:legs[0].date,end:'',adults:state.adults,children:state.children}};
}
$('#search-form').onsubmit=async e=>{
 e.preventDefault();if(state.tab!=='flights'){pages.search($('#destination').value.trim(),state.tab);return;}
 if(activeSearch)return;
 const feedback=$('#search-feedback'),button=$('.search-submit');
 let request;try{request=voleroSearchRequest();}catch(error){feedback.textContent=error.message;feedback.hidden=false;const field=error.field&&$(error.field);if(field){field.setAttribute('aria-describedby','search-feedback');field.focus();}return;}
 const context=isMulti()?multiContext(request):{params:searchParams(),destination:$('#destination').value.trim(),destinationCode:request.originDestinations[0].destination.code,
  dates:oneWay()?longDate(state.start):`${longDate(state.start)} – ${longDate(state.end)}`,travelers:state.adults+state.children,oneWay:oneWay(),
  search:{origin:request.originDestinations[0].origin.code,destination:$('#destination').value.trim(),start:state.start,end:oneWay()?'':state.end,type:oneWay()?'oneway':'round',adults:state.adults,children:state.children}};
 const controller=new AbortController();activeSearch=controller;let cancelled=false;
 const timer=setTimeout(()=>controller.abort(),45000);
 button.disabled=true;button.setAttribute('aria-busy','true');button.textContent=tr('app.search.busy');
 feedback.innerHTML=tr('app.search.progress');feedback.hidden=false;const started=Date.now(),ticker=setInterval(()=>{const seconds=Math.round((Date.now()-started)/1000),line=$('#search-progress');if(line)line.textContent=tr('app.search.ticker', { seconds, slow: seconds>15?tr('app.search.slow'):'' });},1000);const cancel=document.createElement('button');cancel.type='button';cancel.className='button secondary';cancel.id='cancel-flight-search';cancel.textContent=tr('app.search.cancel');cancel.onclick=()=>{cancelled=true;controller.abort();};feedback.append(' ',cancel);const stopDyk=startDidYouKnow(feedback,request.originDestinations[0].destination.code);
 $('#live-results').hidden=true;state.voleroResults=null;
 try{
  const response=await fetch('/api/volero/flights/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request),signal:controller.signal});
  const data=await response.json();if(!response.ok)throw new Error((response.status===429||response.status===400)&&data.message?errorText(data.error,data.message,'app'):tr('app.err.searchFailed'));
  context.cachedAt=data.cached?data.searchedAt:null;
  searchContext=context;flightSort='recommended';visibleOfferCount=12;flightFilters=emptyFilters();openDetails.clear();compareOffers.clear();decision.boosts={};decision.pick=null;decision.reason='';decision.order=[];
  const fromRequest=pendingFilters;pendingFilters=null;
  if(fromRequest){const names=[...new Set(factsOf(data.data).flatMap(f=>f.carriers))];flightFilters={...emptyFilters(),stops:fromRequest.stops||'any',out:fromRequest.out||[],back:fromRequest.back||[],checkedBag:fromRequest.checkedBag===true,carriers:fromRequest.carrier?names.filter(name=>name.toLowerCase().includes(fromRequest.carrier)):[]};}
  renderVoleroOffers(data.data);saveLastSearch();loadBoosts(data.data);aiEvent('impression',[...document.querySelectorAll('#live-results [data-itinerary]')].slice(0,6).map(c=>c.dataset.itinerary));history.replaceState(null,'',searchLink(context.search));
  feedback.textContent=(context.cachedAt?tr('app.search.cached', { minutes: Math.max(1,Math.round((Date.now()-Date.parse(context.cachedAt))/60000)) }):'')+(fromRequest&&activeChips().length?tr('app.search.doneFilters'):tr('app.search.done'));
  if(onHome()){$('#live-results h2').focus({preventScroll:true});$('#live-results').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
 }catch(error){pendingFilters=null;feedback.textContent=error.name==='AbortError'?cancelled?tr('app.search.cancelled'):tr('app.search.timeout'):error.message;}
 finally{clearTimeout(timer);clearInterval(ticker);stopDyk();if(cancelled)button.focus();activeSearch=null;button.disabled=false;button.removeAttribute('aria-busy');button.innerHTML=icons('search')+tr('app.tab.flights.submit');}
};
$('#all-deals').onclick=()=>pages.navigate('/destinations');
document.addEventListener('click',async e=>{
 const favorite=e.target.closest('[data-favorite]');if(favorite){const id=favorite.dataset.favorite;favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];favorite.setAttribute('aria-pressed',String(favorites.includes(id)));favorite.setAttribute('aria-label',(n=>favorites.includes(id)?tr('app.card.unsave',{name:n}):tr('app.card.save',{name:n}))(L(byId(id)?.name)||id));try{localStorage.setItem('gerbi-favorites',JSON.stringify(favorites));toast(favorites.includes(id)?tr('app.fav.saved'):tr('app.fav.removed'));}catch{toast(tr('app.fav.session'));}}
 const trip=e.target.closest('[data-trip]');if(trip)openTrip(trip.dataset.trip);
 const offerButton=e.target.closest('[data-volero-offer]');if(offerButton){
  const result=state.voleroResults,offerIndex=offerButton.dataset.voleroOffer,offerContext=searchContext;
  const currentOffer=()=>state.voleroResults===result&&onHome()&&offerButton.isConnected;
  const selected=result?.offers?.find(item=>String(item.index)===offerIndex);
  if(!selected||!result.srk||!result.tokens?.searchResults||$('#live-results').classList.contains('stale')){toast(tr('app.offer.stale'));return;}
  offerButton.disabled=true;offerButton.textContent=tr('app.offer.checking');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
  try{
   const response=await fetch('/api/volero/flights/availability',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({srk:result.srk,offerIndex,searchToken:result.tokens.searchResults,input:{itineraryIndex:selected.flightsOverview?.[0]?.itineraryIndex??0}})});
   const data=await response.json();if(!response.ok)throw new Error(tr('app.offer.unverified'));
   const booking=await bookingConfig();
   if(!currentOffer())return;
   const priced=data.data?.pricedOffer,price=offerPrice(priced),old=offerPrice(selected);
   if(!price)throw new Error(tr('app.offer.noPrice'));
   const changed=old && (old.value!==price.value || old.currency!==price.currency);
   const verified={price,at:new Date(),changed};aiEvent('verify',offerButton.closest('[data-itinerary]')?.dataset.itinerary);verifiedPrices.set(result.srk+':'+offerIndex,verified);
   const priceBox=offerButton.closest('.flight-price');priceBox.querySelector('.verified-stamp')?.remove();priceBox.insertAdjacentHTML('beforeend',verifiedStamp(verified));
   openModal(`<span class="dialog-kicker">${tr('app.offer.kicker')}</span><h2>${changed?tr('app.offer.changed'):tr('app.offer.checked')}</h2><p>${escapeHTML(offerContext.destination)} · ${escapeHTML(offerContext.dates)}</p><p class="micro-copy">${tr('app.offer.checkedNow', { time: escapeHTML(new Date().toLocaleString(locale())) })}</p><div class="verified-price"><small>${tr('app.offer.priceFor', { count: offerContext.travelers })}</small><strong dir="ltr">${escapeHTML(formatFare(price))}</strong>${originalHtml(price)}${changed?`<span>${tr('app.offer.was', { price: escapeHTML(formatFare(old)) })}</span>`:''}</div>${legMarkup(priced,data.data)}<p class="notice">${tr('app.offer.notice')}</p><div class="dialog-actions">${booking.enabled?`<button class="button yellow" data-book-flight>${tr('booking.offer.book')}</button>`:''}<button class="button ${booking.enabled?'secondary':'yellow'}" data-save-flight>${tr('app.offer.save')}</button><button class="button secondary" data-close-availability>${tr('app.offer.backToCompare')}</button></div><p class="micro-copy" id="save-flight-status" role="status">${tr('app.offer.saveNote')}</p>`);
   $('[data-close-availability]').onclick=()=>modal.close();
   // Spec 25: book this exact offer (the server re-prices it; nothing is charged before the summary step).
   const bookButton=$('[data-book-flight]');if(bookButton)bookButton.onclick=async()=>{bookButton.disabled=true;bookButton.setAttribute('aria-busy','true');try{await startBooking({offer:{srk:result.srk,offerIndex,searchToken:result.tokens.searchResults,itineraryIndex:selected.flightsOverview?.[0]?.itineraryIndex??0},source:offerContext.multi?'multi':'flights'});modal.close();}catch(error){bookButton.disabled=false;bookButton.removeAttribute('aria-busy');$('#save-flight-status').textContent=tr(error.code==='offer_unavailable'?'booking.offer.gone':error.status===429?'booking.offer.busy':'booking.offer.failed');}};
   $('[data-save-flight]').onclick=e=>{const facts=factsOf(result).find(f=>f.index===offerIndex);if(!facts)return;if(storeSavedFlights(addSavedFlight(savedFlights,flightSnapshot(facts,offerContext.search,verified)))){aiEvent('save',itineraryKey(facts));e.currentTarget.disabled=true;e.currentTarget.textContent=tr('app.offer.saved');$('#save-flight-status').innerHTML=tr('app.offer.savedNote');}};
  }catch(error){if(!currentOffer())return;openModal(`<span class="dialog-kicker">${tr('app.offer.failKicker')}</span>${tr('app.offer.failTitle')}<p>${escapeHTML(error.name==='AbortError'?tr('app.offer.timeout'):error.message)}</p><button class="button secondary full-width" data-close-availability>${tr('app.offer.backToResults')}</button>`);$('[data-close-availability]').onclick=()=>modal.close();}
  finally{clearTimeout(timer);offerButton.disabled=false;offerButton.textContent=tr('app.offer.checkButton');markStaleResults();}
 }
 const info=e.target.closest('[data-info]');if(info)showInfo(info.dataset.info);
});
function openTrip(id){pages.navigate('/trip/'+id);}
function openChat(prompt=''){pages.openPlanner(prompt);}
function getMissing(){return [];}
function showInfo(type){pages.navigate(({recommendations:'/inspiration',support:'/support',account:'/account',blog:'/blog',accessibility:'/accessibility'})[type]||'/support');}
$('#prompt-form').onsubmit=e=>{e.preventDefault();openChat($('#trip-prompt').value);};
// Spec 24: the hero's one-sentence prompt opens the magic trip builder with the text.
$('#magic-form').onsubmit=e=>{e.preventDefault();const text=$('#magic-text').value.trim();pages.navigate('/build'+(text?'?q='+encodeURIComponent(text):''));};
async function shareSearch(){
 const url=location.origin+location.pathname+searchLink(searchContext.search);
 try{if(navigator.share){await navigator.share({title:tr('app.share.title'),text:`${searchContext.destination} · ${searchContext.dates}`,url});return;}await navigator.clipboard.writeText(url);toast(tr('app.share.copied'));}
 catch(error){if(error?.name!=='AbortError')toast(tr('app.share.failed'));}
}
// A shared link fills the form; the search runs only when the visitor asks, so links never trigger supplier calls.
function restoreSharedSearch(){
 const shared=parseSearchLink(location.hash);if(!shared)return false;
 if(shared.type==='multi'){setTripType('multi');multiCity.setLegs(shared.legs);state.adults=shared.adults;state.children=shared.children;$('#travelers-value').textContent=travelersText(state.adults,state.children);$('#search-feedback').textContent=tr('app.shared.multi');$('#search-feedback').hidden=false;return true;}
 setTripType(shared.type);const from=resolvePlace(shared.origin);if(from)$('#origin').value=placeText(from);
 $('#destination').value=placeText(resolvePlace(shared.destination))||shared.destination;state.start=shared.start;state.end=shared.end;state.adults=shared.adults;state.children=shared.children;
 $('#search-feedback').textContent=tr('app.shared.search');$('#search-feedback').hidden=false;
 return true;
}
const sharedSearch=restoreSharedSearch();if(!sharedSearch)restoreLastSearch();
function applyDestinationLink(){const m=/^#\/\?to=([A-Z]{3})$/.exec(location.hash);const place=m&&placeByCode(m[1]);if(!place)return false;selectTab('flights');if(document.querySelector('[name=trip-type]:checked')?.value==='multi')setTripType('round');$('#destination').value=placeText(place);history.replaceState(null,'','#/');document.dispatchEvent(new Event('brief-changed'));requestAnimationFrame(()=>{$('.search-panel')?.scrollIntoView({block:'center'});$('#dates-button').focus({preventScroll:true});});return true;}
applyDestinationLink();window.addEventListener('hashchange',applyDestinationLink);
{const home=resolvePlace($('#origin').value);if(home?.names)$('#origin').value=placeText(home);}
// Cheapest fares from the server's long cache; a click runs that search live with the traveler's own passengers.
initDealsStrip({after:$('.search-panel'),today:()=>localDate(),onPick(deal){
 if(activeSearch||!deal)return;selectTab('flights');setTripType('round');
 $('#origin').value=placeText(placeByCode('TLV'));$('#destination').value=placeText(placeByCode(deal.destination))||deal.destination;
 state.start=deal.depart;state.end=deal.back;showDates();document.dispatchEvent(new Event('brief-changed'));$('#search-form').requestSubmit();}});
if(!contactActions(contact,'x').length)document.querySelectorAll('.support, nav a[href="#/support"]').forEach(el=>{const icon=el.querySelector('svg');el.textContent=tr('app.help');if(icon)el.prepend(icon);});
window.addEventListener('hashchange',()=>{if(!activeSearch&&restoreSharedSearch())document.dispatchEvent(new Event('brief-changed'));});
// Owner-edited texts and contact details (spec 18): cached copy now, fresh copy when /api/content/site answers.
initSiteContent({contact,rerender:()=>pages.navigate(location.hash.slice(1)||'/')});
const pages=initPages({routes:{...leadRoutes({contact}),...converterRoutes(),...cmsRoutes(),...legalRoutes(),...buildRoutes(),...bookingRoutes()},state,trips,money,icons,escapeHTML,toast,openModal,openDates,renderCards,selectFlights:()=>selectTab('flights'),
 getFavorites:()=>favorites,
 getSavedFlights:()=>savedFlights,
 removeSavedFlight(id){return storeSavedFlights(savedFlights.filter(item=>item.id!==id));},
 flightFollowUp:flight=>({text:followUpText(flight,fareText),actions:contactActions(contact,followUpText(flight,fareText),tr('app.followUp.subject'))}),
 formatFare,fareOriginal:originalHtml,longDate,searchLinkOf:flight=>flight.route?multiLink({legs:flight.route,adults:flight.adults,children:flight.children}):searchLink({origin:flight.from,destination:flight.to,start:flight.start,end:flight.end,type:flight.end?'round':'oneway',adults:flight.adults,children:flight.children}),
 contactActions:message=>contactActions(contact,message),
 partnerAvailable:()=>partnerAvailable,
 today:()=>localDate(),
 placeLabel:code=>(p=>lang==='en'?p?.name:p?.names[0])(places.find(p=>p.code===code))||code,
 // A search the planner understood: same form, same supplier call, preferences arrive as removable filters.
 runFlightSearch(fs){
  setTripType(fs.type);$('#origin').value=placeText(resolvePlace(fs.origin))||fs.origin;$('#destination').value=placeText(resolvePlace(fs.destination))||fs.destination;
  state.start=fs.start;state.end=fs.end;state.adults=fs.adults;state.children=fs.children;pendingFilters=fs.filters;
  window.addEventListener('hashchange',()=>{selectTab('flights');document.dispatchEvent(new Event('brief-changed'));$('#search-form').requestSubmit();},{once:true});
  pages.navigate('/');
 },
 toggleFavorite(id){let persisted=true;favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];try{localStorage.setItem('gerbi-favorites',JSON.stringify(favorites));}catch{persisted=false;}renderCards();return persisted;},
 openTravelers:()=>$('#travelers-button').onclick(),
 currentPreferences,
 syncHome(){ saveStyles();$('#travelers-value').textContent=travelersText(state.adults,state.children);showDates(); markStaleResults(); }
});
// initPages restores the planner's saved passengers; a shared link opened on a fresh page load must win over them.
if(sharedSearch){restoreSharedSearch();$('#travelers-value').textContent=travelersText(state.adults,state.children);}
installResultsCta();
function refreshPersonalization(){
 document.querySelectorAll('[data-preference]').forEach(b=>b.setAttribute('aria-pressed',String(state.preferences[b.dataset.preference]===true)));
 const selected=styles.filter(style=>state.preferences[style.id]===true);
 renderCards();
 $('#preference-status').textContent=selected.length?tr('app.prefs.sorted', { styles: selected.map(x=>x.label).join(' · ') }):tr('app.prefs.hint');
}
$('.preference-chips').innerHTML=styles.map(style=>`<button type="button" data-preference="${style.id}" aria-pressed="false">${icons(style.icon)}${style.label}</button>`).join('');
function saveStyles(){
 try{localStorage.setItem('gerbi-preferences',JSON.stringify(Object.fromEntries(styles.map(style=>[style.id,state.preferences[style.id]===true]))));}catch{toast(tr('app.prefs.session'));}
 refreshPersonalization();
}
document.querySelectorAll('[data-preference]').forEach(button=>button.onclick=()=>{const key=button.dataset.preference;state.preferences[key]=!state.preferences[key];saveStyles();});
$('#reset-styles').onclick=()=>{styles.forEach(style=>state.preferences[style.id]=false);saveStyles();};
document.querySelectorAll('[data-starter]').forEach(button=>button.onclick=()=>openChat(button.dataset.starter));
window.addEventListener('hashchange',()=>{if(onHome())refreshPersonalization();});
refreshPersonalization();
if(document.modelContext?.registerTool){
 const controller=new AbortController();
 try{Promise.resolve(document.modelContext.registerTool({name:'start_trip_planning',title:tr('app.webmcp.title'),description:'Open the local demo trip planner with a Hebrew request. Does not search live inventory or book anything.',inputSchema:{type:'object',properties:{request:{type:'string',minLength:1,maxLength:1500}},required:['request'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input.request!=='string'||!input.request.trim()||input.request.length>1500)throw new Error('A non-empty request of at most 1500 characters is required');openChat(input.request);return{mode:'demo',opened:true,missing:getMissing(state.preferences),liveAvailability:false};}},{signal:controller.signal})).catch(error=>console.warn('Optional browser planner registration unavailable:',error.message));}catch(error){console.warn('Optional browser planner registration unavailable:',error.message);}
 window.addEventListener('pagehide',()=>controller.abort(),{once:true});
}
// Focus ring only for keyboard users: a mouse/touch press hides it, Tab brings it back (styles in experience.css).
document.addEventListener('pointerdown',()=>document.documentElement.classList.add('pointer-nav'),true);document.addEventListener('keydown',e=>{if(e.key==='Tab')document.documentElement.classList.remove('pointer-nav');},true);
