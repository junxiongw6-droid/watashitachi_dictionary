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
  await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(846);
  await page.screenshot({path:testInfo.outputPath('cover.png'),fullPage:true});
  await page.locator('#open-dictionary').click();await expect(page.locator('.word-entry')).toHaveCount(3);
  await expect(page.locator('.hero')).toHaveCount(0);await expect(page.locator('.site-footer')).toBeVisible();await expect(page.locator('.site-header nav')).toBeVisible();
  await expect(page.locator('.site-footer')).not.toContainText('編纂・データについて');await expect(page.locator('.site-footer')).not.toContainText('日本語クラス 共同編纂プロジェクト');
  await page.goBack();await expect(page.locator('#open-dictionary')).toBeVisible();await expect(page.locator('.site-header nav')).toBeHidden();
  await page.goForward();await expect(page.locator('.word-entry')).toHaveCount(3);await expect(page.locator('.site-header nav')).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  if(width<=430){
   const bottom=await page.locator('.word-entry.jiyuu').evaluate(el=>el.getBoundingClientRect().bottom);
   expect(bottom).toBeLessThanOrEqual(844);
  }
  await page.screenshot({path:testInfo.outputPath('contents.png'),fullPage:true});
  await page.locator('.word-entry.kazoku').click();await expect(page.locator('#response-list .response-card')).toHaveCount(18);
  for(const key of ['kazoku','ai','jiyuu']) {
   await page.goto('./#/'+key);await expect(page.locator('#response-list .response-card')).toHaveCount(18);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.goto('./#/ai');
  await expect(page.locator('#reader-panel-overview')).toBeVisible();
  await expect(page.locator('#reader-panel-answers')).toBeHidden();
  await page.screenshot({path:testInfo.outputPath('ai.png'),fullPage:true});
  await expect(page.locator('.category-row[open]')).toHaveCount(0);
  await page.locator('.category-row summary').first().click();await expect(page.locator('.category-row').first()).toHaveAttribute('open','');
  await page.locator('.category-row summary').nth(1).click();await expect(page.locator('.category-row[open]')).toHaveCount(1);
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
  await page.locator('#share').click();
  await expect(page.locator('#toast:not([hidden]), #share-fallback')).toBeVisible();
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await page.locator('#top').click();
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
  await page.locator('.word-tabs a[href="#/jiyuu"]').click();await page.goBack();
  await expect(page.locator('[data-category="unconditional"]')).toHaveAttribute('aria-pressed','true');
  await page.goto('./#/people?id=p01');await expect(page.locator('.person-answers .response-card')).toHaveCount(3);
  await page.locator('#person-select').selectOption('p07');await expect(page.locator('.person-answers blockquote').first()).toHaveText('    血がつながっている人');
  await page.goto('./#/contents');await expect(page.locator('.search-panel, .about-teaser')).toHaveCount(0);
  await expect(page.locator('.site-header a[href="#/people"]')).toHaveCount(0);
  await page.locator('.site-header [data-nav="search"]').click();
  await expect(page.getByRole('heading',{name:'検索',exact:true})).toBeVisible();
  await expect(page.locator('.site-footer')).not.toContainText('編纂・データについて');await expect(page.locator('.site-footer')).not.toContainText('日本語クラス 共同編纂プロジェクト');
  await expect(page.locator('.site-header [data-nav="search"]')).toHaveAttribute('aria-current','page');
  await expect(page.locator('#response-list .response-card')).toHaveCount(0);
  await page.locator('#response-query').fill(source.respondents[0].name);
  await expect(page.locator('#response-list .response-card')).toHaveCount(3);
  await page.locator('#response-list .response-meta span a').first().click();await page.goBack();
  await expect(page.locator('#response-query')).toHaveValue(source.respondents[0].name);
  await expect(page.locator('#response-list .response-card')).toHaveCount(3);
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

test('entry reading tabs support deep links, keyboard control and category shortcuts',async({page},testInfo)=>{
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
 await page.locator('[data-open-category="attachment"]').click();
 await expect(page.locator('#reader-panel-answers')).toBeVisible();
 await expect(page.locator('#response-list .response-card')).toHaveCount(1);
 await page.goto('./#/kazoku?person=p01');await expect(page.locator('#reader-panel-answers')).toBeVisible();
 await expect(page.locator('#response-list .response-card')).toHaveCount(1);
});

test('printable class review contains all exact originals and unfilled confirmation fields',async({page},testInfo)=>{
 await page.goto('./#/about');
 await page.getByRole('link',{name:'確認用シートをひらく ↗'}).click();
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
