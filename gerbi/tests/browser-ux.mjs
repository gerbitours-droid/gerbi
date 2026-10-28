// Isolated browser regression; all supplier and learning requests are mocked.
// Set PLAYWRIGHT_MODULE to an installed Playwright module path. Run from gerbi/.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage(),errors=[],checks=[];
page.on('pageerror',error=>errors.push(error.message));
const check=name=>{checks.push(name);console.log('PASS',name);};
const go=async path=>{await page.goto((process.env.BASE_URL||'http://localhost:4173')+'/#'+path);await page.waitForFunction(()=>document.querySelector('#page-view h1')||!document.querySelector('#home').hidden);};
const dates=async()=>{await page.locator('#dates-button').click();await page.locator('#start-date').fill('2027-06-10');await page.locator('#end-date').fill('2027-06-17');await page.locator('#date-form button').click();};
await context.route('**/api/ai/feedback',r=>r.fulfill({json:{ok:true}}));
await context.route('**/api/ai/understand',r=>r.fulfill({status:503,json:{error:'fixture'}}));
try{
 await go('/destinations');
 await page.locator('[data-compare="rome"]').check();await page.locator('[data-compare="dubai"]').check();await page.reload();
 assert.ok(await page.locator('[data-compare="rome"]').isChecked());assert.ok(await page.locator('[data-compare="dubai"]').isChecked());
 await go('/compare');await page.locator('[data-uncompare="rome"]').click();await page.reload();assert.equal(await page.locator('.compare-column').count(),1);
 await go('/destinations');await page.locator('#clear-comparison').click();await page.reload();assert.equal(await page.locator('#comparison-tray').isVisible(),false);
 check('comparison add/remove/clear survive reload');
 await go('/destination/rome');await page.locator('[data-page-favorite]').click();assert.match(await page.locator('[data-page-favorite]').innerText(),/נשמר/);
 await page.locator('[data-page-favorite]').click();assert.match(await page.locator('[data-page-favorite]').innerText(),/שמירת/);
 check('favorite visible label and state update');
 await page.locator('.skip-link').evaluate(el=>el.click());assert.equal(new URL(page.url()).hash,'#/destination/rome');assert.equal(await page.evaluate(()=>document.activeElement.id),'main-content');
 check('skip link focuses main without changing route');
 await go('/');await dates();await go('/planner');await page.locator('#brief-form button').click();await page.waitForURL('**/#/results');await go('/');assert.equal(await page.locator('#dates-value').innerText(),'בחרו תאריכים');
 check('planner date reset clears home summary');
 await page.locator('[data-tab="hotels"]').click();assert.equal(await page.locator('.search-submit').innerText(),'השראה למלונות');await page.locator('.search-submit').click();await page.waitForURL('**/#/destinations?*');assert.match(await page.locator('#page-view .notice').first().innerText(),/השראה בלבד/);
 check('hotel mode carries truthful context');
 // In-app navigation retains the hotel tab selection.
 await page.evaluate(()=>location.hash='/review/rome');await page.locator('#find-trip-flight').click();await page.waitForURL('**/#/');
 await page.waitForFunction(()=>document.querySelector('[data-tab="flights"]').getAttribute('aria-selected')==='true');assert.equal(await page.locator('#destination').inputValue(),'רומא, איטליה');assert.ok(await page.locator('#modal').isVisible());await page.keyboard.press('Escape');
 check('review switches to flights and requests exact dates');
 await go('/trip/rome');await page.locator('#edit-itinerary').click();await page.locator('#itinerary-form input').first().fill('יום רגוע לבדיקת שמירה');await page.locator('#itinerary-form button').first().click();await page.locator('#trip-request').fill('בקשה לדוגמה');await page.locator('#save-trip').click();await page.reload();
 assert.match(await page.locator('#itinerary-days').innerText(),/יום רגוע לבדיקת שמירה/);assert.equal(await page.locator('#trip-request').inputValue(),'בקשה לדוגמה');
 check('edited itinerary and requests survive save and reload');
 await page.locator('#edit-itinerary').click();await page.locator('#itinerary-form input').first().fill('שמירה תוך כדי עריכת יום');
 assert.match(await page.locator('#trip-save-status').innerText(),/טרם נשמרו/);
 await page.locator('#save-trip').click();await page.reload();
 assert.match(await page.locator('#itinerary-days').innerText(),/שמירה תוך כדי עריכת יום/);
 await page.locator('#trip-request').fill('שינוי ללא שמירה');
 let warned=false;page.once('dialog',async dialog=>{warned=dialog.type()==='beforeunload';await dialog.accept();});await page.reload();assert.ok(warned);
 assert.equal(await page.locator('#trip-request').inputValue(),'בקשה לדוגמה');
 check('in-progress day edits save correctly; unsaved reload warns');
 await page.evaluate(()=>{window.originalStorageSetItem ||= Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('blocked');};});await page.locator('#trip-request').fill('לא נשמר');await page.locator('#save-trip').click();assert.match(await page.locator('#toast').innerText(),/לא הצלחנו לשמור/);
 await go('/account');await page.evaluate(()=>{window.originalStorageSetItem ||= Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('blocked');};});await page.locator('[data-remove-draft="rome"]').click();assert.equal(await page.locator('[data-remove-draft="rome"]').count(),1);
 check('blocked storage reports failure and preserves saved plan');
 await page.evaluate(()=>{Storage.prototype.setItem=window.originalStorageSetItem;});
 for(const path of ['/destination','/destination/unknown','/blog/unknown','/destinations/extra','/trip/rome/extra','/unknown']){await go(path);assert.match(await page.locator('#page-view h1').innerText(),/פנייה אחרת/);assert.equal(await page.evaluate(()=>document.activeElement.tagName),'H1');}
 check('invalid routes have recovery heading and focus');
 await context.unroute('**/api/ai/understand');await context.route('**/api/ai/understand',async r=>{await new Promise(resolve=>setTimeout(resolve,600));await r.fulfill({status:503,json:{error:'fixture'}}).catch(()=>{});});
 await go('/planner');await page.locator('#page-chat-input').fill('זוג ללא ילדים, 3 לילות עד 6000 שקל');await page.locator('#page-chat-form button').click();assert.ok(await page.locator('#brief-form button').isDisabled());await page.evaluate(()=>location.hash='/support');await page.waitForSelector('#support-form');await page.evaluate(()=>location.hash='/planner');await page.waitForFunction(()=>!document.querySelector('#brief-form button')?.disabled);
 check('in-flight planner navigation restores controls');
 const offers={offers:[{index:1,fareDetails:{totalPrice:{selling:{value:100,currency:'USD'}}}}],srk:'fixture',tokens:{searchResults:'fixture'}};
 await context.route('**/api/volero/flights/search',r=>r.fulfill({json:{data:offers}}));await context.route('**/api/volero/flights/availability',async r=>{await new Promise(resolve=>setTimeout(resolve,500));await r.fulfill({json:{data:{pricedOffer:offers.offers[0]}}}).catch(()=>{});});
 await go('/');await page.locator('#destination').fill('רומא, איטליה');await dates();await page.locator('.search-submit').click();await page.waitForSelector('[data-volero-offer]');await page.locator('[data-volero-offer]').click();await page.evaluate(()=>location.hash='/support');await page.waitForTimeout(700);assert.equal(await page.locator('#modal').isVisible(),false);
 check('late availability response cannot open dialog on another page');
 await go('/destinations');await page.locator('#destination-filter input').fill('רומא');await page.locator('#destination-filter button').click();await page.reload();
 assert.equal(await page.locator('#destination-filter input').inputValue(),'רומא');assert.equal(await page.locator('.destination-card').count(),1);
 await page.locator('.destination-price a').click();await page.locator('.back-link').click();assert.equal(await page.locator('#destination-filter input').inputValue(),'רומא');
 check('catalog search query survives reload and trip return');
 await go('/trip/rome');await page.locator('#trip-name').fill('התוכנית המקורית');await page.locator('#save-trip').click();await page.locator('#duplicate-trip').click();await page.waitForURL('**/*plan=*');await page.waitForFunction(()=>document.querySelector('#trip-name')?.value.endsWith('— עותק'));
 const copyURL=page.url();assert.match(copyURL,/plan=rome--/);await page.locator('#trip-name').fill('עותק עצמאי');await page.locator('#trip-request').fill('בקשה לעותק בלבד');await page.locator('#save-trip').click();await page.reload();
 assert.equal(await page.locator('#trip-name').inputValue(),'עותק עצמאי');
 await page.locator('a[href*="/review/rome?plan="]').click();await page.locator('.back-link').click();assert.equal(page.url(),copyURL);
 await go('/trip/rome');assert.equal(await page.locator('#trip-name').inputValue(),'התוכנית המקורית');assert.equal(await page.locator('#trip-request').inputValue(),'בקשה לדוגמה');
 check('independent plans survive reload and review navigation without overwriting original');
 await page.locator('#update-trip-brief').click();await page.locator('#trip-brief-form [name="nights"]').fill('1');await page.locator('#trip-brief-form button').click();assert.match(await page.locator('#trip-brief-error').innerText(),/אשרו/);await page.locator('#confirm-trim').check();await page.locator('#trip-brief-form button').click();assert.equal(await page.locator('.itinerary-day').count(),2);await page.locator('#save-trip').click();
 check('shortening a plan requires explicit confirmation and retains a return day');
 await page.locator('#draft-recovery').check();await page.locator('#trip-request').fill('טיוטה לשחזור אחרי סגירה');await page.reload();assert.equal(await page.locator('#trip-request').inputValue(),'טיוטה לשחזור אחרי סגירה');assert.match(await page.locator('#trip-save-status').innerText(),/טיוטה לשחזור/);await page.locator('#draft-recovery').uncheck();assert.equal(await page.evaluate(()=>localStorage.getItem('gerbi-draft-recovery-v1')),null);await page.locator('#save-trip').click();
 check('opt-in draft recovery restores edits and removes recovery data when disabled');
 await go('/account');assert.equal(await page.locator('.saved-card').count(),2);await page.locator('[data-remove-draft="rome"]').click();assert.equal(await page.locator('.saved-card').count(),1);assert.equal(await page.evaluate(()=>document.activeElement.parentElement.id),'plan-undo');await page.locator('#plan-undo button').click();assert.equal(await page.locator('.saved-card').count(),2);
 check('account deletion has a persistent focused undo action');
 await go('/trip/rome?plan=dubai--unknown');assert.match(await page.locator('h1:visible').innerText(),/פנייה אחרת/);
 check('unknown or mismatched plan keys do not silently open another plan');
 await context.unroute('**/api/volero/flights/search');await context.route('**/api/volero/flights/search',async r=>{await new Promise(resolve=>setTimeout(resolve,800));await r.fulfill({json:{data:offers}}).catch(()=>{});});
 await go('/');await page.locator('#destination').fill('רומא, איטליה');await dates();await page.locator('.search-submit').click();await page.locator('#cancel-flight-search').click();await page.waitForFunction(()=>!document.querySelector('.search-submit').disabled);assert.match(await page.locator('#search-feedback').innerText(),/בוטלה/);
 check('flight waiting can be cancelled and search becomes usable again');

 const routes=['/','/destinations','/favorites','/destination/rome','/inspiration','/planner','/results','/compare','/trip/rome','/review/rome','/account','/blog','/blog/family','/support','/privacy','/accessibility','/unknown'];
 await mkdir('verification',{recursive:true});
 for(const width of [390,768,1440]){await page.setViewportSize({width,height:900});for(const path of routes){await go(path);const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,headings:[...document.querySelectorAll('h1')].filter(el=>el.checkVisibility()).length}));assert.ok(layout.scroll<=layout.width+1,`${path} overflow at ${width}: ${layout.scroll}`);assert.equal(layout.headings,1,`${path}: h1 count`);}await go('/');await page.screenshot({path:`verification/ux-home-${width}.png`,fullPage:true});await go('/planner');await page.screenshot({path:`verification/ux-planner-${width}.png`,fullPage:true});}
 check('17 route types at 3 widths: no horizontal overflow and one h1');
 assert.deepEqual(errors,[]);check('no browser runtime errors');
 await writeFile('verification/ux-browser-results-2026-10-21.json',JSON.stringify({date:'2026-10-21',checks,runtimeErrors:errors,supplier:'mocked; no booking or live price check'},null,2));
}finally{await browser.close();}
