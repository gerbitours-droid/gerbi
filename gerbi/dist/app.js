import { styles, rankInspirations } from './personalization.mjs';
import { offerPrice, formatFare, destinationPhoto, sortedOffers } from './flight-view.mjs';
import { parsePreferences, rankDemoTrips, estimateDemoTotal, validDateRange } from './planner.mjs';
import { trips } from './data.mjs';
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
const airportCodes={'סנטוריני, יוון':'JTR','רומא, איטליה':'FCO','האיים המלדיביים':'MLE','דובאי, איחוד האמירויות':'DXB'};
$('.skip-link').onclick=e=>{e.preventDefault();$('#main-content').focus();$('#main-content').scrollIntoView({block:'start'});};
const modal=$('#modal');
let toastTimer;
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3500);}
function openModal(html){$('#modal-content').innerHTML=html;const title=$('#modal-content h2');if(title){title.id='dialog-title';modal.setAttribute('aria-labelledby','dialog-title');}if(!modal.open)modal.showModal();}
$('.modal-close').addEventListener('click',()=>modal.close());
modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close();}});
function localDate(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
function shortDate(value){return new Date(value+'T12:00:00').toLocaleDateString('he-IL',{day:'numeric',month:'short'});}
function openDates(){
 openModal(`<span class="dialog-kicker">בוחרים מתי לצאת לחופש</span><h2>מתי בא לכם לטוס?</h2><p>בחרו תאריך יציאה וחזרה. אפשר גם לתכנן קודם ולבחור תאריכים אחר כך.</p><form id="date-form"><div class="form-grid"><label class="modal-field">תאריך יציאה<input id="start-date" type="date" min="${localDate()}" value="${state.start}" required></label><label class="modal-field">תאריך חזרה<input id="end-date" type="date" min="${state.start||localDate()}" value="${state.end}" required></label></div><p id="date-error" class="inline-error" hidden></p><button class="yellow dialog-primary">אישור תאריכים</button></form>`);
 $('#start-date').onchange=()=>{$('#end-date').min=$('#start-date').value;};
 $('#date-form').onsubmit=e=>{e.preventDefault();const start=$('#start-date').value,end=$('#end-date').value;if(!validDateRange(start,end,localDate())){$('#date-error').textContent='תאריך החזרה צריך להיות אחרי היציאה, ותאריך היציאה לא יכול להיות בעבר.';$('#date-error').hidden=false;return;}state.start=start;state.end=end;state.preferences.nights=Math.round((new Date(end)-new Date(start))/86400000);$('#dates-value').textContent=`${shortDate(start)} – ${shortDate(end)}`;$('#dates-value').classList.remove('muted');modal.close();document.dispatchEvent(new Event('brief-changed'));};
}
$('#dates-button').onclick=openDates;
$('#travelers-button').onclick=()=>{
 let adults=state.adults,children=state.children;
 openModal(`<span class="dialog-kicker">יש מקום לכולם</span><h2>מי יוצא לחופשה?</h2><div class="counter"><span><strong>מבוגרים</strong><small>מגיל 18 ומעלה</small></span><div class="counter-controls"><button aria-label="הוספת מבוגר" data-counter="adult-plus">+</button><strong id="adult-count">${adults}</strong><button aria-label="הסרת מבוגר" data-counter="adult-minus">−</button></div></div><div class="counter"><span><strong>ילדים</strong><small>גילאים מדויקים יידרשו לתמחור אמיתי</small></span><div class="counter-controls"><button aria-label="הוספת ילד" data-counter="child-plus">+</button><strong id="child-count">${children}</strong><button aria-label="הסרת ילד" data-counter="child-minus">−</button></div></div><button id="save-travelers" class="yellow dialog-primary">אישור הרכב הנוסעים</button>`);
 const update=()=>{$('#adult-count').textContent=adults;$('#child-count').textContent=children;$('[data-counter="adult-minus"]').disabled=adults<=1;$('[data-counter="adult-plus"]').disabled=adults+children>=9;$('[data-counter="child-minus"]').disabled=children<=0;$('[data-counter="child-plus"]').disabled=adults+children>=9;};
 document.querySelectorAll('[data-counter]').forEach(b=>b.onclick=()=>{if(b.dataset.counter==='adult-plus')adults++;if(b.dataset.counter==='adult-minus')adults--;if(b.dataset.counter==='child-plus')children++;if(b.dataset.counter==='child-minus')children--;update();});update();
 $('#save-travelers').onclick=()=>{state.adults=adults;state.children=children;$('#travelers-value').textContent=`${adults+children} נוסעים${children?' · כולל ילדים':''}`;modal.close();document.dispatchEvent(new Event('brief-changed'));};
};
function selectTab(tab){if(activeSearch)return;state.tab=tab;$('#search-mode-note').textContent=tab==='flights'?'חיפוש טיסות חי מול Volero':'מלונות וחבילות: השראה ותכנון בלבד, ללא חיפוש זמינות';document.querySelectorAll('[data-tab]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.tab===tab));b.tabIndex=b.dataset.tab===tab?0:-1;});$('.origin-field').style.display=tab==='hotels'?'none':'';$('.swap').style.display=tab==='hotels'?'none':'';$('.search-fields').classList.toggle('hotel-mode',tab==='hotels');$('.search-submit').innerHTML=icons('search')+({flights:'חפשו טיסה',hotels:'השראה למלונות',packages:'רעיונות לחופשה'})[tab];}
const tabButtons=[...document.querySelectorAll('[data-tab]')];tabButtons.forEach((b,i)=>{b.tabIndex=i===0?0:-1;b.onclick=()=>selectTab(b.dataset.tab);b.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowLeft'?1:-1)+3)%3;selectTab(tabButtons[n].dataset.tab);tabButtons[n].focus();}};});
function currentPreferences(){return{...state.preferences,adults:state.adults,children:state.children,...(state.start&&state.end?{nights:Math.round((new Date(state.end)-new Date(state.start))/86400000)}:{})};}
function voleroSearchRequest(){
 const destination=($('#destination').value||'').trim(); const code=airportCodes[destination]||destination.toUpperCase();
 if(!validDateRange(state.start,state.end,localDate())) throw new Error('בחרו תאריכים לפני חיפוש טיסה.');
 if(code===$('#origin').value) throw new Error('בחרו יעד שונה משדה המוצא.');
 if(!/^[A-Z]{3}$/.test(code)) throw new Error('בחרו יעד עם קוד שדה תעופה בן 3 אותיות.');
 return {originDestinations:[{origin:{code:$('#origin').value,type:'a'},destination:{code,type:'a'},date:state.start},{origin:{code,type:'a'},destination:{code:$('#origin').value,type:'a'},date:state.end}],passengers:{ptcList:[{ptc:'ADT',count:state.adults},...(state.children?[{ptc:'CHD',count:state.children}]:[] )]},sellingChannel:'B2B',language:'en_GB',timeout:10};
}
let searchContext=null, activeSearch=null, visibleOfferCount=12, flightSort='supplier';
function routeLegs(offer, payload) {
 const lists=payload?.dataLists||{};
 const flights=lists.flightList||[], segments=lists.flightSegmentList||[];
 return (offer.flightsOverview?.[0]?.flightReferences||[]).map(ref=>{
  const flight=flights.find(item=>item.key===ref);
  return (flight?.segmentReferences||[]).map(key=>segments.find(item=>item.key===key)).filter(Boolean);
 });
}
function legMarkup(offer,payload){
 return routeLegs(offer,payload).map((segments,i)=>{
  const first=segments[0],last=segments.at(-1);if(!first||!last)return '<p class="micro-copy">פירוט המקטעים אינו זמין בהצעה הזו.</p>';
  const point=p=>`${escapeHTML(p?.time||'—')} <small>${escapeHTML(p?.airport?.code||'')}</small>`;
  return `<div class="flight-leg"><span>${i===0?'הלוך':'חזור'}</span><b dir="ltr">${point(first.departure)} → ${point(last.arrival)}</b><small>${escapeHTML(first.departure?.date||'')} · ${segments.length===1?'ללא החלפת טיסה':`${segments.length-1} החלפות`}</small></div><details class="flight-segments"><summary>פירוט מקטעי ${i===0?'ההלוך':'החזור'}</summary>${segments.map(segment=>`<p><strong dir="ltr">${point(segment.departure)} → ${point(segment.arrival)}</strong><br><span>יציאה: ${escapeHTML(segment.departure?.date||'לא נמסר')} · הגעה: ${escapeHTML(segment.arrival?.date||'לא נמסר')}</span><br><span>${escapeHTML(segment.marketingCarrier?.name||segment.marketingCarrier?.code||'חברת תעופה לא נמסרה')}</span></p>`).join('')}<p class="micro-copy">השעות מקומיות לכל שדה תעופה. כבודה ותנאי תעריף טעונים בירור מול הספק.</p></details>`;
 }).join('');
}
function renderVoleroOffers(payload){
 state.voleroResults=payload;
 const offers=Array.isArray(payload?.offers)?payload.offers:[];
 const host=$('#live-results');host.hidden=false;
 const priced=offers.map(offerPrice).filter(Boolean);
 const mixed=new Set(priced.map(p=>p.currency)).size>1;
 const photo=destinationPhoto(searchContext?.destinationCode);
 host.innerHTML=`<div class="live-heading"><div><span class="eyebrow">תוצאות חיות מ־Volero</span><h2 tabindex="-1">${escapeHTML(searchContext?.destination||'תוצאות הטיסות')}</h2><p>${escapeHTML(searchContext?.dates||'')} · ${searchContext?.travelers||2} נוסעים · הלוך וחזור</p></div><button type="button" class="button secondary" id="edit-flight-search">שינוי החיפוש</button><label>מיון תוצאות<select id="flight-sort"><option value="supplier">סדר הספק</option><option value="price" ${mixed?'disabled':''} ${flightSort==='price'?'selected':''}>מחיר מהנמוך לגבוה</option></select></label></div>
 <p class="micro-copy" role="status">${offers.length} הצעות בחיפוש · מוצגות ${Math.min(offers.length,visibleOfferCount)}. המחיר לכל הנוסעים, במטבע הספק. ${mixed?'התוצאות במטבעות שונים ולכן אינן ממוינות לפי מחיר.':''}</p>
 <div class="flight-list">${offers.length?sortedOffers(offers,flightSort).slice(0,visibleOfferCount).map((offer,index)=>{
  const price=offerPrice(offer);const carrier=offer.fareDetails?.validatingCarrier;
  const marketing=routeLegs(offer,payload)[0]?.[0]?.marketingCarrier;
  const carrierName=marketing?.name||carrier?.name||marketing?.code||'חברת התעופה לפי הספק';
  return `<article class="flight-card">${photo?`<img class="flight-photo" src="/assets/${photo}" alt="${escapeHTML(searchContext.destination)}" loading="lazy" width="220" height="180">`:'<div class="flight-placeholder" aria-hidden="true">✈</div>'}<div class="flight-details"><span class="live-pill">הצעה ${index+1} · Volero</span><h3>${escapeHTML(carrierName)}</h3>${legMarkup(offer,payload)}<p class="micro-copy">כבודה ותנאים לפי ההצעה. המחיר כפוף לבדיקה חוזרת.</p></div><div class="flight-price"><small>לכל ${searchContext.travelers} הנוסעים</small><strong dir="ltr">${escapeHTML(formatFare(price))}</strong><button class="yellow button" data-volero-offer="${escapeHTML(offer.index)}">בדיקת מחיר וזמינות ←</button></div></article>`;
 }).join(''):'<div class="empty-panel"><h3>לא מצאנו טיסה בתאריכים האלה</h3><p>אפשר לשנות יעד או תאריכים ולנסות שוב.</p><button class="button secondary" data-edit-search>שינוי החיפוש</button></div>'}</div>
 ${offers.length>visibleOfferCount?'<button class="button secondary more-flights" id="more-flights">הצגת הצעות נוספות</button>':''}`;
 $('#edit-flight-search').onclick=()=>{$('#search-form').scrollIntoView({block:'center'});$('#destination').focus();};
 $('#flight-sort').onchange=e=>{flightSort=e.target.value;renderVoleroOffers(payload);$('#flight-sort').focus();};
 $('#more-flights')?.addEventListener('click',()=>{const firstNew=visibleOfferCount;visibleOfferCount+=12;renderVoleroOffers(payload);host.querySelectorAll('[data-volero-offer]')[firstNew]?.focus();});
 $('[data-edit-search]')?.addEventListener('click',()=>$('#dates-button').click());
}
$('#search-form').onsubmit=async e=>{
 e.preventDefault();if(state.tab!=='flights'){pages.search($('#destination').value.trim(),state.tab);return;}
 if(activeSearch)return;
 const feedback=$('#search-feedback'),button=$('.search-submit');
 let request;try{request=voleroSearchRequest();}catch(error){feedback.textContent=error.message;feedback.hidden=false;return;}
 const context={destination:$('#destination').value.trim(),destinationCode:request.originDestinations[0].destination.code,
  dates:`${shortDate(state.start)} – ${shortDate(state.end)}`,travelers:state.adults+state.children};
 const controller=new AbortController();activeSearch=controller;let cancelled=false;
 const timer=setTimeout(()=>controller.abort(),45000);
 button.disabled=true;button.setAttribute('aria-busy','true');button.textContent='מחפשים לכם טיסות…';
 feedback.textContent='בודקים הצעות עדכניות מול Volero. זה יכול לקחת כמה רגעים.';feedback.hidden=false;const cancel=document.createElement('button');cancel.type='button';cancel.className='button secondary';cancel.id='cancel-flight-search';cancel.textContent='ביטול ההמתנה';cancel.onclick=()=>{cancelled=true;controller.abort();};feedback.append(' ',cancel);
 $('#live-results').hidden=true;state.voleroResults=null;
 try{
  const response=await fetch('/api/volero/flights/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request),signal:controller.signal});
  const data=await response.json();if(!response.ok)throw new Error('לא הצלחנו להשלים את החיפוש מול הספק. בדקו את היעד ונסו שוב.');
  searchContext=context;flightSort='supplier';visibleOfferCount=12;renderVoleroOffers(data.data);
  feedback.textContent='החיפוש הושלם. התוצאות מופיעות בהמשך.';
  if(!location.hash||location.hash==='#/'){$('#live-results h2').focus({preventScroll:true});$('#live-results').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
 }catch(error){feedback.textContent=error.name==='AbortError'?cancelled?'ההמתנה לחיפוש בוטלה. אפשר לשנות פרטים ולחפש שוב.':'החיפוש ארך יותר מהצפוי. הפרטים נשמרו בטופס ואפשר לנסות שוב.':error.message;}
 finally{clearTimeout(timer);if(cancelled)button.focus();activeSearch=null;button.disabled=false;button.removeAttribute('aria-busy');button.innerHTML=icons('search')+'חפשו טיסה';}
};
$('#all-deals').onclick=()=>pages.navigate('/destinations');
document.addEventListener('click',async e=>{
 const favorite=e.target.closest('[data-favorite]');if(favorite){const id=favorite.dataset.favorite;favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];favorite.setAttribute('aria-pressed',String(favorites.includes(id)));favorite.setAttribute('aria-label',(favorites.includes(id)?'הסרת ':'שמירת ')+trips.find(t=>t.id===id).short);try{localStorage.setItem('gerbi-favorites',JSON.stringify(favorites));toast(favorites.includes(id)?'נשמר במועדפים במכשיר הזה ♡':'הוסר מהמועדפים');}catch{toast('המועדף נשמר להמשך השימוש הנוכחי בלבד');}}
 const trip=e.target.closest('[data-trip]');if(trip)openTrip(trip.dataset.trip);
 const offerButton=e.target.closest('[data-volero-offer]');if(offerButton){
  const result=state.voleroResults,offerIndex=offerButton.dataset.voleroOffer,offerContext=searchContext;
  const currentOffer=()=>state.voleroResults===result&&(!location.hash||location.hash==='#/')&&offerButton.isConnected;
  const selected=result?.offers?.find(item=>String(item.index)===offerIndex);
  if(!selected||!result.srk||!result.tokens?.searchResults){toast('החיפוש אינו תקף. חפשו שוב לקבלת הצעות עדכניות.');return;}
  offerButton.disabled=true;offerButton.textContent='בודקים מחיר…';
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
  try{
   const response=await fetch('/api/volero/flights/availability',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({srk:result.srk,offerIndex,searchToken:result.tokens.searchResults,input:{itineraryIndex:selected.flightsOverview?.[0]?.itineraryIndex??0}})});
   const data=await response.json();if(!response.ok)throw new Error('לא ניתן לאמת כרגע את ההצעה. ייתכן שהמחיר או הזמינות השתנו. חפשו מחדש או בדקו הצעה אחרת.');
   if(!currentOffer())return;
   const priced=data.data?.pricedOffer,price=offerPrice(priced),old=offerPrice(selected);
   if(!price)throw new Error('הספק לא החזיר מחיר מלא. לא ניתן לאשר את ההצעה כרגע.');
   const changed=old && (old.value!==price.value || old.currency!==price.currency);
   openModal(`<span class="dialog-kicker">תשובה עדכנית מ־Volero</span><h2>${changed?'המחיר עודכן':'בדיקת המחיר הושלמה'}</h2><p>${escapeHTML(offerContext.destination)} · ${escapeHTML(offerContext.dates)}</p><p class="micro-copy">נבדק כעת: ${escapeHTML(new Date().toLocaleString('he-IL'))}. המחיר עשוי להשתנות; לא נוצרה הזמנה.</p><div class="verified-price"><small>מחיר ההצעה לכל ${offerContext.travelers} הנוסעים</small><strong dir="ltr">${escapeHTML(formatFare(price))}</strong>${changed?`<span>בחיפוש הוצג: ${escapeHTML(formatFare(old))}</span>`:''}</div>${legMarkup(priced,data.data)}<p class="notice">לא נוצרה הזמנה. כבודה, שירותים נוספים ותנאי ביטול דורשים עיון לפני רכישה. השלמת הזמנה ותשלום עדיין אינה זמינה באתר.</p><button class="button yellow full-width" data-close-availability>חזרה להשוואת הטיסות</button>`);
   $('[data-close-availability]').onclick=()=>modal.close();
  }catch(error){if(!currentOffer())return;openModal(`<span class="dialog-kicker">בודקים שוב לפני שממשיכים</span><h2>ההצעה לא אומתה</h2><p>${escapeHTML(error.name==='AbortError'?'בדיקת הספק ארכה יותר מהצפוי. נסו שוב בעוד רגע.':error.message)}</p><button class="button secondary full-width" data-close-availability>חזרה לתוצאות</button>`);$('[data-close-availability]').onclick=()=>modal.close();}
  finally{clearTimeout(timer);offerButton.disabled=false;offerButton.textContent='בדיקת מחיר וזמינות ←';}
 }
 const info=e.target.closest('[data-info]');if(info)showInfo(info.dataset.info);
});
function openTrip(id){pages.navigate('/trip/'+id);}
function openChat(prompt=''){pages.openPlanner(prompt);}
function getMissing(){return [];}
function showInfo(type){pages.navigate(({recommendations:'/inspiration',support:'/support',account:'/account',blog:'/blog',accessibility:'/accessibility'})[type]||'/support');}
$('#prompt-form').onsubmit=e=>{e.preventDefault();openChat($('#trip-prompt').value);};
const pages=initPages({state,trips,money,icons,escapeHTML,toast,openModal,openDates,renderCards,selectFlights:()=>selectTab('flights'),
 getFavorites:()=>favorites,
 toggleFavorite(id){let persisted=true;favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];try{localStorage.setItem('gerbi-favorites',JSON.stringify(favorites));}catch{persisted=false;}renderCards();return persisted;},
 openTravelers:()=>$('#travelers-button').onclick(),
 currentPreferences,
 syncHome(){ saveStyles();$('#travelers-value').textContent=`${state.adults+state.children} נוסעים`;if(state.start&&state.end){$('#dates-value').textContent=`${shortDate(state.start)} – ${shortDate(state.end)}`;$('#dates-value').classList.remove('muted');}else{$('#dates-value').textContent='בחרו תאריכים';$('#dates-value').classList.add('muted');} }
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
window.addEventListener('hashchange',()=>{if(!location.hash||location.hash==='#/')refreshPersonalization();});
refreshPersonalization();
if(document.modelContext?.registerTool){
 const controller=new AbortController();
 try{Promise.resolve(document.modelContext.registerTool({name:'start_trip_planning',title:'תכנון חופשה עם ג׳רבי',description:'Open the local demo trip planner with a Hebrew request. Does not search live inventory or book anything.',inputSchema:{type:'object',properties:{request:{type:'string',minLength:1,maxLength:1500}},required:['request'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input.request!=='string'||!input.request.trim()||input.request.length>1500)throw new Error('A non-empty request of at most 1500 characters is required');openChat(input.request);return{mode:'demo',opened:true,missing:getMissing(state.preferences),liveAvailability:false};}},{signal:controller.signal})).catch(error=>console.warn('Optional browser planner registration unavailable:',error.message));}catch(error){console.warn('Optional browser planner registration unavailable:',error.message);}
 window.addEventListener('pagehide',()=>controller.abort(),{once:true});
}
