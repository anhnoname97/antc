const {chromium} = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
const expected = process.env.ANTC_HOME_ALERTS_EXPECTED_FILE ? JSON.parse(fs.readFileSync(process.env.ANTC_HOME_ALERTS_EXPECTED_FILE,'utf8')) : null;
const artifacts = process.env.ANTC_HOME_ARTIFACTS;
const value = (values,alias) => values.find(v => v.alias === alias)?.value;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const errors = [];
  page.on('pageerror',error => errors.push(error.message));
  try {
    assert.equal((await page.goto(base + '/')).status(),200);
    const root = page.locator('[data-home-alerts]');
    const cards = root.locator('[data-risk-card]');
    let eligible;
    if (expected) {
      const today = new Date(); today.setHours(0,0,0,0);
      const published = doc => doc.variants.some(v => v.state.startsWith('Published'));
      const dated = doc => new Date(value(doc.values,'updatedDate')?.replace(' ','T'));
      eligible = expected.alerts.filter(doc => {
        const age = Math.round((today - dated(doc))/86400000);
        return published(doc) && age >= 0 && age <= 90;
      });
      const pin = value(expected.home,'pinnedAlert')?.[0]?.unique;
      eligible.sort((a,b) => Number(b.id===pin)-Number(a.id===pin) || dated(b)-dated(a));
      eligible = eligible.slice(0,Math.max(1,Math.min(3,value(expected.home,'alertCount') ?? 3)));
      assert.equal(await root.count(),eligible.length ? 1 : 0);
      if (!eligible.length) {
        assert.deepEqual(errors,[]);
        console.log('Home v2 alerts smoke passed: block hidden with no eligible published alerts.');
        return;
      }
      assert.equal(await root.locator('h2').innerText(),value(expected.home,'alertTitle'));
      assert.equal(await root.locator('.home-v2__more').innerText(),value(expected.home,'alertMoreText'));
      assert.deepEqual(await cards.locator('.risk-card__title').allTextContents(),eligible.map(doc => value(doc.values,'title') || doc.variants[0].name));
      assert.deepEqual(await cards.locator('.risk-card__desc').allTextContents(),eligible.map(doc => value(doc.values,'description')));
      assert.equal(await root.locator('.risk-sample').count(),0);
    }
    const count = await cards.count(); assert(count >= 1 && count <= 3);
    const hrefs = await cards.evaluateAll(nodes => nodes.map(el => el.getAttribute('href')));
    assert.equal(new Set(hrefs).size,count);
    assert.equal(await root.locator('.risk-stale,[hidden]').count(),0);
    assert.equal(await cards.evaluateAll(nodes => nodes.every(el => +el.dataset.age >= 0 && +el.dataset.age <= 90)),true);
    const afterRisk = await root.evaluate(el => !!el.previousElementSibling?.matches('[data-home-risks]'));
    assert(afterRisk,'Alerts follow the risk groups');

    const listing = await browser.newPage();
    const more = root.locator('.home-v2__more');
    assert.equal(await more.getAttribute('href'),'/cac-rui-ro/canh-bao-moi/');
    assert.equal((await listing.goto(new URL(await more.getAttribute('href'),base).href)).status(),200);
    for (let i=0;i<count;i++) {
      const corresponding = listing.locator('[data-risk-card]').filter({has:listing.locator('.risk-card__title',{hasText:await cards.nth(i).locator('.risk-card__title').textContent()})});
      assert.equal(await corresponding.count(),1);
      assert.equal(await corresponding.getAttribute('href'),hrefs[i]);
      assert.equal(await cards.nth(i).innerText(),await corresponding.innerText(),'Same source, date, level and description as the alert listing');
      assert.equal((await page.request.get(new URL(hrefs[i],base).href)).status(),200);
    }
    await listing.close();
    await cards.first().hover();
    await cards.first().evaluate(el => Promise.allSettled(el.getAnimations().map(a => a.finished)));
    assert.equal(await cards.first().evaluate(el => getComputedStyle(el).textDecorationLine),'none');
    await more.focus(); await page.keyboard.press('Tab');
    assert.equal(await cards.first().evaluate(el => el.matches(':focus-visible')),true);
    assert(parseFloat(await cards.first().evaluate(el => getComputedStyle(el).outlineWidth)) >= 2);
    await page.keyboard.press('Enter'); await page.waitForURL(new URL(hrefs[0],base).href);
    await page.goto(base + '/');
    for (const width of [1440,1025,1024,768,600,390,320]) {
      await page.setViewportSize({width,height:1000});
      await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth+1,null,{timeout:3000});
      assert.equal(await root.evaluate(el => el.scrollWidth > el.clientWidth+1),false,`Overflow ${width}`);
      const columns = await root.locator('.home-alert-cards').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
      assert.equal(columns,1,'Each alert occupies a full row at every viewport');
      const rows = await cards.evaluateAll(nodes => nodes.map(el => el.getBoundingClientRect()));
      for (let i=1;i<rows.length;i++) assert(rows[i].top>=rows[i-1].bottom,'Alert rows must not overlap');
    }
    await page.evaluate(() => document.documentElement.style.fontSize='200%');
    assert.equal(await root.evaluate(el => el.scrollWidth > el.clientWidth+1),false,'320px and 200% text');
    for (const card of await cards.all()) {
      assert.equal(await card.evaluate(el => el.scrollWidth > el.clientWidth+1),false,'Card text stays within its border');
    }
    await page.evaluate(() => document.documentElement.style.removeProperty('font-size'));
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await cards.first().evaluate(el => getComputedStyle(el).transitionDuration),'0s');
    if (artifacts) {
      fs.mkdirSync(artifacts,{recursive:true});
      await root.scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(artifacts,'home-alerts-desktop.png')});
      await page.setViewportSize({width:390,height:1000});await root.scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(artifacts,'home-alerts-mobile.png')});
    }
    const noJsContext = await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
    const noJs = await noJsContext.newPage(); await noJs.goto(base + '/');
    assert.equal(await noJs.locator('[data-home-alerts] [data-risk-card]').count(),count);
    await noJs.locator('[data-home-alerts] .home-v2__more').click();
    await noJs.waitForURL('**/cac-rui-ro/canh-bao-moi/');
    assert(await noJs.locator('[data-risk-alerts]').isVisible());
    await noJsContext.close();
    assert.deepEqual(errors,[]);
    console.log('Home v2 alerts smoke passed: CMS selection, matching listing cards, published destinations, keyboard/hover, responsive counts, 200% text, reduced motion and no JavaScript.');
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode=1;});
