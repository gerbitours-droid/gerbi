import { styles, rankInspirations } from './personalization.mjs';
import { offerPrice, formatFare, carrierOf, hoursText, LONG_LAYOVER_MINUTES, offerFacts, emptyFilters, matchesFilters, sortFacts, TIME_BUCKETS } from './flight-view.mjs';
import { parsePreferences, rankDemoTrips, estimateDemoTotal, validFlightDates } from './planner.mjs';
import { trips, contact } from './data.mjs';
import { places, resolvePlace, placeSuggestions, placeType } from './places.mjs';
import { SAVED_FLIGHTS_KEY, flightSnapshot, restoreSavedFlights, addSavedFlight, searchLink, parseSearchLink, followUpText, contactActions } from './saved-flights.mjs';
import { initPages } from './pages.mjs';
const icons=name=>`<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const money=n=>new Intl.NumberFormat('he-IL',{style:'currency',currency:'ILS',maximumFractionDigits:0}).format(n);
const $=s=>document.querySelector(s);
let favorites=[];try{favorites=JSON.parse(localStorage.getItem('gerbi-favorites')||'[]');if(!Array.isArray(favorites))favorites=[];favorites=[...new Set(favorites.filter(id=>trips.some(t=>t.id===id)))];}catch{}
function renderCards(items=trips){$('#cards').innerHTML=items.map(t=>`<article class="card"><div class="card-image"><img src="/assets/${t.image}" alt="${t.name}" loading="lazy" width="560" height="400"><button class="favorite" data-favorite="${t.id}" aria-pressed="${favorites.includes(t.id)}" aria-label="${favorites.includes(t.id)?'הסרת':'שמירת'} ${t.short}">${icons('heart')}</button><span class="card-badge">${icons(t.id==='rome'?'hotel':t.id==='dubai'?'globe':'sun')}${t.badge}</span></div><div class="card-body"><h3>${t.name}</h3><p class="card-description">${t.description}</p>${t.matchReason?`<p class="match-reason">${escapeHTML(t.matchReason)}</p>`:''}<div class="card-bottom"><button class="yellow card-cta" data-trip="${t.id}">לפרטים ותכנון</button><div class="card-price"><small>הדגמה · לאדם, החל מ־</small><strong>${money(t.price)}</strong></div></div></div></article>`).join('');}
renderCards();
for(const image of document.querySelectorAll('img[src="/assets/mascot.png"]')){image.onload=()=>image.hidden=false;if(image.complete&&image.naturalWidth)image.hidden=false;}
const state={tab:'flights',adults:2,children:0,start:'',end:'',preferences:{},activeTrip:null,edits:{},requests:{},voleroResults:null};
try {
 const saved=JSON.parse(localStorage.getItem('gerbi-preferences')||'{}');
 for(const style of styles) if(typeof saved?.[style.id]==='boolean')state.preferences[style.id]=saved[style.id];
} catch {}
document.querySelector('#destinations').innerHTML=places.map(place=>`<option value="${place.label}">`).join('');
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
function shortDate(value){return new Date(value+'T12:00:00').toLocaleDateString('he-IL',{day:'numeric',month:'short'});}
const oneWay=()=>document.querySelector('[name="trip-type"]:checked')?.value==='oneway';
const setTripType=type=>{const input=document.querySelector(`[name="trip-type"][value="${type==='oneway'?'oneway':'round'}"]`);if(input)input.checked=true;};
const originPlace=()=>resolvePlace($('#origin').value);
function showDates(){const has=oneWay()?Boolean(state.start):Boolean(state.start&&state.end);$('#dates-value').textContent=has?(oneWay()?shortDate(state.start):`${shortDate(state.start)} – ${shortDate(state.end)}`):'בחרו תאריכים';$('#dates-value').classList.toggle('muted',!has);}
function longDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(value||'')?new Date(value+'T12:00:00').toLocaleDateString('he-IL',{weekday:'short',day:'numeric',month:'numeric',year:'numeric'}):'';}
function openDates(){
 const single=oneWay();
 openModal(`<span class="dialog-kicker">בוחרים מתי לצאת לחופש</span><h2>מתי בא לכם לטוס?</h2><p>${single?'בחרו תאריך יציאה. זו טיסה בכיוון אחד.':'בחרו תאריך יציאה וחזרה. אפשר לחזור גם באותו יום.'}</p><form id="date-form"><div class="form-grid"><label class="modal-field">תאריך יציאה<input id="start-date" type="date" min="${localDate()}" value="${state.start}" required></label>${single?'':`<label class="modal-field">תאריך חזרה<input id="end-date" type="date" min="${state.start||localDate()}" value="${state.end}" required></label>`}</div><p id="date-error" class="inline-error" hidden></p><button class="yellow dialog-primary">אישור תאריכים</button></form>`);
 $('#start-date').onchange=()=>{if($('#end-date'))$('#end-date').min=$('#start-date').value;};
 $('#date-form').onsubmit=e=>{e.preventDefault();const start=$('#start-date').value,end=single?state.end:$('#end-date').value;
  if(!validFlightDates(start,end,localDate(),single)){$('#date-error').textContent=single?'תאריך היציאה לא יכול להיות בעבר.':'תאריך החזרה לא יכול להיות לפני היציאה, ותאריך היציאה לא יכול להיות בעבר.';$('#date-error').hidden=false;return;}
  state.start=start;state.end=single&&end<start?'':end;
  // The planner counts nights; a same-day or one-way flight leaves its night count untouched.
  if(!single&&end>start)state.preferences.nights=Math.round((new Date(end)-new Date(start))/86400000);
  showDates();modal.close();document.dispatchEvent(new Event('brief-changed'));};
}
$('#dates-button').onclick=openDates;
$('#travelers-button').onclick=()=>{
 let adults=state.adults,children=state.children;
 openModal(`<span class="dialog-kicker">יש מקום לכולם</span><h2>מי יוצא לחופשה?</h2><div class="counter"><span><strong>מבוגרים</strong><small>מגיל 18 ומעלה</small></span><div class="counter-controls"><button aria-label="הוספת מבוגר" data-counter="adult-plus">+</button><strong id="adult-count">${adults}</strong><button aria-label="הסרת מבוגר" data-counter="adult-minus">−</button></div></div><div class="counter"><span><strong>ילדים</strong><small>גילאים מדויקים יידרשו לתמחור אמיתי</small></span><div class="counter-controls"><button aria-label="הוספת ילד" data-counter="child-plus">+</button><strong id="child-count">${children}</strong><button aria-label="הסרת ילד" data-counter="child-minus">−</button></div></div><button id="save-travelers" class="yellow dialog-primary">אישור הרכב הנוסעים</button>`);
 const update=()=>{$('#adult-count').textContent=adults;$('#child-count').textContent=children;$('[data-counter="adult-minus"]').disabled=adults<=1;$('[data-counter="adult-plus"]').disabled=adults+children>=9;$('[data-counter="child-minus"]').disabled=children<=0;$('[data-counter="child-plus"]').disabled=adults+children>=9;};
 document.querySelectorAll('[data-counter]').forEach(b=>b.onclick=()=>{if(b.dataset.counter==='adult-plus')adults++;if(b.dataset.counter==='adult-minus')adults--;if(b.dataset.counter==='child-plus')children++;if(b.dataset.counter==='child-minus')children--;update();});update();
 $('#save-travelers').onclick=()=>{state.adults=adults;state.children=children;$('#travelers-value').textContent=`${adults+children} נוסעים${children?' · כולל ילדים':''}`;modal.close();document.dispatchEvent(new Event('brief-changed'));};
};
function selectTab(tab){if(activeSearch)return;state.tab=tab;$('.trip-type').hidden=tab!=='flights';$('#search-mode-note').textContent=tab==='flights'?'חיפוש טיסות חי מול Volero · הלוך־חזור או כיוון אחד':'מלונות וחבילות: השראה ותכנון בלבד, ללא חיפוש זמינות';document.querySelectorAll('[data-tab]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.tab===tab));b.tabIndex=b.dataset.tab===tab?0:-1;});$('.origin-field').style.display=tab==='hotels'?'none':'';$('.swap').style.display=tab==='hotels'?'none':'';$('.search-fields').classList.toggle('hotel-mode',tab==='hotels');$('.search-submit').innerHTML=icons('search')+({flights:'חפשו טיסה',hotels:'השראה למלונות',packages:'רעיונות לחופשה'})[tab];}
const tabButtons=[...document.querySelectorAll('[data-tab]')];tabButtons.forEach((b,i)=>{b.tabIndex=i===0?0:-1;b.onclick=()=>selectTab(b.dataset.tab);b.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowLeft'?1:-1)+3)%3;selectTab(tabButtons[n].dataset.tab);tabButtons[n].focus();}};});
function currentPreferences(){return{...state.preferences,adults:state.adults,children:state.children,...(state.start&&state.end?{nights:Math.round((new Date(state.end)-new Date(state.start))/86400000)}:{})};}
function voleroSearchRequest(){
 const destination=($('#destination').value||'').trim(), place=resolvePlace(destination), code=place?.code||'';
 const from=originPlace(), single=oneWay();
 const fail=(message,field)=>Object.assign(new Error(message),{field});
 const unknown=(value,example)=>{const near=placeSuggestions(value);return near.length?`לא זיהינו את „${value}”. התכוונתם ל${near.map(x=>x.label).join(' / ')}?`:`„${value}” עוד לא ברשימה שלנו. בחרו מהרשימה, או הזינו קוד שדה תעופה באנגלית (למשל ${example}).`;};
 if(!from) throw fail($('#origin').value.trim()?unknown($('#origin').value.trim(),'TLV לתל אביב'):'בחרו שדה מוצא.','#origin');
 if(!destination) throw fail('בחרו יעד מהרשימה או כתבו שם עיר.','#destination');
 if(!validFlightDates(state.start,state.end,localDate(),single)) throw fail(single?'בחרו תאריך יציאה לפני חיפוש טיסה.':'בחרו תאריכי יציאה וחזרה לפני חיפוש טיסה.','#dates-button');
 if(!place) throw fail(unknown(destination,'CDG לפריז'),'#destination');
 if(code===from.code) throw fail('בחרו יעד שונה משדה המוצא.','#destination');
 $('#destination').value=place.label;$('#origin').value=from.label;
 const leg=(a,b,date)=>({origin:{code:a,type:placeType(a)},destination:{code:b,type:placeType(b)},date});
 return {originDestinations:single?[leg(from.code,code,state.start)]:[leg(from.code,code,state.start),leg(code,from.code,state.end)],passengers:{ptcList:[{ptc:'ADT',count:state.adults},...(state.children?[{ptc:'CHD',count:state.children}]:[] )]},sellingChannel:'B2B',language:'en_GB',timeout:10};
}
let savedFlights=[];try{savedFlights=restoreSavedFlights(localStorage.getItem(SAVED_FLIGHTS_KEY));}catch{ /* Saving needs browser storage; the search still works without it. */ }
function storeSavedFlights(list){savedFlights=list;try{localStorage.setItem(SAVED_FLIGHTS_KEY,JSON.stringify(list));return true;}catch{toast('לא ניתן לשמור במכשיר הזה. העתיקו את פרטי הטיסה כדי לא לאבד אותם.');return false;}}
const verifiedPrices=new Map();
const verifiedStamp=v=>`<p class="verified-stamp">נבדק ב־${escapeHTML(v.at.toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'}))}: <strong dir="ltr">${escapeHTML(formatFare(v.price))}</strong>${v.changed?' · המחיר השתנה מאז החיפוש':''}</p>`;
let pendingFilters=null;
let searchContext=null, activeSearch=null, visibleOfferCount=12, flightSort='supplier';
const searchParams=()=>JSON.stringify([originPlace()?.code||$('#origin').value.trim(),resolvePlace($('#destination').value)?.code||$('#destination').value.trim(),oneWay()?'oneway':'round',state.start,oneWay()?'':state.end,state.adults,state.children]);
// F02: a refresh brings back the search details (no passenger data, no prices: those must be fetched again).
const LAST_SEARCH_KEY='gerbi-last-flight-search-v1';
function saveLastSearch(){try{localStorage.setItem(LAST_SEARCH_KEY,JSON.stringify({origin:originPlace()?.code||'',destination:$('#destination').value.trim(),start:state.start,end:oneWay()?'':state.end,type:oneWay()?'oneway':'round'}));}catch{ /* Restoring is a convenience only. */ }}
function restoreLastSearch(){
 let saved=null;try{saved=JSON.parse(localStorage.getItem(LAST_SEARCH_KEY)||'null');}catch{return;}
 const place=resolvePlace(saved?.destination);if(!place||!validFlightDates(saved.start,saved.end,localDate(),saved.type==='oneway'))return;
 setTripType(saved.type);const from=resolvePlace(saved.origin);if(from)$('#origin').value=from.label;
 $('#destination').value=place.label;state.start=saved.start;state.end=saved.end;
 $('#search-feedback').textContent='שחזרנו את פרטי החיפוש האחרון. לחצו „חפשו טיסה” כדי לקבל מחירים עדכניים; מחירים קודמים לא נשמרים.';$('#search-feedback').hidden=false;
}
// Results stay visible after the traveler edits the brief, but never look like an answer to the new details.
function markStaleResults(){
 const host=$('#live-results');if(!searchContext||host.hidden)return;
 const stale=searchParams()!==searchContext.params;host.classList.toggle('stale',stale);
 host.querySelectorAll('[data-volero-offer]').forEach(b=>b.disabled=stale);
 const note=$('#stale-note');
 if(stale&&!activeSearch)$('#search-feedback').hidden=true;
 if(stale&&!note){host.insertAdjacentHTML('afterbegin',`<div id="stale-note" class="stale-note" role="status"><p><strong>התוצאות האלה שייכות לחיפוש הקודם</strong> · ${escapeHTML(searchContext.destination)} · ${escapeHTML(searchContext.dates)} · ${searchContext.travelers} נוסעים. שיניתם פרטים, ולכן המחירים כאן אינם מתאימים לבקשה הנוכחית.</p><button type="button" class="button yellow" id="search-again">חיפוש מחדש לפרטים הנוכחיים</button></div>`);$('#search-again').onclick=()=>$('#search-form').requestSubmit();}
 else if(!stale)note?.remove();
}
$('#destination').addEventListener('input',markStaleResults);$('#origin').addEventListener('input',markStaleResults);
document.querySelectorAll('[name="trip-type"]').forEach(input=>input.addEventListener('change',()=>{showDates();markStaleResults();}));
$('#swap-route').onclick=()=>{const origin=$('#origin').value;$('#origin').value=$('#destination').value;$('#destination').value=origin;markStaleResults();toast('המוצא והיעד הוחלפו.');};
document.addEventListener('brief-changed',markStaleResults);
// ---- Live results: facts once per search; filters, sort, open details and the comparison survive every re-render.
let flightFilters=emptyFilters(),filtersOpen=!window.matchMedia('(max-width: 760px)').matches;
const openDetails=new Set(),compareOffers=new Map(),factsCache=new WeakMap();
const factsOf=payload=>{if(!factsCache.has(payload))factsCache.set(payload,(Array.isArray(payload?.offers)?payload.offers:[]).map(offer=>offerFacts(offer,payload)));return factsCache.get(payload);};
const point=p=>`${escapeHTML(p?.time||'—')} <small>${escapeHTML(p?.airport?.code||'')}</small>`;
const stopsText=n=>n===0?'טיסה ישירה':n===1?'החלפה אחת':`${n} החלפות`;
const layoverText=l=>`המתנה של ${hoursText(l.minutes)} · <span dir="ltr">${escapeHTML(l.city?`${l.city} (${l.airport})`:l.airport)}</span>${l.overnight?' · כולל לילה':''}${l.changeAirport?` · <strong>מעבר לשדה אחר (<span dir="ltr">${escapeHTML(l.nextAirport)}</span>)</strong>`:''}`;
const carrierLine=segment=>{const c=carrierOf(segment);return `${escapeHTML(c.name||'חברת התעופה לא נמסרה בהצעה')}${c.number?` · טיסה <span dir="ltr">${escapeHTML(c.number)}</span>`:''}${c.operator?` · מופעלת על ידי ${escapeHTML(c.operator)}`:''}`;};
// "Not provided" must never read like a perk: only supplier-confirmed baggage gets the positive style.
const BAG={included:['yes','מזוודה כלולה'],paid:['no','מזוודה בתשלום נוסף'],none:['no','ללא מזוודה בתעריף'],mixed:['unknown','מזוודה שונה בין הכיוונים'],unknown:['unknown','מזוודה: לא נמסר, נדרש בירור']};
const TROLLEY={included:['yes','טרולי כלול'],paid:['no','טרולי בתשלום'],mixed:['unknown','טרולי שונה בין הכיוונים'],unknown:['unknown','טרולי: לא נמסר']};
const bagPill=([kind,text])=>`<span class="bag bag-${kind}">${text}</span>`;
function legMarkupOf(f,key){
 return f.legs.map((leg,i)=>{
  const first=leg.segments[0],last=leg.segments.at(-1);if(!first||!last)return '<p class="micro-copy">פירוט המקטעים אינו זמין בהצעה הזו.</p>';
  const s=leg.summary,id=`${key}:${i}`;
  // Facts that change the decision (landing on another day, a long or overnight wait) stay outside the collapsed details.
  const warnings=[s.dayOffset>0?`נחיתה ב${escapeHTML(longDate(s.arriveDate))} (+${s.dayOffset})`:'',...s.layovers.filter(l=>l.overnight||l.changeAirport||l.minutes>=LONG_LAYOVER_MINUTES).map(layoverText),i===1&&f.airportChange?`החזרה יוצאת משדה אחר: <span dir="ltr">${escapeHTML(f.airports.join(' / '))}</span>`:''].filter(Boolean);
  return `<div class="flight-leg"><span>${i===0?'הלוך':'חזור'}</span><b dir="ltr">${point(first.departure)} → ${point(last.arrival)}</b><small>${escapeHTML(longDate(s.departDate))} · ${stopsText(s.stops)} · ${Number.isFinite(leg.minutes)?hoursText(leg.minutes)+' בדרך':'משך לא נמסר'}</small>${warnings.map(w=>`<small class="leg-warning">${w}</small>`).join('')}</div><details class="flight-segments" data-detail="${escapeHTML(id)}" ${openDetails.has(id)?'open':''}><summary>פירוט ותנאים ל${i===0?'הלוך':'חזור'}</summary>${leg.segments.map((segment,n)=>`${n?`<p class="layover">${layoverText(s.layovers[n-1])}</p>`:''}<p><strong dir="ltr">${point(segment.departure)} → ${point(segment.arrival)}</strong><br><span>יציאה: ${escapeHTML(longDate(segment.departure?.date)||'לא נמסר')} · הגעה: ${escapeHTML(longDate(segment.arrival?.date)||'לא נמסר')}</span><br><span>${carrierLine(segment)}</span></p>`).join('')}<p class="leg-bags">${bagPill(BAG[leg.baggage.checked])}${leg.baggage.pieces>1?` <small>(${leg.baggage.pieces} יחידות לנוסע)</small>`:''} ${bagPill(TROLLEY[leg.baggage.trolley])}${leg.baggage.fare?` <small>תעריף: ${escapeHTML(leg.baggage.fare)}${leg.baggage.cabin?' · '+escapeHTML(leg.baggage.cabin):''}</small>`:''}</p><p class="micro-copy">השעות מקומיות לכל שדה תעופה. כבודה לפי נתוני הספק לנוסע מבוגר; תנאי שינוי וביטול טעונים בירור לפני רכישה.</p></details>`;
 }).join('');
}
function legMarkup(offer,payload){return legMarkupOf(offerFacts(offer,payload),'check-'+offer.index);}
function flightCard(f,payload){
 const key=payload?.srk+':'+f.index;
 return `<article class="flight-card" data-offer-card="${escapeHTML(f.index)}"><div class="flight-details"><h3>${escapeHTML(f.carriers.join(' + ')||'חברת התעופה לא נמסרה')}</h3>${legMarkupOf(f,f.index)}<p class="bag-line">${bagPill(BAG[f.checked])}${bagPill(TROLLEY[f.trolley])}</p></div><div class="flight-price"><small>לכל ${searchContext.travelers} הנוסעים</small><strong dir="ltr">${escapeHTML(formatFare(f.price))}</strong><button class="yellow button" data-volero-offer="${escapeHTML(f.index)}">בדיקת מחיר וזמינות ←</button>${verifiedPrices.has(key)?verifiedStamp(verifiedPrices.get(key)):''}<label class="compare-check"><input type="checkbox" data-compare-offer="${escapeHTML(f.index)}" ${compareOffers.has(f.index)?'checked':''}>השוואה</label></div></article>`;
}
const filterLabels={stops:{'0':'טיסה ישירה','1':'עד החלפה אחת'},bucket:Object.fromEntries(TIME_BUCKETS.map(([id,label,from,to])=>[id,`${label} (${String(from).padStart(2,'0')}–${String(to%24).padStart(2,'0')})`]))};
function activeChips(){
 const chips=[];
 if(flightFilters.stops!=='any')chips.push(['stops',flightFilters.stops,filterLabels.stops[flightFilters.stops]]);
 flightFilters.out.forEach(v=>chips.push(['out',v,'הלוך: '+filterLabels.bucket[v]]));
 flightFilters.back.forEach(v=>chips.push(['back',v,'חזור: '+filterLabels.bucket[v]]));
 flightFilters.carriers.forEach(v=>chips.push(['carriers',v,v]));
 flightFilters.airports.forEach(v=>chips.push(['airports',v,'שדה '+v]));
 if(flightFilters.checkedBag)chips.push(['checkedBag','true','מזוודה כלולה']);
 return chips;
}
const chipMarkup=chips=>chips.map(([k,v,label])=>`<button type="button" class="filter-chip" data-remove-filter="${k}" data-value="${escapeHTML(v)}" aria-label="הסרת המסנן ${escapeHTML(label)}">${escapeHTML(label)} ✕</button>`).join('');
function filterPanel(all){
 // An option's count = results if that option alone were chosen in its group, everything else unchanged.
 const count=(group,patch)=>all.filter(f=>matchesFilters(f,{...flightFilters,...patch})).length;
 const toggle=(group,value,label,pressed,n)=>`<button type="button" class="filter-option" data-filter="${group}" data-value="${escapeHTML(value)}" aria-pressed="${pressed}" ${n||pressed?'':'disabled'}>${escapeHTML(label)} <small>${n}</small></button>`;
 const carriers=[...all.reduce((m,f)=>{f.carriers.forEach(c=>m.set(c,(m.get(c)||0)+1));return m;},new Map())].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([c])=>c);
 const buckets=group=>TIME_BUCKETS.map(([id])=>toggle(group,id,filterLabels.bucket[id],flightFilters[group].includes(id),count(group,{[group]:[id]}))).join('');
 const active=activeChips().length;
 return `<details class="flight-filters" id="flight-filters" ${filtersOpen?'open':''}><summary>סינון תוצאות${active?` · ${active} פעילים`:''}</summary><div class="filter-groups">
  <fieldset><legend>החלפות</legend>${[['any','הכול'],['0','ישירה בלבד'],['1','עד החלפה אחת']].map(([v,l])=>toggle('stops',v,l,flightFilters.stops===v,count('stops',{stops:v}))).join('')}</fieldset>
  <fieldset><legend>המראה בהלוך</legend>${buckets('out')}</fieldset>
  ${all.some(f=>f.legs.length>1)?`<fieldset><legend>המראה בחזור</legend>${buckets('back')}</fieldset>`:''}
  ${(airports=>airports.length>1?`<fieldset><legend>שדה תעופה ביעד</legend>${airports.map(code=>toggle('airports',code,code,flightFilters.airports.includes(code),count('airports',{airports:[code]}))).join('')}</fieldset>`:'')([...new Set(all.flatMap(f=>f.airports))].sort())}
  <fieldset><legend>חברת תעופה</legend>${carriers.map(c=>toggle('carriers',c,c,flightFilters.carriers.includes(c),count('carriers',{carriers:[c]}))).join('')}</fieldset>
  <fieldset><legend>כבודה</legend>${toggle('checkedBag','true','מזוודה כלולה לפי הספק',flightFilters.checkedBag,count('checkedBag',{checkedBag:true}))}<small class="micro-copy">הצעות שבהן הספק לא מסר כבודה אינן נכללות כאן, וגם אינן מסומנות כ„ללא”.</small></fieldset>
 </div></details>`;
}
function compareTray(){
 const n=compareOffers.size;if(!n)return '';
 return `<div class="flight-compare-tray" role="region" aria-label="השוואת טיסות"><span><strong>${n} טיסות בהשוואה</strong> <small>עד 3</small></span><div><button type="button" class="button yellow" data-open-compare ${n<2?'disabled':''}>השוואה</button><button type="button" class="button secondary" data-clear-compare>ניקוי</button></div></div>`;
}
function openFlightComparison(){
 const list=[...compareOffers.values()];if(list.length<2)return;
 const currencies=new Set(list.map(f=>f.price?.currency).filter(Boolean)),same=currencies.size===1;
 const cheapest=same?Math.min(...list.map(f=>f.price?.value??Infinity)):null;
 const shortest=Math.min(...list.map(f=>f.totalMinutes??Infinity));
 const leg=(f,i)=>{const l=f.legs[i];if(!l?.segments.length)return 'לא נמסר';const s=l.summary;return `<span dir="ltr">${escapeHTML(l.segments[0].departure?.time||'')} → ${escapeHTML(l.segments.at(-1).arrival?.time||'')}</span>${s.dayOffset>0?` (+${s.dayOffset})`:''}<br><small>${escapeHTML(longDate(s.departDate))} · ${stopsText(s.stops)} · ${hoursText(l.minutes)}</small>`;};
 const row=(label,cell)=>`<tr><th scope="row">${label}</th>${list.map(f=>`<td>${cell(f)}</td>`).join('')}</tr>`;
 openModal(`<span class="dialog-kicker">משווים על אותו בסיס: כל ${searchContext.travelers} הנוסעים</span><h2>השוואת טיסות</h2><div class="compare-table-wrap"><table class="flight-compare" style="--cols:${list.length}"><thead><tr><th scope="col"><span class="sr-only">נושא</span></th>${list.map(f=>`<th scope="col">${escapeHTML(f.carriers.join(' + ')||'לא נמסר')}</th>`).join('')}</tr></thead><tbody>
  ${row('מחיר כולל',f=>`<strong dir="ltr" class="${same&&f.price?.value===cheapest?'best':''}">${escapeHTML(formatFare(f.price))}</strong>${same&&f.price&&f.price.value>cheapest?`<br><small dir="ltr">+${escapeHTML(formatFare({value:f.price.value-cheapest,currency:f.price.currency}))}</small>`:''}`)}
  ${row('הלוך',f=>leg(f,0))}${list.some(f=>f.legs.length>1)?row('חזור',f=>leg(f,1)):''}
  ${row(list.some(f=>f.legs.length>1)?'זמן בדרך, שני הכיוונים':'זמן בדרך',f=>`<span class="${f.totalMinutes===shortest?'best':''}">${hoursText(f.totalMinutes)}</span>`)}
  ${row('ההמתנה הארוכה',f=>f.longestLayover?hoursText(f.longestLayover)+(f.overnight?' · כולל לילה':''):'אין')}
  ${row('מזוודה',f=>bagPill(BAG[f.checked]))}${row('טרולי',f=>bagPill(TROLLEY[f.trolley]))}
  ${row('',f=>`<button type="button" class="button secondary" data-goto-offer="${escapeHTML(f.index)}">לכרטיס הטיסה</button>`)}
 </tbody></table></div>${same?'':'<p class="notice">ההצעות במטבעות שונים, ולכן לא מחושב הפרש מחיר.</p>'}<p class="micro-copy">המחירים מהחיפוש ועשויים להשתנות. בדקו מחיר וזמינות לפני החלטה; לא נוצרה הזמנה.</p>`);
}
function renderVoleroOffers(payload){
 state.voleroResults=payload;
 const all=factsOf(payload),host=$('#live-results');host.hidden=false;
 const focusKey=(el=>el&&host.contains(el)?el.dataset.filter?`[data-filter="${el.dataset.filter}"][data-value="${CSS.escape(el.dataset.value)}"]`:el.id?'#'+el.id:el.dataset.compareOffer?`[data-compare-offer="${CSS.escape(el.dataset.compareOffer)}"]`:null:null)(document.activeElement);
 const mixed=new Set(all.map(f=>f.price?.currency).filter(Boolean)).size>1;
 const visible=sortFacts(all.filter(f=>matchesFilters(f,flightFilters)),flightSort),chips=activeChips();
 host.innerHTML=`<div class="live-heading"><div><span class="eyebrow">תוצאות חיות מ־Volero</span><h2 tabindex="-1">${escapeHTML(searchContext?.destination||'תוצאות הטיסות')}</h2><p>${escapeHTML(searchContext?.dates||'')} · ${searchContext?.travelers||2} נוסעים · ${searchContext?.oneWay?'כיוון אחד':'הלוך וחזור'}</p>${(place=>place?.airports?`<p class="micro-copy">חיפוש בכל שדות התעופה של ${escapeHTML(place.names[0])}: <span dir="ltr">${place.airports.join(', ')}</span>. השדה מופיע בכל כרטיס, ואפשר לסנן לפיו.</p>`:'')(places.find(p=>p.code===searchContext?.destinationCode))}</div><div class="live-actions"><button type="button" class="button secondary" id="edit-flight-search">שינוי החיפוש</button><button type="button" class="button secondary" id="share-flight-search">שיתוף החיפוש</button></div><label>מיון תוצאות<select id="flight-sort"><option value="supplier">סדר הספק</option><option value="price" ${mixed?'disabled':''} ${flightSort==='price'?'selected':''}>הזולה ביותר (לכל הנוסעים)</option><option value="duration" ${flightSort==='duration'?'selected':''}>הקצרה ביותר (שני הכיוונים)</option></select></label></div>
 ${all.length?filterPanel(all):''}
 ${chips.length?`<div class="filter-chips">${chipMarkup(chips)}<button type="button" class="link-button" data-clear-filters>איפוס המסננים</button></div>`:''}
 <p class="micro-copy" role="status">${chips.length?`${visible.length} מתוך ${all.length} הצעות`:`${all.length} הצעות בחיפוש`} · מוצגות ${Math.min(visible.length,visibleOfferCount)}. המחיר לכל הנוסעים, במטבע הספק. ${mixed?'התוצאות במטבעות שונים ולכן אינן ממוינות לפי מחיר.':''}</p>
 <div class="flight-list">${visible.length?visible.slice(0,visibleOfferCount).map(f=>flightCard(f,payload)).join(''):all.length?`<div class="empty-panel"><h3>אין הצעות שמתאימות לכל המסננים</h3><p>אפשר להסיר מסנן אחד ולראות שוב:</p><div class="filter-chips">${chipMarkup(chips)}</div></div>`:'<div class="empty-panel"><h3>לא מצאנו טיסה בתאריכים האלה</h3><p>אפשר לשנות יעד או תאריכים ולנסות שוב.</p><button class="button secondary" data-edit-search>שינוי החיפוש</button></div>'}</div>
 ${visible.length>visibleOfferCount?'<button class="button secondary more-flights" id="more-flights">הצגת הצעות נוספות</button>':''}${compareTray()}`;
 if(focusKey)host.querySelector(focusKey)?.focus();
 markStaleResults();
}
const liveHost=$('#live-results');
liveHost.addEventListener('toggle',e=>{const d=e.target;if(d.id==='flight-filters')filtersOpen=d.open;else if(d.dataset?.detail)d.open?openDetails.add(d.dataset.detail):openDetails.delete(d.dataset.detail);},true);
liveHost.addEventListener('change',e=>{
 const payload=state.voleroResults;if(!payload)return;
 if(e.target.id==='flight-sort'){flightSort=e.target.value;renderVoleroOffers(payload);}
 const id=e.target.dataset.compareOffer;
 if(id){if(!e.target.checked)compareOffers.delete(id);else if(compareOffers.size>=3){e.target.checked=false;toast('אפשר להשוות עד 3 טיסות. הסירו אחת כדי להוסיף.');return;}else compareOffers.set(id,factsOf(payload).find(f=>f.index===id));renderVoleroOffers(payload);}
});
liveHost.addEventListener('click',e=>{
 const payload=state.voleroResults;if(!payload)return;
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
 if(e.target.closest('#edit-flight-search')){$('#search-form').scrollIntoView({block:'center'});$('#destination').focus();return;}
 if(e.target.closest('[data-edit-search]')){$('#dates-button').click();return;}
 if(e.target.closest('[data-open-compare]')){openFlightComparison();return;}
 if(e.target.closest('[data-clear-compare]')){compareOffers.clear();renderVoleroOffers(payload);return;}
});
$('#modal-content').addEventListener('click',e=>{
 const go=e.target.closest('[data-goto-offer]');if(!go)return;
 modal.close();const card=document.querySelector(`[data-offer-card="${CSS.escape(go.dataset.gotoOffer)}"]`);
 if(card){card.scrollIntoView({block:'center'});card.querySelector('[data-volero-offer]').focus();}else toast('הטיסה מוסתרת כרגע בגלל מסנן או מחוץ לרשימה המוצגת.');
});
$('#search-form').onsubmit=async e=>{
 e.preventDefault();if(state.tab!=='flights'){pages.search($('#destination').value.trim(),state.tab);return;}
 if(activeSearch)return;
 const feedback=$('#search-feedback'),button=$('.search-submit');
 let request;try{request=voleroSearchRequest();}catch(error){feedback.textContent=error.message;feedback.hidden=false;const field=error.field&&$(error.field);if(field){field.setAttribute('aria-describedby','search-feedback');field.focus();}return;}
 const context={params:searchParams(),destination:$('#destination').value.trim(),destinationCode:request.originDestinations[0].destination.code,
  dates:oneWay()?longDate(state.start):`${longDate(state.start)} – ${longDate(state.end)}`,travelers:state.adults+state.children,oneWay:oneWay(),
  search:{origin:request.originDestinations[0].origin.code,destination:$('#destination').value.trim(),start:state.start,end:oneWay()?'':state.end,type:oneWay()?'oneway':'round',adults:state.adults,children:state.children}};
 const controller=new AbortController();activeSearch=controller;let cancelled=false;
 const timer=setTimeout(()=>controller.abort(),45000);
 button.disabled=true;button.setAttribute('aria-busy','true');button.textContent='מחפשים לכם טיסות…';
 feedback.innerHTML='<span id="search-progress">בודקים הצעות עדכניות מול Volero. זה יכול לקחת כמה רגעים.</span>';feedback.hidden=false;const started=Date.now(),ticker=setInterval(()=>{const seconds=Math.round((Date.now()-started)/1000),line=$('#search-progress');if(line)line.textContent=`בודקים הצעות עדכניות מול Volero… ${seconds} שניות${seconds>15?'. חיפושים עמוסים לוקחים לפעמים עד חצי דקה.':''}`;},1000);const cancel=document.createElement('button');cancel.type='button';cancel.className='button secondary';cancel.id='cancel-flight-search';cancel.textContent='ביטול ההמתנה';cancel.onclick=()=>{cancelled=true;controller.abort();};feedback.append(' ',cancel);
 $('#live-results').hidden=true;state.voleroResults=null;
 try{
  const response=await fetch('/api/volero/flights/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request),signal:controller.signal});
  const data=await response.json();if(!response.ok)throw new Error('לא הצלחנו להשלים את החיפוש מול הספק. בדקו את היעד ונסו שוב.');
  searchContext=context;flightSort='supplier';visibleOfferCount=12;flightFilters=emptyFilters();openDetails.clear();compareOffers.clear();
  const fromRequest=pendingFilters;pendingFilters=null;
  if(fromRequest){const names=[...new Set(factsOf(data.data).flatMap(f=>f.carriers))];flightFilters={...emptyFilters(),stops:fromRequest.stops||'any',out:fromRequest.out||[],back:fromRequest.back||[],checkedBag:fromRequest.checkedBag===true,carriers:fromRequest.carrier?names.filter(name=>name.toLowerCase().includes(fromRequest.carrier)):[]};}
  renderVoleroOffers(data.data);saveLastSearch();history.replaceState(null,'',searchLink(context.search));
  feedback.textContent=fromRequest&&activeChips().length?'החיפוש הושלם. ההעדפות מהבקשה שלכם הוחלו כמסננים, ואפשר להסיר כל אחד מהם.':'החיפוש הושלם. התוצאות מופיעות בהמשך.';
  if(onHome()){$('#live-results h2').focus({preventScroll:true});$('#live-results').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
 }catch(error){pendingFilters=null;feedback.textContent=error.name==='AbortError'?cancelled?'ההמתנה לחיפוש בוטלה. אפשר לשנות פרטים ולחפש שוב.':'החיפוש ארך יותר מהצפוי. הפרטים נשמרו בטופס ואפשר לנסות שוב.':error.message;}
 finally{clearTimeout(timer);clearInterval(ticker);if(cancelled)button.focus();activeSearch=null;button.disabled=false;button.removeAttribute('aria-busy');button.innerHTML=icons('search')+'חפשו טיסה';}
};
$('#all-deals').onclick=()=>pages.navigate('/destinations');
document.addEventListener('click',async e=>{
 const favorite=e.target.closest('[data-favorite]');if(favorite){const id=favorite.dataset.favorite;favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];favorite.setAttribute('aria-pressed',String(favorites.includes(id)));favorite.setAttribute('aria-label',(favorites.includes(id)?'הסרת ':'שמירת ')+trips.find(t=>t.id===id).short);try{localStorage.setItem('gerbi-favorites',JSON.stringify(favorites));toast(favorites.includes(id)?'נשמר במועדפים במכשיר הזה ♡':'הוסר מהמועדפים');}catch{toast('המועדף נשמר להמשך השימוש הנוכחי בלבד');}}
 const trip=e.target.closest('[data-trip]');if(trip)openTrip(trip.dataset.trip);
 const offerButton=e.target.closest('[data-volero-offer]');if(offerButton){
  const result=state.voleroResults,offerIndex=offerButton.dataset.voleroOffer,offerContext=searchContext;
  const currentOffer=()=>state.voleroResults===result&&onHome()&&offerButton.isConnected;
  const selected=result?.offers?.find(item=>String(item.index)===offerIndex);
  if(!selected||!result.srk||!result.tokens?.searchResults||$('#live-results').classList.contains('stale')){toast('החיפוש אינו תקף לפרטים הנוכחיים. חפשו שוב לקבלת הצעות עדכניות.');return;}
  offerButton.disabled=true;offerButton.textContent='בודקים מחיר…';
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
  try{
   const response=await fetch('/api/volero/flights/availability',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({srk:result.srk,offerIndex,searchToken:result.tokens.searchResults,input:{itineraryIndex:selected.flightsOverview?.[0]?.itineraryIndex??0}})});
   const data=await response.json();if(!response.ok)throw new Error('לא ניתן לאמת כרגע את ההצעה. ייתכן שהמחיר או הזמינות השתנו. חפשו מחדש או בדקו הצעה אחרת.');
   if(!currentOffer())return;
   const priced=data.data?.pricedOffer,price=offerPrice(priced),old=offerPrice(selected);
   if(!price)throw new Error('הספק לא החזיר מחיר מלא. לא ניתן לאשר את ההצעה כרגע.');
   const changed=old && (old.value!==price.value || old.currency!==price.currency);
   const verified={price,at:new Date(),changed};verifiedPrices.set(result.srk+':'+offerIndex,verified);
   const priceBox=offerButton.closest('.flight-price');priceBox.querySelector('.verified-stamp')?.remove();priceBox.insertAdjacentHTML('beforeend',verifiedStamp(verified));
   openModal(`<span class="dialog-kicker">תשובה עדכנית מ־Volero</span><h2>${changed?'המחיר עודכן':'בדיקת המחיר הושלמה'}</h2><p>${escapeHTML(offerContext.destination)} · ${escapeHTML(offerContext.dates)}</p><p class="micro-copy">נבדק כעת: ${escapeHTML(new Date().toLocaleString('he-IL'))}. המחיר עשוי להשתנות; לא נוצרה הזמנה.</p><div class="verified-price"><small>מחיר ההצעה לכל ${offerContext.travelers} הנוסעים</small><strong dir="ltr">${escapeHTML(formatFare(price))}</strong>${changed?`<span>בחיפוש הוצג: ${escapeHTML(formatFare(old))}</span>`:''}</div>${legMarkup(priced,data.data)}<p class="notice">לא נוצרה הזמנה. כבודה, שירותים נוספים ותנאי ביטול דורשים עיון לפני רכישה. השלמת הזמנה ותשלום עדיין אינה זמינה באתר.</p><div class="dialog-actions"><button class="button yellow" data-save-flight>שמירת הטיסה בטיולים שלי</button><button class="button secondary" data-close-availability>חזרה להשוואת הטיסות</button></div><p class="micro-copy" id="save-flight-status" role="status">השמירה כוללת את המחיר ושעת הבדיקה. היא אינה שריון מקום.</p>`);
   $('[data-close-availability]').onclick=()=>modal.close();
   $('[data-save-flight]').onclick=e=>{const facts=factsOf(result).find(f=>f.index===offerIndex);if(!facts)return;if(storeSavedFlights(addSavedFlight(savedFlights,flightSnapshot(facts,offerContext.search,verified)))){e.currentTarget.disabled=true;e.currentTarget.textContent='נשמר ✓';$('#save-flight-status').innerHTML='הטיסה נשמרה במכשיר הזה. <a href="#/account">לטיולים שלי ←</a> לא הוזמן; נדרשת בדיקת זמינות לפני המשך.';}};
  }catch(error){if(!currentOffer())return;openModal(`<span class="dialog-kicker">בודקים שוב לפני שממשיכים</span><h2>ההצעה לא אומתה</h2><p>${escapeHTML(error.name==='AbortError'?'בדיקת הספק ארכה יותר מהצפוי. נסו שוב בעוד רגע.':error.message)}</p><button class="button secondary full-width" data-close-availability>חזרה לתוצאות</button>`);$('[data-close-availability]').onclick=()=>modal.close();}
  finally{clearTimeout(timer);offerButton.disabled=false;offerButton.textContent='בדיקת מחיר וזמינות ←';markStaleResults();}
 }
 const info=e.target.closest('[data-info]');if(info)showInfo(info.dataset.info);
});
function openTrip(id){pages.navigate('/trip/'+id);}
function openChat(prompt=''){pages.openPlanner(prompt);}
function getMissing(){return [];}
function showInfo(type){pages.navigate(({recommendations:'/inspiration',support:'/support',account:'/account',blog:'/blog',accessibility:'/accessibility'})[type]||'/support');}
$('#prompt-form').onsubmit=e=>{e.preventDefault();openChat($('#trip-prompt').value);};
async function shareSearch(){
 const url=location.origin+location.pathname+searchLink(searchContext.search);
 try{if(navigator.share){await navigator.share({title:'חיפוש טיסות בג׳רבי',text:`${searchContext.destination} · ${searchContext.dates}`,url});return;}await navigator.clipboard.writeText(url);toast('הקישור לחיפוש הועתק. הוא כולל רק את תנאי החיפוש, בלי מחירים.');}
 catch(error){if(error?.name!=='AbortError')toast('לא הצלחנו להעתיק. אפשר להעתיק את הכתובת משורת הדפדפן.');}
}
// A shared link fills the form; the search runs only when the visitor asks, so links never trigger supplier calls.
function restoreSharedSearch(){
 const shared=parseSearchLink(location.hash);if(!shared)return false;
 setTripType(shared.type);const from=resolvePlace(shared.origin);if(from)$('#origin').value=from.label;
 $('#destination').value=shared.destination;state.start=shared.start;state.end=shared.end;state.adults=shared.adults;state.children=shared.children;
 $('#search-feedback').textContent='פתחתם קישור לחיפוש טיסות. בדקו את הפרטים ולחצו „חפשו טיסה” כדי לקבל מחירים עדכניים.';$('#search-feedback').hidden=false;
 return true;
}
const sharedSearch=restoreSharedSearch();if(!sharedSearch)restoreLastSearch();
if(!contactActions(contact,'x').length)document.querySelectorAll('.support, nav a[href="#/support"]').forEach(el=>{const icon=el.querySelector('svg');el.textContent='עזרה ושאלות';if(icon)el.prepend(icon);});
window.addEventListener('hashchange',()=>{if(!activeSearch&&restoreSharedSearch())document.dispatchEvent(new Event('brief-changed'));});
const pages=initPages({state,trips,money,icons,escapeHTML,toast,openModal,openDates,renderCards,selectFlights:()=>selectTab('flights'),
 getFavorites:()=>favorites,
 getSavedFlights:()=>savedFlights,
 removeSavedFlight(id){return storeSavedFlights(savedFlights.filter(item=>item.id!==id));},
 flightFollowUp:flight=>({text:followUpText(flight,formatFare),actions:contactActions(contact,followUpText(flight,formatFare),'טיסה לבדיקה – ג׳רבי')}),
 formatFare,longDate,searchLinkOf:flight=>searchLink({origin:flight.from,destination:flight.to,start:flight.start,end:flight.end,type:flight.end?'round':'oneway',adults:flight.adults,children:flight.children}),
 contactActions:message=>contactActions(contact,message),
 today:()=>localDate(),
 placeLabel:code=>places.find(p=>p.code===code)?.names[0]||code,
 // A search the planner understood: same form, same supplier call, preferences arrive as removable filters.
 runFlightSearch(fs){
  setTripType(fs.type);$('#origin').value=resolvePlace(fs.origin)?.label||fs.origin;$('#destination').value=resolvePlace(fs.destination)?.label||fs.destination;
  state.start=fs.start;state.end=fs.end;state.adults=fs.adults;state.children=fs.children;pendingFilters=fs.filters;
  window.addEventListener('hashchange',()=>{selectTab('flights');document.dispatchEvent(new Event('brief-changed'));$('#search-form').requestSubmit();},{once:true});
  pages.navigate('/');
 },
 toggleFavorite(id){let persisted=true;favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];try{localStorage.setItem('gerbi-favorites',JSON.stringify(favorites));}catch{persisted=false;}renderCards();return persisted;},
 openTravelers:()=>$('#travelers-button').onclick(),
 currentPreferences,
 syncHome(){ saveStyles();$('#travelers-value').textContent=`${state.adults+state.children} נוסעים`;showDates(); markStaleResults(); }
});
function refreshPersonalization(){
 document.querySelectorAll('[data-preference]').forEach(b=>b.setAttribute('aria-pressed',String(state.preferences[b.dataset.preference]===true)));
 const selected=styles.filter(style=>state.preferences[style.id]===true);
 const ranked=rankInspirations(trips,{...state.preferences,budget:undefined,nights:undefined},4);
 renderCards(ranked.map(({trip,reasons})=>({...trip,matchReason:reasons.length?'לפי הבחירה שלכם: '+reasons.join(' · '):''})));
 $('#preference-status').textContent=selected.length?`ההשראה מסודרת לפי ${selected.map(x=>x.label).join(' · ')}. נשמר במכשיר הזה.`:'בחרו סגנון כדי לדייק את סדר ההמלצות. נשמר במכשיר הזה בלבד.';
}
$('.preference-chips').innerHTML=styles.map(style=>`<button type="button" data-preference="${style.id}" aria-pressed="false">${icons(style.icon)}${style.label}</button>`).join('');
function saveStyles(){
 try{localStorage.setItem('gerbi-preferences',JSON.stringify(Object.fromEntries(styles.map(style=>[style.id,state.preferences[style.id]===true]))));}catch{toast('ההעדפות זמינות לשימוש הנוכחי; השמירה במכשיר אינה זמינה.');}
 refreshPersonalization();
}
document.querySelectorAll('[data-preference]').forEach(button=>button.onclick=()=>{const key=button.dataset.preference;state.preferences[key]=!state.preferences[key];saveStyles();});
$('#reset-styles').onclick=()=>{styles.forEach(style=>state.preferences[style.id]=false);saveStyles();};
document.querySelectorAll('[data-starter]').forEach(button=>button.onclick=()=>openChat(button.dataset.starter));
window.addEventListener('hashchange',()=>{if(onHome())refreshPersonalization();});
refreshPersonalization();
if(document.modelContext?.registerTool){
 const controller=new AbortController();
 try{Promise.resolve(document.modelContext.registerTool({name:'start_trip_planning',title:'תכנון חופשה עם ג׳רבי',description:'Open the local demo trip planner with a Hebrew request. Does not search live inventory or book anything.',inputSchema:{type:'object',properties:{request:{type:'string',minLength:1,maxLength:1500}},required:['request'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input.request!=='string'||!input.request.trim()||input.request.length>1500)throw new Error('A non-empty request of at most 1500 characters is required');openChat(input.request);return{mode:'demo',opened:true,missing:getMissing(state.preferences),liveAvailability:false};}},{signal:controller.signal})).catch(error=>console.warn('Optional browser planner registration unavailable:',error.message));}catch(error){console.warn('Optional browser planner registration unavailable:',error.message);}
 window.addEventListener('pagehide',()=>controller.abort(),{once:true});
}
