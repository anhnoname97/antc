// Read-only public metadata, link graph and sitemap checks. No CMS edits.
const {chromium}=require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const base=process.env.ANTC_TEST_URL || 'http://localhost:11000';
(async()=>{
 const browser=await chromium.launch();const context=await browser.newContext({javaScriptEnabled:false});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const queue=['/hay-tu-kiem-tra/'],seen=new Set(),records=[];let checkedImage=false;
 try{
  while(queue.length){
   const path=queue.shift();if(seen.has(path))continue;seen.add(path);
   const response=await page.goto(base+path+'?source=seo-test&answer=sample#result');assert.equal(response.status(),200,path);
   const head=page.locator('head');
   for(const selector of ['title','meta[name=description]','link[rel=canonical]','meta[property="og:type"]','meta[property="og:title"]','meta[property="og:description"]','meta[property="og:url"]','meta[name="twitter:card"]','meta[name="twitter:title"]','meta[name="twitter:description"]']) assert.equal(await head.locator(selector).count(),1,`${path}: ${selector}`);
   const meta=async selector=>head.locator(selector).getAttribute('content');
   const canonical=await head.locator('link[rel=canonical]').getAttribute('href');
   assert.equal(canonical,base+path);assert.equal(new URL(canonical).search,'');assert.equal(new URL(canonical).hash,'');
   assert.equal(await meta('meta[property="og:url"]'),canonical);
   const title=await meta('meta[property="og:title"]'),description=await meta('meta[name=description]');
   assert(title?.trim());assert(description?.trim());assert((await page.title()).startsWith(title));
   assert.equal(await meta('meta[property="og:description"]'),description);
   assert.equal(await meta('meta[name="twitter:title"]'),title);assert.equal(await meta('meta[name="twitter:description"]'),description);
   assert.equal(await meta('meta[property="og:type"]'),path.includes('/bai-doc/')||path.includes('/huong-dan/')?'article':'website');
   assert.equal(await head.locator('meta[property="og:image"]').count(),1);
   const image=await meta('meta[property="og:image"]');assert.match(image,/^https?:\/\//);
   assert(await meta('meta[property="og:image:alt"]'));assert.equal(await meta('meta[name="twitter:image"]'),image);
   assert.equal(await meta('meta[name="twitter:card"]'),'summary_large_image');
   if(!checkedImage){assert.equal((await page.request.get(image)).status(),200);checkedImage=true;}
   const robots=await head.locator('meta[name=robots]').count();assert(robots<=1,'Duplicate robots '+path);
   const noIndex=robots>0 && (await meta('meta[name=robots]')).includes('noindex');
   records.push({path,canonical,title,noIndex});
   const links=await page.locator('.self-check-page a[href]').evaluateAll(es=>es.map(e=>e.getAttribute('href')));
   for(const href of links){if(href.startsWith('/hay-tu-kiem-tra/') && !href.endsWith('.xml')){const clean=new URL(href,base).pathname;if(!seen.has(clean))queue.push(clean);}}
  }
  assert.equal(seen.size,28,'Expected landing, 3 tools, 8 checklists, 8 readings and 8 guides');
  const sitemap=await page.request.get(base+'/hay-tu-kiem-tra/sitemap.xml?answer=sample');assert.equal(sitemap.status(),200);
  assert.match(sitemap.headers()['content-type'],/application\/xml/);
  const xml=await sitemap.text();assert(!xml.includes('answer=sample'));
  const map=await page.evaluate(text=>{const doc=new DOMParser().parseFromString(text,'application/xml');return {errors:doc.querySelectorAll('parsererror').length,namespace:doc.documentElement.namespaceURI,urls:[...doc.querySelectorAll('url > loc')].map(e=>e.textContent)};},xml);
  assert.equal(map.errors,0);assert.equal(map.namespace,'http://www.sitemaps.org/schemas/sitemap/0.9');
  assert.deepEqual(map.urls.sort(),[...new Set(records.filter(r=>!r.noIndex).map(r=>r.canonical))].sort());
  assert.equal((await page.request.get(base+'/hay-tu-kiem-tra/bai-doc/chuyen-de-9/')).status(),404);
  await context.close();
  const active=await browser.newPage();await active.goto(base+'/hay-tu-kiem-tra/truoc-khi-chuyen-tien/?source=test');
  const before=await active.locator('head').innerHTML();await active.locator('[data-answer=co]').click();await active.locator('.self-check-state--d').waitFor();assert.equal(await active.locator('head').innerHTML(),before,'Answers changed share metadata');
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${seen.size} public pages, unique metadata/canonical, absolute default image, query-free share URL, robots, sitemap filtering, invalid source and stable metadata during answers.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
