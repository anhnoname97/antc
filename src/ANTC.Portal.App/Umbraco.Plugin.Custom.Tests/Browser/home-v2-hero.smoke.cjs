const { chromium } = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
const artifacts = process.env.ANTC_HOME_ARTIFACTS;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const errors = [];
  page.on('pageerror',error => errors.push(error.message));
  const checkWidth = async label => {
    await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 1,null,{timeout:3000});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),false,`Horizontal overflow: ${label}`);
    for (const selector of ['.home-emergency__copy','.home-emergency__actions','.home-principles']) {
      assert.equal(await page.locator(selector).evaluate(el => el.scrollWidth > el.clientWidth + 1),false,`Clipped content: ${label} ${selector}`);
    }
  };
  try {
    const response = await page.goto(base + '/');
    assert.equal(response.status(),200);
    const hero = page.locator('[data-home-emergency]');
    assert.equal(await hero.count(),1);
    assert.equal(await page.locator('h1').count(),1,'Do not retain the v1 hero heading');
    assert((await hero.locator('h1').innerText()).trim().length > 0);
    assert.equal(await page.locator('.intro-hero__copy').count(),0);
    assert.equal(await page.locator('.home-content,.umb-block-grid').count(),0,'The v2 homepage replaces the remaining v1 layout');
    assert.equal(await hero.locator('.home-signals__row').count(),3);
    assert(await hero.locator('.home-emergency__levels').isVisible());
    const caution = hero.locator('.home-signals__row--caution');
    assert.match(await caution.innerText(),/không có nghĩa giao dịch an toàn/i);
    assert.equal(await caution.locator('.home-signals__light').evaluate(el => getComputedStyle(el).backgroundColor),'rgb(140, 154, 173)');

    const shared = await browser.newPage();
    await shared.goto(base + '/khan-cap/');
    const emergencyPrinciples = await shared.locator('.emergency-principles > div').evaluateAll(items => items.map(el => ({title:el.querySelector('h3').textContent,description:el.querySelector('p').textContent,icon:el.querySelector('svg path').getAttribute('d')})));
    const homePrinciples = await hero.locator('.home-principles__item').evaluateAll(items => items.map(el => ({title:el.querySelector('h3').textContent,description:el.querySelector('p').textContent,icon:el.querySelector('svg path').getAttribute('d')})));
    assert.equal(homePrinciples.length,4);
    assert.deepEqual(homePrinciples,emergencyPrinciples,'Home and Emergency must use the same CMS principles');
    await shared.close();

    const image = page.locator('.home-v2__illustration img');
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(img => img.decode());
    assert((await image.getAttribute('alt')).trim().length > 0);
    assert.equal(await image.evaluate(img => img.naturalWidth > 0),true);
    assert.equal((await page.request.get(new URL(await image.getAttribute('src'),base).href)).status(),200);
    const primary = hero.locator('[data-home-wizard]');
    const secondary = hero.locator('[data-home-actions]');
    assert.equal(await primary.getAttribute('href'),'/khan-cap/kiem-tra/');
    assert.equal(await secondary.getAttribute('href'),'/khan-cap/#viec-can-lam');
    await primary.scrollIntoViewIfNeeded();
    await primary.hover();
    assert.equal(await primary.evaluate(el => getComputedStyle(el).color),'rgb(255, 255, 255)','Primary hover must remain white on red');
    await primary.focus();
    await page.keyboard.press('Tab');
    assert.equal(await secondary.evaluate(el => el.matches(':focus-visible')),true);
    const focus = await secondary.evaluate(el => ({style:getComputedStyle(el).outlineStyle,width:parseFloat(getComputedStyle(el).outlineWidth)}));
    assert(focus.style !== 'none' && focus.width >= 2,'Visible keyboard focus');
    await page.keyboard.press('Enter');
    await page.waitForURL('**/khan-cap/#viec-can-lam');
    const target = await page.locator('#viec-can-lam').boundingBox();
    assert(target.y >= 0 && target.y < 500,'The secondary action should scroll to immediate actions');
    await page.goto(base + '/');
    await page.locator('[data-home-wizard]').click();
    await page.waitForURL('**/khan-cap/kiem-tra/');
    assert.equal((await page.request.get(page.url())).status(),200);
    await page.goto(base + '/');

    for (const width of [1440,1025,1024,768,600,390,360,320]) {
      await page.setViewportSize({width,height:1000});
      await checkWidth(width);
      assert.equal(await page.locator('.home-emergency__levels').isVisible(),width >= 1025);
      for (const button of await page.locator('.home-emergency__actions a').all()) assert((await button.boundingBox()).height >= 44);
      const cardTops = await page.locator('.home-principles__item').evaluateAll(items => items.map(el => el.getBoundingClientRect().top));
      if (width >= 1025) assert(cardTops.every(top => Math.abs(top - cardTops[0]) < 1),'Four desktop cards share a row');
    }
    await page.evaluate(() => document.documentElement.style.fontSize = '200%');
    await checkWidth('320px with 200% text');
    await page.evaluate(() => document.documentElement.style.removeProperty('font-size'));
    await page.setViewportSize({width:1440,height:1000});
    await page.emulateMedia({reducedMotion:'reduce'});
    const motion = await page.locator('.home-signals__light').first().evaluate(el => ({name:getComputedStyle(el).animationName,opacity:getComputedStyle(el).opacity}));
    assert.equal(motion.name,'none'); assert.equal(motion.opacity,'1');
    if (artifacts) {
      fs.mkdirSync(artifacts,{recursive:true});
      await page.evaluate(() => window.scrollTo(0,0));
      await page.screenshot({path:path.join(artifacts,'home-v2-desktop.png')});
      await page.setViewportSize({width:390,height:844});
      await page.screenshot({path:path.join(artifacts,'home-v2-mobile.png')});
    }
    const noJsContext = await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
    const noJs = await noJsContext.newPage();
    assert.equal((await noJs.goto(base + '/')).status(),200);
    assert.equal(await noJs.locator('.home-principles__item').count(),4);
    await noJs.locator('[data-home-actions]').click();
    await noJs.waitForURL('**/khan-cap/#viec-can-lam');
    assert(await noJs.locator('#viec-can-lam').isVisible());
    await noJsContext.close();
    assert.deepEqual(errors,[]);
    console.log('Home v2 hero smoke passed: shared CMS principles, published destinations, image, responsive/text scaling, keyboard, reduced motion, no JavaScript.');
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});
