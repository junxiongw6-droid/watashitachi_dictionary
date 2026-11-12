import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {filterResponses,categoryCounts,parseRoute,escapeHTML,normalize,inspectData} from '../js/core.mjs';
const data=JSON.parse(readFileSync(new URL('../data/dictionary.json',import.meta.url)));
test('all 54 original responses are discoverable',()=>assert.equal(filterResponses(data).length,54));
test('each word and every primary category have exact counts',()=>{
 for(const w of data.editorial.words){const counts=categoryCounts(data,w);assert.equal(counts.reduce((a,c)=>a+c.count,0),18);for(const c of counts)assert.equal(filterResponses(data,{wordId:w.id,category:c.id}).length,c.count);}
});
test('Japanese content, names, word reading and combined terms are searchable',()=>{
 assert.equal(filterResponses(data,{query:data.respondents[0].name}).length,3);
 assert.equal(filterResponses(data,{query:'執念、執着'}).length,1);
 assert.equal(filterResponses(data,{query:'かぞく'}).length,18);
 assert.equal(filterResponses(data,{query:data.respondents[0].name+' 愛'}).length,1);
 assert.equal(filterResponses(data,{query:'absolutely-no-match'}).length,0);
 assert.equal(normalize(' ＡＢＣ　１２ '),'abc 12');
});
test('category, word, person and query intersect',()=>assert.equal(filterResponses(data,{wordId:'ai',category:'attachment',personId:'p01',query:'執着'}).length,1));
test('person view preserves three answers and exact original whitespace',()=>{
 assert.equal(filterResponses(data,{personId:'p07'}).length,3);
 assert.ok(filterResponses(data,{personId:'p07',wordId:'ai'})[0].text.startsWith('    '));
});
test('URL hash query supports direct entry links',()=>{const r=parseRoute('#/kazoku?q=%E7%B5%86&category=support');assert.equal(r.path,'/kazoku');assert.equal(r.params.get('q'),'絆');assert.equal(parseRoute('').path,'/');});
test('all displayed text is HTML escaped',()=>assert.equal(escapeHTML('<script>"&\''),'&lt;script&gt;&quot;&amp;&#39;'));
test('incomplete classification warns without hiding responses',()=>{const copy=structuredClone(data);copy.editorial.words[0].categories=[];assert.equal(inspectData(copy).length,1);assert.equal(filterResponses(copy,{wordId:'kazoku'}).length,18);});
test('missing category list is recoverable',()=>{const copy=structuredClone(data);delete copy.editorial.words[0].categories;assert.ok(inspectData(copy).length);assert.deepEqual(copy.editorial.words[0].categories,[]);});
test('malformed top-level data is rejected clearly',()=>assert.throws(()=>inspectData({}),/形式/));
