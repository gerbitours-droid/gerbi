import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rankInspirations} from '../dist/personalization.mjs';
import {parsePreferences,rankDemoTrips} from '../dist/planner.mjs';
import {scoreDestinations,extractSignals} from '../backend/understanding.mjs';
import {restoreJourney} from '../dist/journey.mjs';
import {offerPrice,formatFare,sortFacts} from '../dist/flight-view.mjs';
import {trips} from '../dist/data.mjs';

test('explicit styles actually change ordering and produce grounded reasons',()=>{
 const city=rankInspirations(trips,{city:true});
 assert.equal(city[0].trip.id,'rome');assert.ok(city[0].reasons.includes('אוכל ותרבות'));
 const beach=rankInspirations(trips,{relaxation:true});
 assert.equal(beach[0].trip.id,'santorini');assert.ok(beach[0].reasons.includes('להוריד הילוך'));
 assert.equal(rankInspirations(trips,{family:true})[0].trip.id,'dubai');
});
test('hard budget constraint wins over all style matches',()=>{
 assert.deepEqual(rankInspirations(trips,{beach:true,adults:2,budget:100}),[]);
 const ranked=rankInspirations(trips,{family:true,adults:2,children:2,budget:12000});
 assert.ok(ranked.every(x=>x.total<=12000));
});
test('explicit deselection overrides inferred tags and follow-up negation',()=>{
 const p=parsePreferences('בלי ים וללא ילדים',{beach:true,family:true,children:2,tags:['beach','family']});
 assert.equal(p.beach,false);assert.equal(p.family,false);assert.equal(p.children,0);
 assert.ok(rankInspirations(trips,p).every(x=>!x.reasons.includes('ים ובריכה')));
});
test('Hebrew word boundaries do not infer beach from children',()=>{
 assert.notEqual(parsePreferences('זוג ללא ילדים, אוכל ותרבות').beach,true);
 assert.equal(extractSignals('זוג ללא ילדים, אוכל ותרבות').tags.includes('beach'),false);
 assert.equal(extractSignals('זוג ללא ילדים').tags.includes('family'),false);
 assert.equal(extractSignals('ים ובריכה').tags.includes('beach'),true);
});
test('client and server share candidate order and totals',()=>{
 const p={adults:2,children:1,nights:6,budget:18000,city:true};
 assert.deepEqual(scoreDestinations(trips,p).map(x=>[x.destination.id,x.estimate]),rankDemoTrips(trips,p).map(x=>[x.trip.id,x.total]));
});
test('style preferences survive validated journey restoration; raw chat is not restored',()=>{
 const p=restoreJourney(JSON.stringify({brief:{city:true,relaxation:true,text:'private',adults:99}}),trips.map(t=>t.id));
 assert.equal(p.brief.city,true);assert.equal(p.brief.relaxation,true);assert.equal(p.brief.adults,2);assert.equal('text' in p.brief,false);
});
const offer=(value,currency='USD')=>({fareDetails:{totalPrice:{selling:{value,currency}}}});
test('fares use supplier selling price and never invent a currency or price',()=>{
 assert.deepEqual(offerPrice(offer(155.32)),{value:155.32,currency:'USD'});
 assert.equal(offerPrice(offer(-1)),null);assert.equal(offerPrice({}),null);
 assert.equal(offerPrice(offer('155')),null);assert.equal(formatFare(null),'מחיר אינו זמין');
});
test('price ordering handles missing fares and leaves mixed currencies incomparable',()=>{
 const fact=o=>({price:offerPrice(o),totalMinutes:null}),a=fact(offer(100)),b=fact(offer(20)),missing=fact({});
 assert.deepEqual(sortFacts([a,missing,b],'price'),[b,a,missing]);
 const eur=fact(offer(10,'EUR'));assert.deepEqual(sortFacts([a,eur],'price'),[a,eur]);
});
