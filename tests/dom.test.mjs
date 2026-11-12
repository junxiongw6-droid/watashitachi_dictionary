import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
const file=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const fixture=JSON.parse(file('../data/dictionary.json'));
const tick=()=>new Promise(resolve=>setTimeout(resolve,10));
async function setup({hash='#/',data=structuredClone(fixture),fail=false,clipboard=true}={}){
 const dom=new JSDOM(file('../index.html'),{url:'https://example.test/dictionary/'+hash,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;let copied='',scroll=0;
 w.fetch=async()=>({ok:!fail,status:fail?404:200,json:async()=>data});
 w.matchMedia=()=>({matches:true});
 w.scrollTo=opts=>{scroll=opts.top;Object.defineProperty(w,'scrollY',{value:scroll,configurable:true});};
 w.HTMLElement.prototype.scrollIntoView=function(){scroll=1000;};
 if(clipboard)Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async value=>{copied=value;}}});
 const context=dom.getInternalVMContext();
 const core=new vm.SourceTextModule(file('../js/core.mjs'),{context});
 const app=new vm.SourceTextModule(file('../js/app.js'),{context,initializeImportMeta:meta=>meta.url='https://example.test/dictionary/js/app.js'});
 await app.link(()=>core);await app.evaluate();await tick();
 const q=s=>w.document.querySelector(s);
 const click=s=>{assert.ok(q(s),`Missing ${s}`);q(s).click();};
 const input=(s,text)=>{q(s).value=text;q(s).dispatchEvent(new w.Event('input',{bubbles:true}));};
 const navigate=async hash=>{w.location.hash=hash;await tick();};
 return {w,q,click,input,navigate,close:()=>w.close(),copied:()=>copied,scroll:()=>scroll};
}
test('home, three entry links, direct routes, tab switches, unknown route',async()=>{
 const s=await setup();try{
 assert.equal(s.w.document.querySelectorAll('.word-entry').length,3);
 s.click('.word-entry.kazoku');await tick();assert.match(s.q('h1').textContent,/家族/);
 for(const key of ['ai','jiyuu','kazoku']){await s.navigate('#/'+key);assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,18);assert.ok(s.q('.definition-text').textContent);}
 await s.navigate('#/not-a-page');assert.match(s.q('main').textContent,/ページが見つかりません/);
 }finally{s.close();}
});
test('live search, empty state, clear, category filtering and representative expansion',async()=>{
 const s=await setup({hash:'#/ai'});try{
 s.input('#response-query','執着');assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,1);
 s.input('#response-query','ZZZZZZ');assert.match(s.q('#response-list').textContent,/該当する回答が見つかりませんでした/);
 s.click('#clear-search');assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,18);
 s.click('[data-category="unconditional"]');assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,3);
 s.click('[data-category=""]');assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,18);
 s.click('[data-open-category="attachment"]');assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,1);assert.equal(s.q('#response-query').value,'');
 assert.equal(s.w.document.querySelector('details').open,false);s.click('summary');assert.equal(s.w.document.querySelector('details').open,true);
 }finally{s.close();}
});
test('respondent selector and missing answer fallback',async()=>{
 const data=structuredClone(fixture);data.responses=data.responses.filter(r=>r.id!=='p01-ai');
 const s=await setup({hash:'#/people?id=p01',data});try{
 assert.match(s.q('.person-answers').textContent,/回答なし/);
 const select=s.q('#person-select');select.value='p07';select.dispatchEvent(new s.w.Event('change',{bubbles:true}));await tick();
 assert.equal(s.w.document.querySelectorAll('.person-answers .response-card').length,3);
 assert.equal(s.q('.person-answers blockquote').textContent,'    血がつながっている人');
 }finally{s.close();}
});
test('home search and realtime global search',async()=>{
 const s=await setup();try{
 s.q('#home-query').value=fixture.respondents[0].name;s.q('#home-search').dispatchEvent(new s.w.Event('submit',{bubbles:true,cancelable:true}));await tick();
 assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,3);
 s.input('#response-query','かぞく');assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,18);
 }finally{s.close();}
});
test('random answer always comes from the source and changes on click',async()=>{
 const s=await setup();try{
 const first=s.q('#random-content blockquote').textContent;s.click('#random');const next=s.q('#random-content blockquote').textContent;
 assert.notEqual(first,next);assert.ok(fixture.responses.some(r=>r.text===next));
 }finally{s.close();}
});
test('share API copies exact URL including filters',async()=>{
 const s=await setup({hash:'#/kazoku?q=絆'});try{s.click('#share');await tick();assert.equal(s.copied(),s.w.location.href);assert.match(s.q('#toast').textContent,/コピーしました/);}finally{s.close();}
});
test('clipboard fallback selects real URL and can close',async()=>{
 const s=await setup({hash:'#/jiyuu',clipboard:false});try{s.click('#share');await tick();assert.equal(s.q('#share-url').value,s.w.location.href);assert.equal(s.w.document.activeElement.id,'share-url');s.click('#close-share');assert.equal(s.q('#share-fallback'),null);}finally{s.close();}
});
test('browser history restores category, query and scroll',async()=>{
 const s=await setup({hash:'#/ai'});try{
 s.input('#response-query','見返り');s.click('[data-category="unconditional"]');s.w.scrollTo({top:900});s.w.dispatchEvent(new s.w.Event('scroll'));
 s.click('.word-tabs a[href="#/jiyuu"]');await tick();s.w.history.back();await tick();
 assert.equal(s.q('#response-query').value,'見返り');assert.equal(s.q('[data-category="unconditional"]').getAttribute('aria-pressed'),'true');assert.equal(s.scroll(),900);
 s.click('#top');assert.equal(s.scroll(),0);
 }finally{s.close();}
});
test('JSON failure has recoverable retry and no fake responses',async()=>{
 const s=await setup({fail:true});try{assert.match(s.q('main').textContent,/辞典を読み込めませんでした/);assert.ok(s.q('#retry'));assert.equal(s.w.document.querySelectorAll('.response-card').length,0);s.click('#retry');await tick();assert.ok(s.q('#retry'));}finally{s.close();}
});
test('zero responses, missing categories, long HTML-like text remain readable',async()=>{
 const data=structuredClone(fixture);data.responses=data.responses.filter(r=>r.wordId!=='ai');data.editorial.words[0].categories=[];
 data.responses[0].text='<img src=x onerror=alert(1)>'+ '長い回答'.repeat(1000);
 const s=await setup({hash:'#/kazoku',data});try{
 assert.ok(s.q('.data-warning'));assert.equal(s.q('#response-list img'),null);assert.equal(s.q('#response-list blockquote').textContent,data.responses[0].text);
 await s.navigate('#/ai');assert.match(s.q('#result-count').textContent,/0 件/);assert.match(s.q('#response-list').textContent,/該当する回答/);
 }finally{s.close();}
});
test('fast route changes finish on the last requested word',async()=>{
 const s=await setup();try{for(const key of ['kazoku','ai','jiyuu','kazoku','jiyuu'])s.w.location.hash='#/'+key;await tick();assert.match(s.q('h1').textContent,/自由/);assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,18);}finally{s.close();}
});

