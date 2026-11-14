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
 const navigate=async hash=>{if(w.location.hash===hash)return;const changed=new Promise(resolve=>w.addEventListener('hashchange',resolve,{once:true}));w.location.hash=hash;await changed;};
 const followLink=async selector=>{const changed=new Promise(resolve=>w.addEventListener('hashchange',resolve,{once:true}));click(selector);await changed;};
 return {w,q,click,input,navigate,followLink,close:()=>w.close(),copied:()=>copied,scroll:()=>scroll};
}
test('home, three entry links, direct routes, tab switches, unknown route',async()=>{
 const s=await setup();try{
 assert.equal(s.w.document.querySelectorAll('.word-entry').length,0);assert.ok(s.q('#open-dictionary'));assert.equal(s.q('.search-panel'),null);
 s.click('#open-dictionary');await tick();assert.equal(s.w.document.querySelectorAll('.word-entry').length,3);assert.equal(s.q('.hero'),null);
 s.click('.word-entry.kazoku');await tick();assert.match(s.q('h1').textContent,/家族/);
 for(const key of ['ai','jiyuu','kazoku']){await s.navigate('#/'+key);assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,18);assert.ok(s.q('.definition-text').textContent);}
 await s.navigate('#/not-a-page');assert.match(s.q('main').textContent,/ページが見つかりません/);
 }finally{s.close();}
});
test('live search, empty state, clear, category filtering and category expansion',async()=>{
 const s=await setup({hash:'#/ai'});try{
 s.input('#response-query','執着');assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,1);
 s.input('#response-query','ZZZZZZ');assert.match(s.q('#response-list').textContent,/該当する回答が見つかりませんでした/);
 s.click('#clear-search');assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,18);
 s.click('[data-category="unconditional"]');assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,3);
 s.click('[data-category=""]');assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,18);
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
test('search is separate from catalogue and supports names, keywords and clearing',async()=>{
 const s=await setup({hash:'#/contents'});try{
 assert.equal(s.q('#home-search'),null);assert.equal(s.q('.search-panel'),null);assert.equal(s.q('.about-teaser'),null);
 assert.equal(s.q('.site-header [data-nav="search"]').textContent,'検索');assert.equal(s.q('.site-header a[href="#/people"]'),null);
 s.click('.site-header [data-nav="search"]');await tick();
 assert.match(s.q('h1').textContent,/検索/);assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,0);
 s.input('#response-query',fixture.respondents[0].name);assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,3);
 s.input('#response-query','かぞく');assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,0);assert.equal(s.q('.search-entry').getAttribute('href'),'#/kazoku');
 s.click('.search-entry');await tick();assert.equal(s.w.location.hash,'#/kazoku');assert.equal(s.scroll(),0);
 s.w.history.back();await tick();assert.equal(s.q('#response-query').value,'かぞく');assert.ok(s.q('.search-entry'));
 s.click('#clear-search');assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,0);assert.equal(s.q('.search-placeholder'),null);assert.equal(s.q('#response-list').textContent,'');
 }finally{s.close();}
});
test('browser history restores category, query and scroll',async()=>{
 const s=await setup({hash:'#/ai'});try{
 s.input('#response-query','見返り');s.click('[data-category="unconditional"]');s.w.scrollTo({top:900});s.w.dispatchEvent(new s.w.Event('scroll'));
 s.click('.word-tabs a[data-word="jiyuu"]');await tick();s.w.history.back();await tick();
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
 s.click('#reader-tab-overview');s.click('[data-category-id="attachment"] > summary');assert.equal(s.q('#reader-panel-overview').hidden,false);assert.equal(s.q('[data-category-id="attachment"]').querySelectorAll('.response-card').length,1);
 await s.navigate('#/kazoku?person=p01');assert.equal(s.q('#reader-panel-answers').hidden,false);assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,1);
 s.click('#reader-tab-overview');s.q('#reader-tab-overview').dispatchEvent(new s.w.KeyboardEvent('keydown',{key:'End',bubbles:true}));assert.equal(s.q('#reader-panel-analysis').hidden,false);assert.equal(s.w.document.activeElement.id,'reader-tab-analysis');
 }finally{s.close();}
});

test('category index starts compact and expands only the selected category',async()=>{
 const s=await setup({hash:'#/ai'});try{
 const items=[...s.w.document.querySelectorAll('.category-row')];assert.equal(items.length,7);
 assert.equal(items.filter(el=>el.open).length,0);
 s.click('[data-category-id="care"] > summary');await tick();assert.equal(items[0].open,true);
 s.click('[data-category-id="connection"] > summary');await tick();assert.equal(items[0].open,false);assert.equal(items.filter(el=>el.open).length,1);
 s.click('[data-category-id="attachment"] > summary');await tick();
 assert.equal(s.q('#reader-panel-overview').hidden,false);assert.equal(s.q('[data-category-id="attachment"]').querySelectorAll('.response-card').length,1);
 }finally{s.close();}
});

