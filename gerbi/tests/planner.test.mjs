import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parsePreferences,rankDemoTrips,validDateRange} from '../dist/planner.mjs';
import {createServer} from '../server.mjs';
test('Hebrew family request extracts budget, travelers, dates and restrictions',()=>{
 const p=parsePreferences('אנחנו זוג עם שני ילדים, רוצים שבוע באוגוסט, יעד עם ים ובריכה, עד 18 אלף שקל, טיסה ישירה ועדיף לא לקום מוקדם.');
 assert.equal(p.budget,18000);assert.equal(p.adults,2);assert.equal(p.children,2);assert.equal(p.nights,7);assert.equal(p.month,'אוגוסט');assert.equal(p.direct,true);assert.equal(p.lateFlight,true);
});
test('Follow-up preserves prior preferences and updates budget',()=>{
 const p=parsePreferences('תוריד את המחיר עד 12 אלף',parsePreferences('זוג, שבוע באוגוסט עד 18000 שקל'));
 assert.equal(p.budget,12000);assert.equal(p.nights,7);assert.equal(p.adults,2);assert.equal(p.cheaper,true);
});
test('Ranking excludes unaffordable demo trips instead of fabricating options',()=>{
 const trips=[{id:'a',nights:5,price:1000},{id:'b',nights:5,price:3000}];
 assert.equal(rankDemoTrips(trips,{adults:2,children:2,budget:5000})[0].total,4000);
 assert.equal(rankDemoTrips(trips,{adults:2,children:2,budget:5000}).length,1);
 assert.deepEqual(rankDemoTrips(trips,{adults:2,budget:100}),[]);
});
test('Dates reject past departure and reversed/same-day ranges',()=>{
 assert.equal(validDateRange('2026-10-07','2026-10-12','2026-10-05'),true);
 assert.equal(validDateRange('2026-10-04','2026-10-12','2026-10-05'),false);
 assert.equal(validDateRange('2026-10-07','2026-10-07','2026-10-05'),false);
});
test('Server serves app and refuses secret paths or fake provider availability',async()=>{
 const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 try{
  assert.equal((await fetch(base)).status,200);
  assert.match((await fetch(base+'/planner.mjs')).headers.get('content-type'),/javascript/);
  for(const route of ['/.env','/../.env','/%2eenv','/server.mjs']) assert.equal((await fetch(base+route)).status,404);
  const response=await fetch(base+'/api/revalidate',{method:'POST'});assert.equal(response.status,503);assert.equal((await response.json()).error,'provider_not_connected');
  const status=await(await fetch(base+'/api/status')).json();assert.equal(status.connected,false);assert.equal(status.mode,'demo');assert.equal('secret' in status,false);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
