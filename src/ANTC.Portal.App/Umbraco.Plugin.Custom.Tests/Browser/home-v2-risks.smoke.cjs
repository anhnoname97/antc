const {chromium} = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
const expected = process.env.ANTC_HOME_RISKS_EXPECTED_FILE ? JSON.parse(fs.readFileSync(process.env.ANTC_HOME_RISKS_EXPECTED_FILE,'utf8')) : null;
const artifacts = process.env.ANTC_HOME_ARTIFACTS;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const errors = [];
  page.on('pageerror',error => errors.push(error.message));
  try {
    assert.equal((await page.goto(base + '/')).status(),200);
    const root = page.locator('[data-home-risks]');
    const cards = root.locator('[data-home-risk-card]');
    assert.equal(await root.count(),1); assert.equal(await cards.count(),5);
    const data = await cards.evaluateAll(nodes => nodes.map(el => ({
      id:el.dataset.groupKey,title:el.querySelector('h3').textContent,description:el.querySelector('p').textContent,
      count:Number.parseInt(el.querySelector('.home-risk-card__count').textContent,10),href:el.getAttribute('href'),
      image:el.querySelector('img')?.getAttribute('src'),
    })));
    assert.equal(new Set(data.map(c => c.href)).size,5);
    if (expected) {
      assert.equal(await root.locator('h2').innerText(),expected.title);
      const value = (doc,alias) => doc.values.find(v => v.alias === alias)?.value;
      assert.deepEqual(data.map(c => ({id:c.id,title:c.title,description:c.description})),expected.groups.filter(g => g.state==='Published').map(g => ({id:g.id,title:value(g,'tabName') || value(g,'title') || g.name,description:value(g,'cardDescription')})));
    }
    await root.scrollIntoViewIfNeeded();
    for (const image of await root.locator('img').all()) {
      await image.evaluate(img => img.decode());
      assert.equal(await image.evaluate(img => img.naturalWidth > 0),true);
      assert.equal((await page.request.get(new URL(await image.getAttribute('src'),base).href)).status(),200);
    }
    const groupPage = await browser.newPage();
    for (const card of data) {
      assert.equal((await groupPage.goto(new URL(card.href,base).href)).status(),200);
      assert.equal(await groupPage.locator('h1').innerText(),card.title);
      assert.equal(await groupPage.locator('[data-risk-card]').count(),card.count,'Count must match all items on the destination group');
      assert.match(await groupPage.locator('[data-risk-count]').innerText(),new RegExp(`^${card.count} bài`));
    }
    await groupPage.close();
    const more = root.locator('.home-v2__more');
    assert.equal(await more.getAttribute('href'),'/cac-rui-ro/');
    const redirect = await page.request.get(new URL(await more.getAttribute('href'),base).href,{maxRedirects:0});
    assert.equal(redirect.status(),301);
    assert.equal(new URL(redirect.headers().location,base).pathname,'/cac-rui-ro/canh-bao-moi/');

    await cards.first().hover();
    await cards.first().evaluate(el => Promise.allSettled(el.getAnimations().map(a => a.finished)));
    assert.equal(await cards.first().locator('.home-risk-card__count .site-icon').evaluate(el => getComputedStyle(el).opacity),'1');
    await cards.first().focus(); await page.keyboard.press('Tab');
    assert.equal(await cards.nth(1).evaluate(el => el.matches(':focus-visible')),true);
    assert(parseFloat(await cards.nth(1).evaluate(el => getComputedStyle(el).outlineWidth)) >= 2);
    await page.keyboard.press('Enter');
    await page.waitForURL(new URL(data[1].href,base).href);
    await page.goto(base + '/');
    for (const width of [1440,1024,768,744,600,390,320]) {
      await page.setViewportSize({width,height:1000});
      await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 1,null,{timeout:3000});
      if (width < 768) await page.waitForFunction(() => [...document.querySelectorAll('.home-risk-card__count .site-icon')].every(el => getComputedStyle(el).opacity === '1'));
      assert.equal(await root.evaluate(el => el.scrollWidth > el.clientWidth + 1),false,`Overflow ${width}`);
      const boxes = await cards.evaluateAll(nodes => nodes.map(el => {const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));
      if (width >= 768) {
        assert(boxes.every(r => Math.abs(r.y - boxes[0].y) < 1),`Five desktop/tablet columns at ${width}`);
        assert(boxes.every(r => Math.abs(r.height - boxes[0].height) < 1));
      } else {
        assert(boxes.every(r => Math.abs(r.x - boxes[0].x) < 1 && Math.abs(r.width - boxes[0].width) < 1),'Mobile cards use one consistent column');
        assert(boxes.every((r,i) => i === 0 || r.y >= boxes[i-1].y + boxes[i-1].height),'Mobile cards do not overlap');
        for (const card of await cards.all()) {
          const image = await card.locator('.home-risk-card__image, .home-risk-card__icon').boundingBox();
          const title = await card.locator('h3').boundingBox();
          assert(image && title && image.x + image.width < title.x,'Mobile thumbnail sits beside the text');
          assert.equal(await card.locator('.home-risk-card__count .site-icon').evaluate(el => getComputedStyle(el).opacity),'1','Mobile navigation arrow remains visible');
        }
      }
    }
    await page.evaluate(() => document.documentElement.style.fontSize='200%');
    assert.equal(await root.evaluate(el => el.scrollWidth > el.clientWidth + 1),false,'320px with 200% text');
    await page.evaluate(() => document.documentElement.style.removeProperty('font-size'));
    await page.emulateMedia({reducedMotion:'reduce'});
    await cards.first().hover();
    assert.equal(await cards.first().evaluate(el => getComputedStyle(el).transform),'none');
    if (artifacts) {
      fs.mkdirSync(artifacts,{recursive:true});
      await page.setViewportSize({width:1440,height:1000});await root.scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(artifacts,'home-risks-desktop.png')});
      await page.setViewportSize({width:390,height:1000});await root.scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(artifacts,'home-risks-mobile.png')});
    }
    const noJsContext = await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
    const noJs = await noJsContext.newPage();await noJs.goto(base + '/');
    assert.equal(await noJs.locator('[data-home-risk-card]').count(),5);
    await noJs.locator('[data-home-risk-card]').first().click();
    await noJs.waitForURL(new URL(data[0].href,base).href);
    assert.equal(await noJs.locator('[data-risk-card]').count(),data[0].count);
    await noJsContext.close();
    assert.deepEqual(errors,[]);
    console.log('Home v2 risks smoke passed: five CMS groups, images, destination counts, root redirect, keyboard/hover, responsive/text scaling, no JavaScript.');
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode=1;});
