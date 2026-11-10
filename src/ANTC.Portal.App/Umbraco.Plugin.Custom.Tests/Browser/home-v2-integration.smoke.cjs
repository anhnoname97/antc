// Public end-to-end audit; never saves CMS content or tool answers.
const playwright = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
const engine = process.env.ANTC_BROWSER || 'chromium';
const artifacts = process.env.ANTC_HOME_ARTIFACTS;
const footer = process.env.ANTC_HOME_FOOTER_EXPECTED_FILE ? JSON.parse(fs.readFileSync(process.env.ANTC_HOME_FOOTER_EXPECTED_FILE,'utf8')) : null;

(async () => {
  const browser = await playwright[engine].launch();
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[], badResources=[], answerRequests=[];
  let answering=false;
  page.on('pageerror',error => errors.push(error.message));
  page.on('response',response => {
    if (response.url().startsWith(base+'/') && response.status()>=400) badResources.push({url:response.url(),status:response.status()});
  });
  page.on('request',request => {
    if (answering && !['font','image'].includes(request.resourceType())) answerRequests.push(request.url());
  });
  const storage = () => page.evaluate(() => JSON.stringify({local:{...localStorage},session:{...sessionStorage}}));
  const noOverflow = async label => {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth>innerWidth+1),false,`${engine}: ${label}`);
    for (const selector of ['main','.site-header','.site-footer']) {
      assert.equal(await page.locator(selector).evaluate(el => el.scrollWidth>el.clientWidth+1),false,`${selector}: ${label}`);
    }
  };
  try {
    assert.equal((await page.goto(base+'/')).status(),200);
    assert.equal(await page.locator('[data-home-risk-card]').count(),5,'All five published risk groups');
    assert.equal(await page.locator('[data-home-tools] a.self-check-card').count(),3,'All three ready tools');
    for (const img of await page.locator('img').all()) {await img.scrollIntoViewIfNeeded();await img.evaluate(el => el.decode());}
    const pending = await page.locator('[data-footer-pending] > span').allTextContents();
    if (footer) assert.deepEqual(pending,footer.filter(item => !item.template).map(item => item.label));
    assert.equal(await page.locator('[data-footer-pending] a,[data-footer-pending][tabindex]').count(),0);
    assert.equal(await page.locator('[data-footer-pending] small').evaluateAll(nodes => nodes.every(el => el.textContent==='Đang cập nhật')),true);
    const hrefs = [...new Set(await page.locator('a[href]').evaluateAll(nodes => nodes.map(el => el.getAttribute('href'))))];
    const links=[];
    for (const href of hrefs) {
      assert(href && href!=='#','No empty or placeholder links');
      if (href.startsWith('#')) {assert.equal(await page.locator(href).count(),1);continue;}
      if (!href.startsWith('/') || href.startsWith('//')) continue;
      const response=await page.request.get(new URL(href,base).href);
      assert.equal(response.status(),200,href);
      const hash=new URL(href,base).hash;
      if (hash) assert.equal(await page.evaluate(({html,id}) => !!new DOMParser().parseFromString(html,'text/html').getElementById(id),{html:await response.text(),id:decodeURIComponent(hash.slice(1))}),true,href);
      links.push({href,status:response.status(),destination:new URL(response.url()).pathname});
    }
    await page.goto(base+'/');
    // This Windows WebKit build tabs through form controls only; test link activation explicitly.
    // Chromium and Firefox also verify the native Tab order from the start of the document.
    if (engine==='webkit') await page.locator('.site-skip').focus();
    else await page.keyboard.press('Tab');
    assert.equal(await page.locator('.site-skip').evaluate(el => el.matches(':focus')),true);
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.id),'noi-dung');
    await page.locator('[data-home-actions]').focus();await page.keyboard.press('Enter');
    await page.waitForURL('**/khan-cap/#viec-can-lam');
    assert.equal(await page.locator('#viec-can-lam').count(),1);
    await page.goto(base+'/'); await page.locator('[data-home-wizard]').click();
    await page.locator('[data-next]').waitFor(); await page.waitForLoadState('networkidle');
    const wizardStorage=await storage();answering=true;
    await page.locator('input[value=x]').check();await page.locator('[data-next]').click();
    await page.locator('input[value=unk]').check();await page.locator('[data-next]').click();
    await page.locator('input[value=unk]').check();await page.locator('[data-next]').click();
    assert.equal(await page.locator('[data-wizard-result]').count(),1);
    assert.equal(await storage(),wizardStorage); answering=false;

    const toolPaths=['/hay-tu-kiem-tra/truoc-khi-chuyen-tien/','/hay-tu-kiem-tra/truoc-khi-dau-tu-vay/','/hay-tu-kiem-tra/khi-nghi-bi-lua/'];
    for (const toolPath of toolPaths) {
      await page.goto(base+'/');
      await page.locator(`[data-home-tools] a[href="${toolPath}"]`).click();
      await page.locator('[data-answer]').first().waitFor();await page.waitForLoadState('networkidle');
      const before=await storage(); const metadata=await page.locator('head').innerHTML();answering=true;
      if (toolPath.includes('khi-nghi-bi-lua')) {
        for (let i=0;i<4;i++) await page.locator('[data-answer=n]').click();
      } else await page.locator('[data-answer=co]').click();
      assert.equal(await page.locator('.self-check-state').count(),1);
      assert.equal(await storage(),before);assert.equal(await page.locator('head').innerHTML(),metadata);
      answering=false;
    }
    assert.deepEqual(answerRequests,[],'Answers do not leave the browser');
    await page.goto(base+'/');
    for (const width of [1440,1024,768,767,600,390,320]) {
      await page.setViewportSize({width,height:1000});
      for (const scale of ['0','1','2']) {
        assert.equal(await page.evaluate(() => document.documentElement.dataset.fontScale),scale);
        await noOverflow(`${width}px, font scale ${scale}`);
        const mobile=page.locator('[data-mobile-navigation]');
        assert.equal(await mobile.isVisible(),width<768);
        if (width<768) {
          await page.waitForFunction(() => parseFloat(getComputedStyle(document.body).paddingBottom)>=document.querySelector('[data-mobile-navigation]').offsetHeight);
          assert.equal(await mobile.locator('a').count(),3);
        }
        await page.evaluate(() => scrollTo(0,0));await page.locator('[data-font-toggle]').click();
      }
    }
    await page.locator('[data-font-toggle]').click(); await page.locator('[data-font-toggle]').click();
    await page.reload();assert.equal(await page.evaluate(() => document.documentElement.dataset.fontScale),'2','Font preference persists');
    await page.locator('[data-font-toggle]').click();
    await page.evaluate(() => document.documentElement.style.fontSize='200%');
    await noOverflow('320px with 200% text');
    await page.evaluate(() => document.documentElement.style.removeProperty('font-size'));
    await page.setViewportSize({width:844,height:390});await noOverflow('landscape');
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.locator('.home-signals__light').first().evaluate(el => getComputedStyle(el).animationName),'none');
    await page.emulateMedia({media:'print'});
    assert.equal(await page.locator('.site-mobile-nav').isVisible(),false);
    assert.equal(await page.locator('.site-footer').isVisible(),false);
    assert.equal(await page.locator('[data-home-emergency] h1').isVisible(),true);
    await page.emulateMedia({media:'screen'});
    assert.deepEqual(errors,[]);assert.deepEqual(badResources,[]);
    if (artifacts) {
      fs.mkdirSync(artifacts,{recursive:true});
      fs.writeFileSync(path.join(artifacts,`home-integration-${engine}.json`),JSON.stringify({engine,links,pending,pageErrors:errors,badResources,answerRequests},null,2));
      await page.setViewportSize({width:390,height:1000});await page.locator('.site-footer').scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(artifacts,`home-footer-${engine}.png`)});
    }
    console.log(`PASS ${engine}: ${links.length} local links, ${pending.length} pending footer pages, homepage-to-wizard/three tools, answer privacy, keyboard skip/CTA, 7 widths × 3 font scales, persistence, 200% text, landscape and print.`);
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode=1;});
