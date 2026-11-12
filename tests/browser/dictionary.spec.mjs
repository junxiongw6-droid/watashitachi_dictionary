import {test,expect} from '@playwright/test';
for(const width of [375,390,430,768,1280]) {
 test(`${width}px — all routes fit and touch interactions work`,async({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:844});
  await page.goto('/');await expect(page.locator('.word-entry')).toHaveCount(3);
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:testInfo.outputPath('home.png'),fullPage:true});
  await page.locator('.word-entry.kazoku').click();await expect(page.locator('#response-list .response-card')).toHaveCount(18);
  for(const key of ['kazoku','ai','jiyuu']) {
   await page.goto('/#/'+key);await expect(page.locator('#response-list .response-card')).toHaveCount(18);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.goto('/#/ai');
  await page.screenshot({path:testInfo.outputPath('ai.png'),fullPage:true});
  await page.locator('#response-query').fill('執念');await expect(page.locator('#response-list .response-card')).toHaveCount(1);
  await page.locator('#response-query').fill('ZZZZZZ');await expect(page.getByText('該当する回答が見つかりませんでした。')).toBeVisible();
  await page.locator('#clear-search').click();await expect(page.locator('#response-list .response-card')).toHaveCount(18);
  await page.locator('[data-category="unconditional"]').click();await expect(page.locator('#response-list .response-card')).toHaveCount(3);
  await page.locator('summary').first().click();await expect(page.locator('details').first()).toHaveAttribute('open','');
  await page.locator('#share').click();
  await expect(page.locator('#toast:not([hidden]), #share-fallback')).toBeVisible();
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await page.locator('#top').click();
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
  await page.locator('.word-tabs a[href="#/jiyuu"]').click();await page.goBack();
  await expect(page.locator('[data-category="unconditional"]')).toHaveAttribute('aria-pressed','true');
  await page.goto('/#/people?id=p01');await expect(page.locator('.person-answers .response-card')).toHaveCount(3);
  await page.locator('#person-select').selectOption('p07');await expect(page.locator('.person-answers blockquote').first()).toHaveText('    血がつながっている人');
  await page.goto('/');const before=await page.locator('#random-content blockquote').textContent();await page.locator('#random').click();expect(await page.locator('#random-content blockquote').textContent()).not.toBe(before);
  await page.goto('/#/about');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}
test('load failure presents retry control',async({page})=>{
 await page.route('**/data/dictionary.json',route=>route.fulfill({status:404,body:'missing'}));
 await page.goto('/');await expect(page.getByRole('heading',{name:'辞典を読み込めませんでした。'})).toBeVisible();await expect(page.locator('#retry')).toBeVisible();
});
test('long original answers fit narrow viewport and are never truncated',async({page})=>{
 await page.setViewportSize({width:375,height:844});
 await page.route('**/data/dictionary.json',async route=>{const result=await route.fetch();const data=await result.json();data.responses[0].text='とても長い原文'.repeat(500);await route.fulfill({json:data});});
 await page.goto('/#/kazoku');await expect(page.locator('#response-list blockquote').first()).toHaveText('とても長い原文'.repeat(500));expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
