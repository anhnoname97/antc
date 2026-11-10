// Read-only checks of the final v2 layout and server-rendered homepage SEO.
const {chromium} = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
const expected = process.env.ANTC_HOME_SEO_EXPECTED_FILE ? JSON.parse(fs.readFileSync(process.env.ANTC_HOME_SEO_EXPECTED_FILE,'utf8')) : null;
const artifacts = process.env.ANTC_HOME_ARTIFACTS;
const value = (doc,alias) => doc.values.find(v => v.alias===alias)?.value;

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({javaScriptEnabled:false,viewport:{width:1440,height:1000}});
  const page = await context.newPage();
  try {
    assert.equal((await page.goto(base+'/?utm_source=seo-check#noi-dung')).status(),200);
    const head = page.locator('head');
    const meta = selector => head.locator(selector).getAttribute('content');
    for (const selector of ['title','meta[name="description"]','link[rel="canonical"]','meta[property="og:type"]',
      'meta[property="og:title"]','meta[property="og:description"]','meta[property="og:url"]',
      'meta[property="og:locale"]','meta[property="og:site_name"]',
      'meta[name="twitter:card"]','meta[name="twitter:title"]','meta[name="twitter:description"]']) {
      assert.equal(await head.locator(selector).count(),1,`Unique ${selector}`);
    }
    let canonical = new URL(expected && value(expected.home,'canonicalUrl') || '/',base);
    canonical.search=''; canonical.hash='';
    assert.equal(await head.locator('link[rel="canonical"]').getAttribute('href'),canonical.href);
    assert.equal(await meta('meta[property="og:url"]'),canonical.href);
    assert.equal(await meta('meta[property="og:type"]'),'website');
    assert.equal(await meta('meta[property="og:locale"]'),'vi_VN');
    const title = await meta('meta[property="og:title"]');
    const description = await meta('meta[name="description"]');
    assert(title?.trim()); assert(description?.trim());
    assert.equal(await meta('meta[name="twitter:title"]'),title);
    assert.equal(await meta('meta[property="og:description"]'),description);
    assert.equal(await meta('meta[name="twitter:description"]'),description);
    if (expected) {
      const siteName=value(expected.site,'siteName') || 'antoantaichinh.vn';
      assert.equal(title,value(expected.home,'seoTitle') || value(expected.home,'title'));
      assert.equal(description,value(expected.home,'seoDescription') || value(expected.home,'description'));
      assert.equal(await meta('meta[property="og:site_name"]'),siteName);
      assert.equal(await page.title(),title===siteName ? title : `${title} — ${siteName}`);
      const noIndex=!!(value(expected.home,'hideFromSearch') || value(expected.site,'showPreviewBanner'));
      assert.equal(await head.locator('meta[name="robots"]').count(),noIndex ? 1 : 0);
      if (noIndex) assert.match(await meta('meta[name="robots"]'),/noindex/);
      const picked = value(expected.home,'ogImage')?.[0]?.mediaKey || value(expected.home,'illustration')?.[0]?.mediaKey;
      const media = expected.media.find(m => m.id===picked);
      if (media) {
        const file=value(media,'umbracoFile');
        const image=new URL(typeof file==='string' ? JSON.parse(file).src : file.src,base).href;
        assert.equal(await head.locator('meta[property="og:image"]').count(),1);
        assert.equal(await meta('meta[property="og:image"]'),image);
        assert.equal(await meta('meta[name="twitter:image"]'),image);
        assert.equal(await meta('meta[name="twitter:card"]'),'summary_large_image');
        assert.equal(await meta('meta[property="og:image:width"]'),String(value(media,'umbracoWidth')));
        assert.equal(await meta('meta[property="og:image:height"]'),String(value(media,'umbracoHeight')));
        assert.equal(await meta('meta[property="og:image:alt"]'),await meta('meta[name="twitter:image:alt"]'));
        if (picked===value(expected.home,'illustration')?.[0]?.mediaKey) {
          assert.equal(await meta('meta[property="og:image:alt"]'),value(expected.home,'illustrationAlt'));
        }
        assert.equal((await page.request.get(image)).status(),200);
      }
      const date=value(expected.home,'displayUpdatedDate');
      const validDate=date && new Date(date).getFullYear()>1900;
      assert.equal(await page.locator('[data-home-updated]').count(),validDate ? 1 : 0);
      assert.equal(await head.locator('meta[property="og:updated_time"]').count(),validDate ? 1 : 0);
      if (validDate) {
        assert.equal(await page.locator('[data-home-updated] time').getAttribute('datetime'),date.slice(0,10));
        assert.match(await meta('meta[property="og:updated_time"]'),new RegExp('^'+date.slice(0,10)));
      }
    }
    assert.equal(await page.locator('main h1').count(),1);
    for (const selector of ['[data-home-emergency]','[data-home-tools]','[data-home-risks]']) {
      assert.equal(await page.locator(selector).count(),1);
    }
    assert.equal(await page.locator('.home-content,.umb-block-grid,[data-site-sections],.intro-hero__copy').count(),0);
    const loadedAssets = await head.locator('link[rel="stylesheet"]').evaluateAll(nodes => nodes.map(el => new URL(el.href).pathname));
    const scripts = await page.locator('script[src]').evaluateAll(nodes => nodes.map(el => new URL(el.src).pathname));
    for (const old of ['home','home-responsive','story','website-check','official-contacts','safety-reminder']) {
      assert(!loadedAssets.includes(`/assets/css/${old}.css`),`Old CSS: ${old}`);
      assert(!scripts.includes(`/assets/js/${old}.js`),`Old JS: ${old}`);
    }
    assert(loadedAssets.includes('/assets/css/home-v2.css'));
    assert(scripts.includes('/assets/js/site.js'));
    const lastMainChild=page.locator('main > :last-child');
    assert.equal(await lastMainChild.evaluate(el => el.matches('[data-home-alerts],[data-home-risks],[data-home-updated]')),true);
    assert.equal(await page.locator('.site-header').count(),1);
    assert.equal(await page.locator('.site-footer').count(),1);
    for (const width of [1440,1024,768,390,320]) {
      await page.setViewportSize({width,height:1000});
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth>innerWidth+1),false,`Overflow without v1 assets at ${width}`);
    }
    if (artifacts) {
      fs.mkdirSync(artifacts,{recursive:true});
      await page.goto(base+'/');
      for (const [name,width] of [['desktop',1440],['mobile',390]]) {
        await page.setViewportSize({width,height:1000});
        for (const img of await page.locator('main img').all()) {
          await img.scrollIntoViewIfNeeded(); await img.evaluate(el => el.decode());
        }
        await page.evaluate(() => scrollTo(0,0));
        await page.screenshot({path:path.join(artifacts,`home-final-${name}.png`),fullPage:true});
      }
    }
    console.log('Home v2 SEO smoke passed: unique SSR metadata, root canonical without query, CMS share image/alt/dimensions, robots, optional editorial date, v2-only layout/assets, responsive and no JavaScript.');
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode=1;});
