import {escapeHTML as e, filterResponses, categoryCounts, parseRoute, inspectData} from './core.mjs';
const main=document.querySelector('main');
let data, warnings=[], route, previousHash='', lastRandom='';
const positions=new Map();
const titles={kazoku:'家族',ai:'愛',jiyuu:'自由'};
const wordLink=w=>`#/${w.id}`;
const person=id=>data.respondents.find(p=>p.id===id);
const response=id=>data.responses.find(r=>r.id===id);
const announce=text=>document.querySelector('#announcement').textContent=text;
function toast(text) {const el=document.querySelector('#toast');el.textContent=text;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,3500);}
function evidence(ids=[]) {return `<div class="evidence"><span>根拠となる回答</span>${ids.map(id=>{const r=response(id); return r?`<a href="#/${r.wordId}?person=${r.respondentId}">${e(person(r.respondentId)?.name || '回答者')} ↗</a>`:'';}).join('')}</div>`;}
function responseCard(r, showWord=false) {
  const w=data.editorial.words.find(w=>w.id===r.wordId);
  const c=w?.categories.find(c=>c.responseIds?.includes(r.id));
  return `<article class="response-card" data-record="${e(r.id)}"><div class="response-meta"><a href="#/people?id=${r.respondentId}">${e(person(r.respondentId)?.name || '回答者')}</a><span>${showWord?`<a href="#/${r.wordId}">${e(w?.title)}</a> · `:''}${e(c?.title || '分類情報なし')}</span></div><blockquote>${e(r.text)}</blockquote>${(data.editorial.tags?.[r.id] || []).length?`<div class="tags">${data.editorial.tags[r.id].map(t=>`<span>${e(t)}</span>`).join('')}</div>`:''}${data.editorial.notes?.[r.id]?`<p class="editor-note">編者注：${e(data.editorial.notes[r.id])}</p>`:''}<small class="record">記録 ${e(r.id)}</small></article>`;
}
function randomCard() {
  const candidates=data.responses.filter(r=>r.id!==lastRandom);
  const r=candidates[Math.floor(Math.random()*candidates.length)] || data.responses[0];
  if (!r) return '<p>まだ回答がありません。</p>';
  lastRandom=r.id;
  return `<a class="random-word" href="#/${r.wordId}">${e(titles[r.wordId])} <span>について</span></a><blockquote>${e(r.text)}</blockquote><a class="random-person" href="#/people?id=${r.respondentId}">— ${e(person(r.respondentId)?.name || '回答者')}</a>`;
}
function home() {
 return `<section class="hero"><div class="hero-copy"><p class="eyebrow"><span></span> A DICTIONARY WOVEN BY US</p><h1>私たちの<br>言葉辞典<span class="title-dot">。</span></h1><p class="hero-subtitle">家族・愛・自由</p><div class="hero-intro"><p>同じ言葉でも、<br>思い浮かべる景色は一人ひとり違う。</p><p>クラスのみんなが、自分の言葉で綴った<br class="desktop-break">小さな辞典です。</p></div><a class="text-link" href="#entries">言葉のページへ <span>↓</span></a></div><div class="hero-art" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="vertical-line"></div><p class="vertical-poem">言葉の向こうに、<br>一人ひとりの景色。</p><span class="red-seal">私たち<br>の言葉</span><span class="art-caption">${data.respondents.length}人の声、三つの言葉。</span></div><div class="hero-foot"><span>日本語クラス 共同編纂プロジェクト</span><span>${data.respondents.length}人の声 <i>／</i> ${data.responses.length}の回答 <i>／</i> 3つの言葉</span></div></section>
 <section class="entries" id="entries"><div class="section-top"><div><p class="eyebrow">THE THREE WORDS</p><h2>言葉をひらく</h2></div><p>あなたにとって、どんな意味ですか。</p></div><div class="word-grid">${data.editorial.words.map(w=>`<a class="word-entry ${w.id}" href="${wordLink(w)}"><div class="entry-top"><span>第${w.number}章</span><span>${String(data.responses.filter(r=>r.wordId===w.id).length).padStart(2,'0')} の声</span></div><div class="entry-title"><h3>${w.title}</h3><span>${w.reading}</span></div><p>${e(w.intro)}</p><div class="entry-bottom"><span>この言葉を読む</span><span class="circle-arrow">↗</span></div></a>`).join('')}</div></section>
 <section class="explore-section"><div class="search-panel"><p class="eyebrow">FIND A VOICE</p><h2>気になる言葉から探す</h2><p>言葉や回答者の名前を、ひとつ。</p><form id="home-search"><label class="sr-only" for="home-query">キーワード・回答者名</label><div class="search-input"><span aria-hidden="true">⌕</span><input id="home-query" name="q" placeholder="キーワード・回答者名" type="search"><button type="submit">探す ↗</button></div></form><a class="text-link" href="#/people">回答者から探す <span>↗</span></a></div><div class="random-panel"><div class="random-heading"><p class="eyebrow">A LITTLE DISCOVERY</p><button class="quiet-button" id="random">もうひとこと ↻</button></div><h2>今日のひとこと</h2><div id="random-content" aria-live="polite">${randomCard()}</div></div></section>
 <section class="about-teaser"><span class="small-seal">編</span><div><h2>辞書を編むことは、<br>お互いを知ること。</h2><p>集め、比べ、意味を見つける。<br>一人ひとりの答えを残しながら、私たちなりの定義を編みました。</p><a class="text-link" href="#/about">この辞典ができるまで <span>↗</span></a></div></section>`;
}
function filterBar(word) {
 const counts=categoryCounts(data,word);
 return `<div class="filter-chips" role="group" aria-label="意味の分類で絞り込む"><button data-category="" aria-pressed="${!route.params.get('category')}">すべて表示</button>${counts.map(c=>`<button data-category="${e(c.id)}" aria-pressed="${route.params.get('category')===c.id}">${e(c.title)} <span>${c.count}</span></button>`).join('')}</div>`;
}
function searchInput() {
 return `<label class="field-label" for="response-query">キーワード・回答者名で検索</label><div class="search-input"><span aria-hidden="true">⌕</span><input type="search" id="response-query" value="${e(route.params.get('q') || '')}" placeholder="回答の中の言葉を探す"><button id="clear-search" aria-label="検索と絞り込みをクリア">クリア</button></div>`;
}
function wordPage(w) {
 const counts=categoryCounts(data,w), total=data.responses.filter(r=>r.wordId===w.id).length;
 const index=data.editorial.words.indexOf(w);
 return `<div class="page-wrap"><div class="breadcrumb"><a href="#/">辞典の表紙</a><span>／</span><span>${w.title}</span></div><header class="word-header"><div><p class="eyebrow">第${w.number}章 <span>—</span> ${total}人の言葉から</p><h1>${w.title}<span>${w.reading}</span></h1><p>${e(w.intro)}</p></div><button class="quiet-button share" id="share">リンクをコピー ↗</button></header><nav class="word-tabs" aria-label="言葉の切り替え">${data.editorial.words.map(other=>`<a href="#/${other.id}" ${other.id===w.id?'aria-current="page"':''}>${other.title}<small>${other.reading}</small></a>`).join('')}</nav>
 <section class="definition"><p class="section-label">01 <span>私たちの定義</span></p><p class="definition-text">${e(w.definition)}</p><p class="editor-caption">${e(data.editorial.notice)}</p></section>
 <section class="content-section"><div class="section-top"><div><p class="section-label">02 <span>意味のまとまり</span></p><h2>同じ言葉、さまざまな輪郭。</h2></div><p>主分類は一人につき一つ</p></div><p class="section-description">${e(data.editorial.method)}</p><div class="category-list">${counts.map((c,i)=>`<article class="category-row"><button class="category-button" data-open-category="${e(c.id)}"><span class="category-number">${String(i+1).padStart(2,'0')}</span><span class="category-info"><strong>${e(c.title)}</strong><span>${e(c.description)}</span><span class="bar-track"><span style="width:${total?c.count/total*100:0}%"></span></span></span><span class="category-count">${c.count}<small>人</small><span>回答を読む ↗</span></span></button><details><summary>代表的な回答・所属回答者</summary><div class="representatives">${(c.representativeIds || []).map(id=>response(id)?responseCard(response(id)):'').join('')}</div><p class="member-list">所属回答者：${(c.responseIds || []).map(id=>{const r=response(id);return r?e(person(r.respondentId)?.name || '回答者'):'';}).join('、')}</p></details></article>`).join('') || '<p>分類情報は準備中です。下の原文をお読みください。</p>'}</div></section>
 <section class="content-section" id="responses"><div class="section-top"><div><p class="section-label">03 <span>みんなの回答</span></p><h2>一人ひとりの言葉を、そのままに。</h2></div><span class="total-badge">全 ${total} 件</span></div><p class="section-description">表記や空白を含め、回答原文をそのまま掲載しています。</p>${searchInput()}${filterBar(w)}<div id="person-filter"></div><p id="result-count" class="result-count" aria-live="polite"></p><div id="response-list" class="response-list"></div></section>
 <section class="analysis-grid content-section"><div><p class="section-label">04 <span>共通点と違い</span></p><h2>${e(w.common.title)}</h2><p>${e(w.common.text)}</p>${evidence(w.common.evidenceIds)}</div><aside><span class="large-quote" aria-hidden="true">“</span><p>違いを残すことで、<br>言葉の意味が<br>少し、広くなる。</p></aside></section>
 <section class="content-section"><p class="section-label">05 <span>新しい発見</span></p><div class="discovery-grid">${w.discoveries.map(d=>`<article><span class="discovery-star" aria-hidden="true">✳</span><h2>${e(d.title)}</h2><p>${e(d.text)}</p>${evidence(d.evidenceIds)}</article>`).join('')}</div></section>
 <section class="summary-section"><p class="section-label">06 <span>まとめ</span></p><h2>この言葉から、見えてきたこと。</h2><p>${e(w.summary)}</p><small>このページの定義・分類・分析・まとめは、すべて編者による編集内容です。</small></section><nav class="page-navigation" aria-label="次の言葉"><a href="#/${data.editorial.words[(index+2)%3].id}">← 前の言葉<span>${data.editorial.words[(index+2)%3].title}</span></a><a href="#/">表紙へ</a><a href="#/${data.editorial.words[(index+1)%3].id}">次の言葉 →<span>${data.editorial.words[(index+1)%3].title}</span></a></nav></div>`;
}
function peoplePage() {
 const selected=route.params.get('id');
 const p=person(selected);
 return `<div class="page-wrap narrow"><div class="breadcrumb"><a href="#/">辞典の表紙</a><span>／</span><span>回答者から探す</span></div><header class="simple-header"><p class="eyebrow">THE PEOPLE BEHIND THE WORDS</p><h1>回答者から探す</h1><p>一人の視点で、三つの言葉を読み比べる。</p></header><label class="field-label" for="person-select">回答者を選ぶ（${data.respondents.length}人）</label><select id="person-select"><option value="">選択してください</option>${data.respondents.map(p=>`<option value="${p.id}" ${selected===p.id?'selected':''}>${e(p.name)}</option>`).join('')}</select>${p?`<section class="person-answers"><h2>${e(p.name)} の言葉</h2>${data.editorial.words.map(w=>{const rs=filterResponses(data,{wordId:w.id,personId:p.id});return `<section class="person-word"><h3><a href="#/${w.id}">${w.title} <small>${w.reading}</small> ↗</a></h3>${rs.length?rs.map(r=>responseCard(r)).join(''):'<p class="empty">回答なし</p>'}</section>`;}).join('')}</section>`:`<div class="people-grid">${data.respondents.map(p=>`<a href="#/people?id=${p.id}">${e(p.name)} <span>↗</span></a>`).join('')}</div>`}</div>`;
}
function searchPage() {
 return `<div class="page-wrap narrow"><div class="breadcrumb"><a href="#/">辞典の表紙</a><span>／</span><span>回答を探す</span></div><header class="simple-header"><p class="eyebrow">FIND A VOICE</p><h1>言葉から探す</h1><p>三つの言葉、すべての回答から。</p></header>${searchInput()}<p id="result-count" class="result-count" aria-live="polite"></p><div id="response-list" class="response-list"></div></div>`;
}
function aboutPage() {
 return `<div class="page-wrap narrow"><div class="breadcrumb"><a href="#/">辞典の表紙</a><span>／</span><span>この辞典について</span></div><header class="simple-header"><p class="eyebrow">HOW WE WOVE THIS DICTIONARY</p><h1>この辞典について</h1><p>一つの正解より、一人ひとりの言葉を。</p></header><section class="prose"><h2>私たちの小さな辞典</h2><p>日本語の授業で集めた「家族」「愛」「自由」への回答から編んだ、オリジナルの辞典です。同じ言葉の中にある共通点と、一人ひとりの違いを大切にしています。</p><h2>言葉が辞典になるまで</h2><ol class="process"><li>自分の言葉で説明する</li><li>全員の回答を集める</li><li>共通点と違いを比べる</li><li>意味のまとまりに分類する</li><li>編者が定義と分析をまとめる</li><li>原文とともに、一冊の辞典にする</li></ol><h2>データと編纂方針</h2><p>Excelの有効記録は${data.respondents.length}件、回答は${data.responses.length}件です。${data.editorial.words.map(w=>`${w.title}は${data.responses.filter(r=>r.wordId===w.id).length}件`).join('、')}。空白の回答は補わず、重複の疑いがある提出も自動削除しません。</p><p>回答原文の表記、文法、空白は修正していません。「わからない」も有効な回答です。各回答の記録IDから、開発時に元のシート・行・列を照合できます。</p><p>${e(data.editorial.method)} 補助タグは人数に重複して加算しません。代表的な回答と分析の根拠は、実際の回答を参照しています。</p><p>「私たちの定義」は<strong>回答をもとに編者がまとめた定義</strong>です。定義・分類・分析・まとめを、全員が投票で承認したものとはしていません。回答者の心理や個人的な背景は推測しません。</p><h2>プライバシーについて</h2><p>${data.mode==='anonymous'?'この版は匿名表示です。「回答者01」のような番号は三つの言葉で共通です。配信するJSONにも実名を含めません。':(data.nameKind==='pseudonym'?'この版では、Excelに記載された元の仮名を表示しています。名前はすべて仮名であることを確認し、プロジェクト管理者の承認を得て、回答原文とともに公開しています。':'この版は元の名前を表示しています。管理者が公開を承認した版です。')} 回答の文章自体は原文のままです。匿名でも内容から個人が推測される可能性があるため、公開前に内容と同意を確認してください。</p><h2>読むための小さな案内</h2><p>キーワード・名前で検索したり、分類で絞り込んだりできます。回答者のページでは三つの答えを読み比べられます。言葉の「リンクをコピー」から、そのページを共有できます。</p><p class="editor-caption">日本語クラス 共同編纂プロジェクト<br>私たちの言葉辞典 — 家族・愛・自由</p></section></div>`;
}
function updateResponses() {
 const wordId=route.path.slice(1), isWord=!!titles[wordId];
 const results=filterResponses(data,{wordId:isWord?wordId:'',category:route.params.get('category') || '',query:route.params.get('q') || '',personId:route.params.get('person') || ''});
 const list=document.querySelector('#response-list');
 if (!list)return;
 list.innerHTML=results.length?results.map(r=>responseCard(r,!isWord)).join(''):'<div class="empty"><span aria-hidden="true">○</span><p>該当する回答が見つかりませんでした。</p><button data-reset>すべて表示</button></div>';
 document.querySelector('#result-count').textContent=`${results.length} 件の回答${route.params.get('q')?` ／「${route.params.get('q')}」`:''}`;
 document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===(route.params.get('category') || ''))));
 const personFilter=document.querySelector('#person-filter');
 if(personFilter) {const p=person(route.params.get('person'));personFilter.innerHTML=p?`<p>回答者：${e(p.name)} <button data-reset>絞り込みを解除</button></p>`:'';}
}
function updateParams(updates) {
 for (const [k,v] of Object.entries(updates)) v?route.params.set(k,v):route.params.delete(k);
 const hash=`#${route.path}${route.params.size?'?'+route.params.toString():''}`;
 history.replaceState(null,'',hash);previousHash=hash;
 updateResponses();
}
function reset() {const input=document.querySelector('#response-query');if(input)input.value='';updateParams({q:'',category:'',person:''});}
async function share() {
 try {if(!navigator.clipboard?.writeText)throw new Error('No clipboard');await navigator.clipboard.writeText(location.href);toast('リンクをコピーしました。');}
 catch {const existing=document.querySelector('#share-fallback');if(existing)existing.remove();const div=document.createElement('div');div.id='share-fallback';div.className='copy-fallback';div.innerHTML='<label for="share-url">リンクを選択してコピーしてください。</label><input id="share-url" readonly><button id="close-share">閉じる</button>';document.querySelector('.word-header').after(div);const input=div.querySelector('input');input.value=location.href;input.focus();input.select();div.querySelector('button').onclick=()=>{div.remove();document.querySelector('#share').focus();};announce('リンクを選択してコピーしてください。');}
}
function render() {
 if(!data)return;
 route=parseRoute(location.hash);
 if(route.path==='/') {main.innerHTML=home();document.title='私たちの言葉辞典 — 家族・愛・自由';}
 else if(titles[route.path.slice(1)]) {const w=data.editorial.words.find(w=>w.id===route.path.slice(1));main.innerHTML=wordPage(w);document.title=`${w.title} — 私たちの言葉辞典`;}
 else if(route.path==='/people'){main.innerHTML=peoplePage();document.title='回答者から探す — 私たちの言葉辞典';}
 else if(route.path==='/search'){main.innerHTML=searchPage();document.title='言葉から探す — 私たちの言葉辞典';}
 else if(route.path==='/about'){main.innerHTML=aboutPage();document.title='この辞典について — 私たちの言葉辞典';}
 else {main.innerHTML='<div class="page-wrap narrow empty"><h1>ページが見つかりません。</h1><a href="#/">辞典の表紙へ戻る →</a></div>';}
 if(warnings.length)main.insertAdjacentHTML('afterbegin',`<div class="data-warning" role="status">${warnings.map(e).join('<br>')}</div>`);
 document.querySelectorAll('[data-nav]').forEach(a=>{const active=a.dataset.nav===(route.path==='/people'?'people':route.path==='/about'?'about':'home');if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 updateResponses();
 const saved=positions.get(location.hash);
 window.scrollTo({top:saved || 0,behavior:'instant'});
 main.focus({preventScroll:true});
 previousHash=location.hash;
}
main.addEventListener('input',event=>{if(event.target.id==='response-query')updateParams({q:event.target.value});});
main.addEventListener('change',event=>{if(event.target.id==='person-select')location.hash=`#/people${event.target.value?'?id='+event.target.value:''}`;});
main.addEventListener('submit',event=>{if(event.target.id==='home-search'){event.preventDefault();location.hash='#/search?q='+encodeURIComponent(new FormData(event.target).get('q') || '');}});
main.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.id==='random'){document.querySelector('#random-content').innerHTML=randomCard();}
 if(button.id==='share')share();
 if(button.id==='clear-search' || button.hasAttribute('data-reset'))reset();
 if(button.hasAttribute('data-category'))updateParams({category:button.dataset.category});
 if(button.hasAttribute('data-open-category')){updateParams({category:button.dataset.openCategory,q:'',person:''});document.querySelector('#response-query').value='';document.querySelector('#responses').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
 if(button.id==='retry')load();
});
document.addEventListener('click',event=>{const a=event.target.closest('a');if(a?.getAttribute('href')?.startsWith('#/'))positions.set(location.hash,scrollY);if(a?.getAttribute('href')==='#entries'){event.preventDefault();document.querySelector('#entries')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}});
window.addEventListener('scroll',()=>{positions.set(previousHash,scrollY);document.querySelector('#top').hidden=scrollY<600;},{passive:true});
document.querySelector('#top').onclick=()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
window.addEventListener('hashchange',render);
if('scrollRestoration' in history)history.scrollRestoration='manual';
async function load() {
 try {const result=await fetch(new URL('../data/dictionary.json',import.meta.url));if(!result.ok)throw new Error(`HTTP ${result.status}`);data=await result.json();warnings=inspectData(data);render();}
 catch(error){data=null;main.innerHTML=`<div class="page-wrap narrow empty" role="alert"><h1>辞典を読み込めませんでした。</h1><p>データファイルの読み込みに失敗しました。通信状況を確認して、もう一度お試しください。</p><p>ローカルで開く場合は、READMEの手順でHTTPサーバーを起動してください。</p><button id="retry">もう一度読み込む</button><details><summary>エラーの詳細</summary>${e(error.message)}</details></div>`;}
}
load();
