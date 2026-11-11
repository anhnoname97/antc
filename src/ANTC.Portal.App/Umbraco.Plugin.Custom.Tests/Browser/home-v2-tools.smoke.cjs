const {chromium} = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
const expected = process.env.ANTC_HOME_EXPECTED_FILE ? JSON.parse(fs.readFileSync(process.env.ANTC_HOME_EXPECTED_FILE,'utf8')) : null;
const artifacts = process.env.ANTC_HOME_ARTIFACTS;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const errors = [];
  page.on('pageerror',error => errors.push(error.message));
  try {
    assert.equal((await page.goto(base + '/')).status(),200);
    const root = page.locator('[data-home-tools]');
    const cards = root.locator('a.self-check-card');
    assert.equal(await root.count(),1);
    assert.equal(await cards.count(),3);
    assert.equal(await root.locator('.self-check-card--pending').count(),0);
    assert.equal(await root.locator('.self-check-card__action').filter({hasText:'Bắt đầu'}).count(),3);
    const readCards = target => target.locator('a.self-check-card').evaluateAll(nodes => nodes.map(el => ({
      title:el.querySelector('.self-check-card__body b').textContent,
      description:el.querySelector('.self-check-card__body > span')?.textContent,
      icon:el.querySelector('svg path').getAttribute('d'),href:el.getAttribute('href'),
    })));
    const homeCards = await readCards(root);
    if (expected) {
      assert.equal(await root.locator('h2').innerText(),expected.title);
      assert.deepEqual(homeCards.map(c => ({title:c.title,description:c.description})),expected.tools.map(c => ({title:c.title,description:c.description})),'Selected CMS order and card content');
    }
    const more = root.locator('.home-v2__more');
    const landingUrl = await more.getAttribute('href');
    assert.equal(landingUrl,'/hay-tu-kiem-tra/');
    const landing = await browser.newPage();
    assert.equal((await landing.goto(new URL(landingUrl,base).href)).status(),200);
    const landingCards = await readCards(landing.locator('.self-check-tools'));
    for (const card of homeCards) assert.deepEqual(card,landingCards.find(c => c.href === card.href),'Use the same source title/description/icon/URL as the landing page');
    await landing.close();

    const urgent = root.locator('.self-check-card--urgent');
    assert.equal(await urgent.count(),1);
    await urgent.hover();
    await urgent.evaluate(el => Promise.allSettled(el.getAnimations().map(animation => animation.finished)));
    const colors = await urgent.evaluate(el => ({border:getComputedStyle(el).borderTopColor,action:getComputedStyle(el.querySelector('.self-check-card__action')).color}));
    assert.equal(colors.border,'rgb(184, 67, 26)','Urgent hover stays red');
    assert.equal(colors.action,'rgb(184, 67, 26)');
    const urgentUrl = await urgent.getAttribute('href');
    await urgent.focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
    assert.equal(await urgent.evaluate(el => el.matches(':focus-visible')),true);
    assert.equal(await urgent.evaluate(el => getComputedStyle(el).outlineColor),'rgb(184, 67, 26)');
    await page.keyboard.press('Enter');
    await page.waitForURL(new URL(urgentUrl,base).href);
    assert(await page.locator('[data-self-check-branch]').isVisible());

    for (const card of homeCards) {
      assert.equal((await page.goto(new URL(card.href,base).href)).status(),200);
      assert.equal(await page.locator('h1').innerText(),card.title);
      assert.equal(await page.locator('[data-self-check-tool], [data-self-check-branch]').count(),1);
    }
    await page.goto(base + '/');
    for (const width of [1440,1024,768,744,600,390,320]) {
      await page.setViewportSize({width,height:1000});
      await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 1,null,{timeout:3000});
      assert.equal(await root.evaluate(el => el.scrollWidth > el.clientWidth + 1),false,`Overflow ${width}`);
      const boxes = await cards.evaluateAll(nodes => nodes.map(el => {const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));
      if (width >= 768) {
        assert(boxes.every(r => Math.abs(r.y - boxes[0].y) < 1),`Three columns at ${width}`);
        assert(boxes.every(r => Math.abs(r.height - boxes[0].height) < 1),`Equal card heights at ${width}`);
      } else assert(boxes.every(r => Math.abs(r.x - boxes[0].x) < 1),`One column at ${width}`);
    }
    await page.evaluate(() => document.documentElement.style.fontSize='200%');
    assert.equal(await root.evaluate(el => el.scrollWidth > el.clientWidth + 1),false,'320px with 200% text');
    await page.evaluate(() => document.documentElement.style.removeProperty('font-size'));
    await page.emulateMedia({reducedMotion:'reduce'});
    await urgent.hover();
    assert.equal(await urgent.evaluate(el => getComputedStyle(el).transform),'none');
    if (artifacts) {
      fs.mkdirSync(artifacts,{recursive:true});
      await page.setViewportSize({width:1440,height:1000});await root.scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(artifacts,'home-tools-desktop.png')});
      await page.setViewportSize({width:390,height:844});await root.scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(artifacts,'home-tools-mobile.png')});
    }
    const noJsContext = await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
    const noJs = await noJsContext.newPage();await noJs.goto(base + '/');
    assert.equal(await noJs.locator('[data-home-tools] a.self-check-card').count(),3);
    await noJs.locator('[data-home-tools] .home-v2__more').click();
    await noJs.waitForURL('**/hay-tu-kiem-tra/');
    assert(await noJs.locator('[data-self-check-landing]').isVisible());
    await noJsContext.close();
    assert.deepEqual(errors,[]);
    console.log('Home v2 tools smoke passed: CMS-selected cards, shared source content, destinations, urgent hover/focus, responsive/text scaling, no JavaScript.');
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode=1;});