test('all three word buttons reset scroll on revisits and repeated current-word clicks',async()=>{
 const s=await setup({hash:'#/kazoku'});try{
 for(const key of ['ai','jiyuu','kazoku','ai','ai']){
  s.w.scrollTo({top:700});s.w.dispatchEvent(new s.w.Event('scroll'));
  s.click(`.word-tabs a[href="#/${key}"]`);await tick();
  assert.equal(s.w.location.hash,'#/'+key);assert.equal(s.scroll(),0);
 }
 }finally{s.close();}
});


test('every category contains all its original answers and names without a representative subset or shortcut',async()=>{
 const s=await setup();try{
 for(const word of fixture.editorial.words){
  await s.navigate('#/'+word.id);
  assert.equal(s.q('[data-open-category]'),null);
  assert.equal(s.q('.category-list').textContent.includes('代表的な回答'),false);
  for(const category of word.categories){
   const row=s.q(`[data-category-id="${category.id}"]`);
   const cards=[...row.querySelectorAll('.category-responses .response-card')];
   assert.equal(cards.length,category.responseIds.length);
   for(const [index,id] of category.responseIds.entries()){
    const answer=fixture.responses.find(r=>r.id===id);
    const author=fixture.respondents.find(p=>p.id===answer.respondentId);
    assert.equal(cards[index].querySelector('blockquote').textContent,answer.text);
    assert.equal(cards[index].querySelector('.response-meta > a').textContent,author.name);
   }
  }
 }
 }finally{s.close();}
});


test('contents stays text-only while entry illustrations use subpath-safe URLs',async()=>{
 const s=await setup({hash:'#/contents'});try{
 assert.equal(s.q('.contents-page img'),null);
 assert.equal(s.q('[data-nav="home"]').textContent,'辞典の目次');
 assert.equal(s.q('[data-nav="home"]').getAttribute('href'),'#/contents');
 for(const word of fixture.editorial.words){
  await s.navigate('#/'+word.id);
  assert.equal(s.q('.detail-illustration img').src,`https://example.test/dictionary/assets/illustrations/${word.id}.webp`);
  assert.equal(s.q('.detail-illustration img').getAttribute('loading'),'eager');
 }
 await s.navigate('#/');assert.equal(s.q('.word-illustration'),null);
 }finally{s.close();}
});


test('word changes preserve the reading panel and reset word-specific filters',async()=>{
 const s=await setup({hash:'#/ai?category=care&q=大切'});try{
 for(const key of ['kazoku','jiyuu','ai']){
  assert.equal(s.q('#reader-panel-answers').hidden,false);
  s.click(`.word-tabs [data-word="${key}"]`);await tick();
  assert.equal(s.w.location.hash,`#/${key}?view=answers`);
  assert.equal(s.q('#reader-panel-answers').hidden,false);assert.equal(s.q('#reader-panel-overview').hidden,true);
  assert.equal(s.w.document.querySelectorAll('#response-list .response-card').length,18);
 }
 s.click('#reader-tab-analysis');s.click('.word-tabs [data-word="kazoku"]');await tick();
 assert.equal(s.w.location.hash,'#/kazoku?view=analysis');assert.equal(s.q('#reader-panel-analysis').hidden,false);
 s.w.history.back();await tick();assert.equal(s.w.location.hash,'#/ai?view=analysis');assert.equal(s.q('#reader-panel-analysis').hidden,false);
 s.click('#reader-tab-overview');s.click('.word-tabs [data-word="jiyuu"]');await tick();
 assert.equal(s.w.location.hash,'#/jiyuu');assert.equal(s.q('#reader-panel-overview').hidden,false);
 }finally{s.close();}
});


test('four main navigation links distinguish contents from word pages and return to the last word view',async()=>{
 const s=await setup({hash:'#/contents'});try{
 assert.deepEqual([...s.w.document.querySelectorAll('.site-header nav a')].map(a=>a.textContent),['辞典の目次','言葉','検索','この辞典について']);
 assert.equal(s.q('.site-header nav [aria-current]').dataset.nav,'home');
 await s.followLink('[data-nav="words"]');assert.equal(s.w.location.hash,'#/kazoku');
 assert.equal(s.q('.site-header nav [aria-current]').dataset.nav,'words');assert.equal(s.q('[data-nav="home"]').hasAttribute('aria-current'),false);
 await s.navigate('#/ai?view=answers');await s.followLink('[data-nav="search"]');assert.equal(s.q('.site-header nav [aria-current]').dataset.nav,'search');
 await s.followLink('[data-nav="words"]');assert.equal(s.w.location.hash,'#/ai?view=answers');assert.equal(s.q('#reader-panel-answers').hidden,false);
 await s.followLink('[data-nav="about"]');assert.equal(s.q('.site-header nav [aria-current]').dataset.nav,'about');
 await s.followLink('[data-nav="home"]');assert.equal(s.q('.site-header nav [aria-current]').dataset.nav,'home');
 await s.navigate('#/');assert.equal(s.q('.site-header nav').hidden,true);
 }finally{s.close();}
});
