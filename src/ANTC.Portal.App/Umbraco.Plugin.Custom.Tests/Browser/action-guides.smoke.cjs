const {chromium}=require(process.env.ANTC_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const base=process.env.ANTC_TEST_URL||'http://localhost:11000';
(async()=>{const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));try{
 await page.goto(base+'/khan-cap/');
 const urls=new Set(await page.locator('a[href^="/hay-tu-kiem-tra/huong-dan/"]').evaluateAll(links=>links.map(a=>a.getAttribute('href').split('#')[0])));
 assert.equal(urls.size,10);
 for(const url of urls){
  assert.equal((await page.goto(base+url+'?source=test')).status(),200,url);
  const guide=page.locator('[data-action-guide]');assert.equal(await guide.count(),1,url);
  assert.equal(await guide.locator('h1').count(),1);assert.equal(await guide.locator('.action-guide-review').count(),1);
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),base+url);
  assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'),base+url);
  for(const nav of ['.site-header__nav','.site-mobile-nav']) assert.deepEqual(await page.locator(nav+' a[aria-current="page"]').evaluateAll(links=>links.map(a=>a.getAttribute('href'))),['/khan-cap/'],'Guides belong to Emergency despite their legacy tools URLs');
  const checks=guide.locator('[data-guide-check]');
  if(await checks.count()){
   await page.waitForLoadState('networkidle');
   const storage=await page.evaluate(()=>JSON.stringify({local:{...localStorage},session:{...sessionStorage}}));
   const outgoing=[];const listener=request=>outgoing.push(request.url());page.on('request',listener);
   await checks.first().focus();await page.keyboard.press('Space');assert.equal(await checks.first().isChecked(),true);
   assert.match(await guide.locator('[data-guide-status]').innerText(),/1\//);
   await guide.locator('[data-guide-reset]').click();assert.equal(await guide.locator('[data-guide-check]:checked').count(),0);
   assert.equal(await page.evaluate(()=>JSON.stringify({local:{...localStorage},session:{...sessionStorage}})),storage);assert.deepEqual(outgoing,[]);
   page.off('request',listener);await checks.first().check();await page.reload();await page.waitForFunction(()=>document.querySelector('[data-guide-check]').checked);assert.equal(await guide.locator('[data-guide-check]:checked').count(),1);await guide.locator('[data-guide-reset]').click();
  }else assert.equal(await guide.locator('[data-emergency-screening] a').count(),6);
  for(const width of [1440,744,390,320]){await page.setViewportSize({width,height:1100});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,url+' '+width);}
  for(const href of new Set(await guide.locator('a[href^="/"]').evaluateAll(links=>links.map(a=>a.getAttribute('href')))))assert.equal((await page.request.get(new URL(href,base).href)).status(),200,href);
 }
 await page.goto(base+'/hay-tu-kiem-tra/huong-dan/tien-la-chuyen-vao/');
 assert.equal(await page.locator('.action-guide-follow-up a').count(),1);
 assert.match(await page.locator('.action-guide-snippet-body').innerText(),/Trước khi chuyển tiền/);
 const bank=page.locator('.action-guide-bank').first();assert.equal(await bank.count(),1);await bank.locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await bank.locator('ol').isVisible(),true);await bank.locator('summary').click();
 await page.emulateMedia({media:'print'});assert.equal(await page.locator('.action-guide-page-tools').isVisible(),false);assert.equal(await bank.locator('ol').isVisible(),true);await page.emulateMedia({media:'screen'});
 const noJs=await browser.newContext({javaScriptEnabled:false}),plain=await noJs.newPage();await plain.goto(base+'/hay-tu-kiem-tra/huong-dan/tien-la-chuyen-vao/');await plain.locator('[data-guide-check]').first().check();assert.equal(await plain.locator('.action-guide-follow-up a').isVisible(),true);await noJs.close();
 assert.deepEqual(errors,[]);console.log('PASS: all 10 guides, source metadata/SEO, steps and snippets, follow-up, checkbox reset/reload/privacy, keyboard, responsive layouts, print and no-JS.');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
