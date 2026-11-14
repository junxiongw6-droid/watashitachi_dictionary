import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const source=JSON.parse(readFileSync(new URL('../../data/dictionary.json',import.meta.url),'utf8'));
for(const width of [375,390,430,768,1280]) {
 test(`${width}px — all routes fit and touch interactions work`,async({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:844});
  await page.goto('./');await expect(page.locator('#open-dictionary')).toBeVisible();
  await expect(page.locator('.word-entry')).toHaveCount(0);await expect(page.locator('.search-panel')).toHaveCount(0);
  await expect(page.locator('.site-footer')).toBeHidden();await expect(page.locator('.site-header nav')).toBeHidden();
  const background=await page.evaluate(()=>getComputedStyle(document.body,'::before').backgroundImage);
  expect(background).toContain(width<=700?'washi-botanical-mobile.webp':'washi-botanical.webp');
  const backgroundURL=background.match(/url\(["']?(.*?)["']?\)/)[1];
  const backgroundResponse=await page.request.get(backgroundURL);expect(backgroundResponse.status()).toBe(200);expect(backgroundResponse.headers()['content-type']).toContain('image/webp');
  if(width>700){
   await expect(page.locator('.hero-art')).toBeVisible();
   const mountain=await page.locator('.hero-art').evaluate(el=>getComputedStyle(el,'::before').backgroundImage);
   expect(mountain).toContain('cover-mountains.webp');
   const imageURL=mountain.match(/url\(["']?(.*?)["']?\)/)[1];
   expect((await page.request.get(imageURL)).status()).toBe(200);
   await expect(page.locator('.hero-art .vertical-poem')).toBeVisible();
  }else await expect(page.locator('.hero-art')).toBeHidden();
  await page.evaluate(()=>document.fonts.ready);
  await expect.poll(()=>page.locator('.cover-vignette').evaluate(el=>el.complete && el.naturalWidth>0)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(846);
  await page.screenshot({path:testInfo.outputPath('cover.png'),fullPage:true});
  await page.locator('#open-dictionary').click();await expect(page.locator('.word-entry')).toHaveCount(3);
  await expect(page.locator('.hero')).toHaveCount(0);await expect(page.locator('.site-footer')).toBeVisible();await expect(page.locator('.site-header nav')).toBeVisible();
  await expect(page.locator('.site-footer')).not.toContainText('編纂・データについて');await expect(page.locator('.site-footer')).not.toContainText('WA-08クラス 共同編纂プロジェクト');
  await page.goBack();await expect(page.locator('#open-dictionary')).toBeVisible();await expect(page.locator('.site-header nav')).toBeHidden();
  await page.goForward();await expect(page.locator('.word-entry')).toHaveCount(3);await expect(page.locator('.site-header nav')).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('.contents-page img')).toHaveCount(0);
  await expect(page.locator('.site-header nav a')).toHaveText(['目次','言葉','検索','この辞典について']);
  await expect(page.locator('[data-nav="home"]')).toHaveAttribute('aria-current','page');
  if(width<=430){
   const bottom=await page.locator('.word-entry.jiyuu').evaluate(el=>el.getBoundingClientRect().bottom);
   expect(bottom).toBeLessThanOrEqual(844);
  }
  await page.screenshot({path:testInfo.outputPath('contents.png'),fullPage:true});
  await page.locator('.word-entry.kazoku').click();await expect(page.locator('#response-list .response-card')).toHaveCount(18);
  for(const key of ['kazoku','ai','jiyuu']) {
   await page.goto('./#/'+key);await expect(page.locator('#response-list .response-card')).toHaveCount(18);
   await expect(page.locator('.word-header .eyebrow, #share, .method-details, .page-navigation, #reader-panel-overview .reader-next')).toHaveCount(0);
   await expect(page.locator('[data-nav="words"]')).toHaveAttribute('aria-current','page');
   await expect(page.locator('[data-nav="home"]')).not.toHaveAttribute('aria-current','page');
   const illustration=page.locator('.detail-illustration img');
   await expect.poll(()=>illustration.evaluate(el=>el.complete && el.naturalWidth>0)).toBe(true);
   const titleBox=await page.locator('.word-header>div').boundingBox(), imageBox=await illustration.boundingBox();
   if(width<=430)expect(imageBox.y).toBeGreaterThanOrEqual(titleBox.y+titleBox.height);
   else if(width>=768)expect(imageBox.x).toBeGreaterThanOrEqual(titleBox.x+titleBox.width);
   const counts=await page.locator('.category-summary-count').allTextContents();
   const numbers=counts.map(n=>parseInt(n,10));expect(numbers).toEqual([...numbers].sort((a,b)=>b-a));expect(numbers.reduce((sum,n)=>sum+n,0)).toBe(18);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.goto('./#/ai');
  await expect(page.locator('#reader-panel-overview')).toBeVisible();
  await expect(page.locator('#reader-panel-answers')).toBeHidden();
  await page.screenshot({path:testInfo.outputPath('ai.png'),fullPage:true});
  await expect(page.locator('.category-row[open]')).toHaveCount(0);
  await page.locator('.category-row summary').first().click();await expect(page.locator('.category-row').first()).toHaveAttribute('open','');
  await page.locator('.category-row summary').nth(1).click();await expect(page.locator('.category-row[open]')).toHaveCount(2);
  await expect(page.locator('.category-row').first()).toHaveAttribute('open','');
  await page.locator('.category-row summary').first().click();await expect(page.locator('.category-row[open]')).toHaveCount(1);
  await expect(page.locator('.category-row').nth(1)).toHaveAttribute('open','');
  await expect(page.locator('.category-row').first()).not.toHaveAttribute('open','');
  await expect(page.getByText('言葉を選ぶ',{exact:true})).toBeVisible();
  await expect(page.getByText('読む内容',{exact:true})).toBeVisible();
  if(width<=430){
   expect(await page.locator('#reader-tab-answers').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14);
   expect(await page.locator('#reader-tab-answers').evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(48);
  }
  await page.locator('#reader-tab-answers').click();
  await expect(page.locator('#reader-panel-answers')).toBeVisible();await expect(page.locator('#reader-panel-overview')).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('ai-answers.png'),fullPage:true});
  await page.locator('#response-query').fill('執念');await expect(page.locator('#response-list .response-card')).toHaveCount(1);
  await page.locator('#response-query').fill('ZZZZZZ');await expect(page.getByText('該当する回答が見つかりませんでした。')).toBeVisible();
  await page.locator('#clear-search').click();await expect(page.locator('#response-list .response-card')).toHaveCount(18);
  await page.locator('[data-category="unconditional"]').click();await expect(page.locator('#response-list .response-card')).toHaveCount(3);
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await page.locator('#top').click();
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
  await page.locator('.word-tabs a[data-word="jiyuu"]').click();await page.goBack();
  await expect(page.locator('[data-category="unconditional"]')).toHaveAttribute('aria-pressed','true');
  await page.goto('./#/people?id=p01');await expect(page.locator('.person-answers .response-card')).toHaveCount(3);
  await page.locator('#person-select').selectOption('p07');await expect(page.locator('.person-answers blockquote').first()).toHaveText('    血がつながっている人');
  await page.goto('./#/contents');await expect(page.locator('.search-panel, .about-teaser')).toHaveCount(0);
  await expect(page.locator('.site-header a[href="#/people"]')).toHaveCount(0);
  await page.locator('.site-header [data-nav="search"]').click();
  await expect(page.getByRole('heading',{name:'検索',exact:true})).toBeVisible();
  await expect(page.locator('.site-footer')).not.toContainText('編纂・データについて');await expect(page.locator('.site-footer')).not.toContainText('WA-08クラス 共同編纂プロジェクト');
  await expect(page.locator('.site-header [data-nav="search"]')).toHaveAttribute('aria-current','page');
  await expect(page.locator('#response-list .response-card')).toHaveCount(0);
  await page.locator('#response-query').fill(source.respondents[0].name);
  await expect(page.locator('#response-list .response-card')).toHaveCount(3);
  await page.locator('#response-list .response-meta span a').first().click();await page.goBack();
  await expect(page.locator('#response-query')).toHaveValue(source.respondents[0].name);
  await expect(page.locator('#response-list .response-card')).toHaveCount(3);
  await page.locator('#response-query').fill('家族');
  await expect(page.locator('.search-entry')).toHaveCount(1);await expect(page.locator('#response-list .response-card')).toHaveCount(0);
  await page.locator('.search-entry').click();await expect(page).toHaveURL(/#\/kazoku$/);await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
  await page.goBack();await expect(page.locator('#response-query')).toHaveValue('家族');await expect(page.locator('.search-entry')).toHaveCount(1);
  await page.locator('#clear-search').click();await expect(page.locator('.search-placeholder')).toHaveCount(0);await expect(page.locator('#response-list')).toBeEmpty();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('search.png'),fullPage:true});
  await page.goto('./#/about');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}
test('load failure presents retry control',async({page})=>{
 await page.route('**/data/dictionary.json*',route=>route.fulfill({status:404,body:'missing'}));
 await page.goto('./');await expect(page.getByRole('heading',{name:'辞典を読み込めませんでした。'})).toBeVisible();await expect(page.locator('#retry')).toBeVisible();
});
test('long original answers fit narrow viewport and are never truncated',async({page})=>{
 await page.setViewportSize({width:375,height:844});
 await page.route('**/data/dictionary.json*',async route=>{const result=await route.fetch();const data=await result.json();data.responses[0].text='とても長い原文'.repeat(500);await route.fulfill({json:data});});
 await page.goto('./#/kazoku?view=answers');await expect(page.locator('#response-list blockquote').first()).toHaveText('とても長い原文'.repeat(500));expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('published about page loads versioned code and removes requested privacy block',async({page},testInfo)=>{
 await page.goto('./?release=privacy-removal-v2#/about');
 await expect(page.getByRole('heading',{name:'この辞典について',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'プライバシーについて',exact:true})).toHaveCount(0);
 await expect(page.locator('main')).not.toContainText('名前はすべて仮名であることを確認し');
 await expect(page.locator('main')).not.toContainText('公開前に内容と同意を確認してください');
 await expect(page.getByRole('heading',{name:'読むための小さな案内',exact:true})).toBeVisible();
 await expect(page.locator('script[type="module"]')).toHaveAttribute('src',/app\.js\?v=[a-f0-9]{16}$/);
 await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:testInfo.outputPath('about-privacy-removed.png'),fullPage:true});
});

test('entry reading tabs support deep links, keyboard control and inline category answers',async({page},testInfo)=>{
 await page.goto('./#/ai');
 await expect(page.locator('.reader-panel:visible')).toHaveCount(1);
 await page.locator('#reader-tab-overview').focus();await page.keyboard.press('ArrowRight');
 await expect(page.locator('#reader-tab-answers')).toHaveAttribute('aria-selected','true');
 await expect(page.locator('#reader-panel-answers')).toBeVisible();
 await page.keyboard.press('End');await expect(page.locator('#reader-panel-analysis')).toBeVisible();
 await expect(page.locator('#reader-panel-answers')).toBeHidden();
 await page.screenshot({path:testInfo.outputPath('ai-analysis.png'),fullPage:true});
 await page.goBack();await expect(page.locator('#reader-panel-answers')).toBeVisible();
 await page.locator('#reader-tab-overview').click();
 await page.locator('[data-category-id="attachment"] > summary').click();
 await expect(page.locator('[data-open-category]')).toHaveCount(0);
 await expect(page.locator('#reader-panel-overview')).toBeVisible();
 await expect(page.locator('[data-category-id="attachment"] .category-responses .response-card')).toHaveCount(1);
 await page.goto('./#/kazoku?person=p01');await expect(page.locator('#reader-panel-answers')).toBeVisible();
 await expect(page.locator('#response-list .response-card')).toHaveCount(1);
});

test('printable class review contains all exact originals and unfilled confirmation fields',async({page},testInfo)=>{
 await page.goto('./#/about');
 await expect(page.getByRole('link',{name:'確認用シートをひらく ↗'})).toHaveCount(0);
 await page.goto('./review/index.html');
 await expect(page.getByRole('heading',{level:1})).toContainText('クラスで確かめる');
 await expect(page.getByText('確認状況：未確認。本人・クラスによる確認は、これから行います。',{exact:true})).toBeVisible();
 await expect(page.locator('tr[data-record]')).toHaveCount(source.responses.length);
 for(const r of source.responses){
  const row=page.locator(`tr[data-record="${r.id}"]`);
  expect(await row.locator('.original').textContent()).toBe(r.text);
  const name=source.respondents.find(p=>p.id===r.respondentId).name;
  expect(await row.locator('td').first().locator('.raw').textContent()).toBe(name);
 }
 await page.setViewportSize({width:375,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:testInfo.outputPath('class-review.png'),fullPage:false});
});

test('word selection always starts at page top including already visited and current words',async({page})=>{
 await page.goto('./#/kazoku');await expect(page.locator('.word-tabs')).toBeVisible();
 for(const key of ['ai','jiyuu','kazoku','ai','ai']){
  await page.evaluate(()=>window.scrollTo({top:document.body.scrollHeight,behavior:'instant'}));
  await page.locator(`.word-tabs a[href="#/${key}"]`).click();
  await expect(page).toHaveURL(new RegExp('#/'+key+'$'));
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
 }
});

test('exact term search shows one word link and opens the entry at the top',async({page},testInfo)=>{
 await page.goto('./#/kazoku');await expect(page.locator('.word-tabs')).toBeVisible();
 await page.evaluate(()=>window.scrollTo({top:document.body.scrollHeight,behavior:'instant'}));
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(0);
 await page.goto('./#/search');
 for(const [query,id] of [['家族','kazoku'],['愛','ai'],['自由','jiyuu'],['かぞく','kazoku'],['カゾク','kazoku'],['ｶｿﾞｸ','kazoku']]){
  await page.locator('#response-query').fill(query);
  await expect(page.locator('.search-entry')).toHaveCount(1);await expect(page.locator('#response-list .response-card')).toHaveCount(0);
  await expect(page.locator('.search-entry')).toHaveAttribute('href','#/'+id);
  await page.locator('.search-entry').click();await expect(page).toHaveURL(new RegExp('#/'+id+'$'));
  await expect(page.locator('#reader-panel-overview')).toBeVisible();await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
  await page.goBack();await expect(page.locator('#response-query')).toHaveValue(query);
 }
 await page.screenshot({path:testInfo.outputPath('single-word-search.png'),fullPage:true});
});


test('category expansion displays every original answer inline on mobile',async({page},testInfo)=>{
 await page.setViewportSize({width:390,height:844});
 for(const word of source.editorial.words){
  await page.goto('./#/'+word.id);
  for(const category of word.categories){
   const row=page.locator(`[data-category-id="${category.id}"]`);
   await row.locator('summary').click();
   const cards=row.locator('.category-responses .response-card');
   await expect(cards).toHaveCount(category.responseIds.length);
   await expect(cards.last()).toBeVisible();
   expect(await cards.locator('blockquote').allTextContents()).toEqual(category.responseIds.map(id=>source.responses.find(r=>r.id===id).text));
   await expect(row.locator('[data-open-category]')).toHaveCount(0);
   await expect(row).not.toContainText('代表的な回答');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
 }
 await page.goto('./#/kazoku');await page.locator('[data-category-id="support"] > summary').click();
 await page.screenshot({path:testInfo.outputPath('all-category-answers.png'),fullPage:true});
});


test('changing words keeps answers selected and browser back restores the previous view',async({page})=>{
 await page.goto('./#/ai?view=answers');
 for(const id of ['kazoku','jiyuu','ai']){
  await page.locator(`.word-tabs [data-word="${id}"]`).click();
  await expect(page).toHaveURL(new RegExp('#/'+id+'\\?view=answers$'));
  await expect(page.locator('#reader-tab-answers')).toHaveAttribute('aria-selected','true');
  await expect(page.locator('#reader-panel-answers')).toBeVisible();await expect(page.locator('#reader-panel-overview')).toBeHidden();
  await expect(page.locator('#response-list .response-card')).toHaveCount(18);await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
 }
 await page.goBack();await expect(page).toHaveURL(/#\/jiyuu\?view=answers$/);await expect(page.locator('#reader-panel-answers')).toBeVisible();
 await page.locator('#reader-tab-analysis').click();await page.locator('.word-tabs [data-word="kazoku"]').click();
 await expect(page.locator('#reader-panel-analysis')).toBeVisible();
 await page.locator('#reader-tab-overview').click();await page.locator('.word-tabs [data-word="ai"]').click();
 await expect(page).toHaveURL(/#\/ai$/);await expect(page.locator('#reader-panel-overview')).toBeVisible();
});


test('words navigation returns to the previous entry and reading view',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('./#/ai?view=answers');
 await expect(page.locator('[data-nav="words"]')).toHaveAttribute('aria-current','page');
 await page.locator('[data-nav="search"]').click();await expect(page.locator('[data-nav="search"]')).toHaveAttribute('aria-current','page');
 await page.locator('[data-nav="words"]').click();await expect(page).toHaveURL(/#\/ai\?view=answers$/);await expect(page.locator('#reader-panel-answers')).toBeVisible();
 await page.locator('[data-nav="home"]').click();await expect(page).toHaveURL(/#\/contents$/);await expect(page.locator('[data-nav="home"]')).toHaveAttribute('aria-current','page');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
