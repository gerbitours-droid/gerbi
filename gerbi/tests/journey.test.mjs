import {test} from 'node:test';
import assert from 'node:assert/strict';
import {restoreJourney,planDestination,applyBriefToDraft,filterTrips} from '../dist/journey.mjs';
const ids=['rome','dubai'];
test('legacy and independent plans coexist without overwriting each other',()=>{
 const original={days:['first','return'],nights:1,adults:2,children:0,request:'original'};
 const copy={...original,title:'second plan',request:'copy'};
 const {saved}=restoreJourney(JSON.stringify({saved:{rome:original,'rome--abc-123':copy,'unknown--abc':copy}}),ids);
 assert.deepEqual(Object.keys(saved),['rome','rome--abc-123']);
 assert.equal(saved.rome.request,'original');assert.equal(saved['rome--abc-123'].request,'copy');
 assert.equal(saved['rome--abc-123'].destinationId,'rome');
});
test('invalid keys and impossible saved traveler combinations are rejected or normalized',()=>{
 assert.equal(planDestination('rome--<script>',ids),null);assert.equal(planDestination('rome--',ids),null);
 const {saved}=restoreJourney(JSON.stringify({saved:{rome:{days:[],adults:9,children:6}}}),ids);
 assert.equal(saved.rome.adults+saved.rome.children,9);
});
test('changing duration preserves requests, retained edits and return day without mutation',()=>{
 const d={title:'test',nights:3,adults:2,children:0,days:['arrival','museum','beach','custom return'],request:'keep'};
 const shorter=applyBriefToDraft({},d,{nights:1,adults:1,children:1});
 assert.deepEqual(shorter.days,['arrival','custom return']);assert.equal(shorter.request,'keep');assert.equal(d.days.length,4);
 const longer=applyBriefToDraft({},d,{nights:5,adults:2,children:0});
 assert.deepEqual(longer.days.slice(0,3),d.days.slice(0,3));assert.equal(longer.days.at(-1),'custom return');assert.equal(longer.days.length,6);
});
test('destination search includes country metadata',()=>{
 assert.equal(filterTrips([{name:'Roma',country:'Italy',style:'city',categories:['city'],price:1}],{query:'Italy'}).length,1);
});