test('entry panels reveal one reading group and preserve filters across panel and history changes',async()=>{
 const s=await setup({hash:'#/ai'});try{
 assert.equal(s.q('#reader-panel-overview').hidden,false);assert.equal(s.q('#reader-panel-answers').hidden,true);assert.equal(s.q('#reader-panel-analysis').hidden,true);
 s.click('#reader-tab-answers');assert.equal(s.q('#reader-panel-answers').hidden,false);assert.equal(s.q('#reader-panel-overview').hidden,true);
 s.input('#response-query','見返り');assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,2);
 s.click('#reader-tab-analysis');assert.equal(s.q('#reader-panel-analysis').hidden,false);
 s.w.history.back();await tick();assert.equal(s.q('#reader-panel-answers').hidden,false);assert.equal(s.q('#response-query').value,'見返り');
 s.click('#reader-tab-overview');s.click('[data-open-category="attachment"]');assert.equal(s.q('#reader-panel-answers').hidden,false);assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,1);
 await s.navigate('#/kazoku?person=p01');assert.equal(s.q('#reader-panel-answers').hidden,false);assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,1);
 s.click('#reader-tab-overview');s.q('#reader-tab-overview').dispatchEvent(new s.w.KeyboardEvent('keydown',{key:'End',bubbles:true}));assert.equal(s.q('#reader-panel-analysis').hidden,false);assert.equal(s.w.document.activeElement.id,'reader-tab-analysis');
 }finally{s.close();}
});
