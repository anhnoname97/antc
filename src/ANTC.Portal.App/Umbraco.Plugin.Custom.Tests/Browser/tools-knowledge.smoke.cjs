// Public-only acceptance: real question API and isolated browser practice storage; no contest entries or CMS writes.
const {chromium} = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({viewport:{width:1440,height:1000}, reducedMotion:'reduce'});
  const page = await context.newPage();
  const errors = [], writes = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (r.method() !== 'GET' && r.method() !== 'HEAD') writes.push(r.url()); });
  try {
    const sample = await (await page.request.get(base+'/api/v1/quiz/sample')).json();
    assert.equal(sample.length, 8);
    await page.goto(base+'/thu-suc/');
    await page.locator('.qzo').first().waitFor();
    const storage = await page.evaluate(() => [JSON.stringify(localStorage), JSON.stringify(sessionStorage)]);
    for (const [i, q] of sample.entries()) {
      await page.locator(`[data-dot="${i}"]`).click();
      assert.equal(await page.locator('.qzq').innerText(), q.q);
      const chosen = i % 2 ? q.ans : q.opt.find(([k]) => k !== q.ans)[0];
      await page.locator(`.qzo[data-k="${chosen}"]`).click();
      assert.equal(await page.locator('.qzo:not(:disabled)').count(), 0);
      assert.equal(await page.locator('.qzexp > p').count(), q.opt.length);
      for (const [, explanation] of Object.entries(q.exp)) assert((await page.locator('.qzexp').innerText()).includes(explanation));
      assert.equal((await page.request.get(base+await page.locator('.quiz-more a').getAttribute('href'))).status(),200);
    }
    assert.match(await page.locator('.quiz-nav a').innerText(), /200 câu/);
    assert.deepEqual(await page.evaluate(() => [JSON.stringify(localStorage), JSON.stringify(sessionStorage)]), storage);
    await page.reload(); await page.locator('.qzo:not(:disabled)').first().waitFor();

    await page.goto(base+'/ngan-hang/#doanh-nghiep');
    await page.locator('#doanh-nghiep a').first().waitFor();
    assert.equal(await page.locator('#doanh-nghiep a').count(),3);
    assert.match(await page.locator('#examview .pageh-lead').innerText(),/200 câu/);
    assert.equal(await page.locator('#examview .toplist').first().locator('.lock').count(),7);
    assert.equal(await page.locator('head link[rel=canonical]').getAttribute('href'),base+'/ngan-hang/');
    assert.match(await page.title(),/Tự luyện 200 câu/);
    const topics = await (await page.request.get(base+'/api/v1/quiz/topics')).json();
    const common = topics.filter(t=>t.audience!=='enterprise'), enterprise=topics.filter(t=>t.audience==='enterprise');
    assert.equal(common.length,8); assert.equal(common.reduce((n,t)=>n+t.count,0),200);
    assert.deepEqual(enterprise.map(t=>t.count),[18,36,24]);
    await page.clock.install();
    // All enterprise questions, then the foundation gate: exercise timing, both result states and completion.
    for (const t of [...enterprise, common[0]]) {
      console.log('Practice topic',t.cd);
      await page.goto(base+'/ngan-hang/#chuyen-de-'+t.cd);
      await page.locator('[data-start]').waitFor();
      assert.equal(await page.locator('.exam__intro p').count(),t.intro.length);
      if(t.audience==='enterprise') assert.equal(await page.locator('.exam__actions a').count(),1,'No invented source article');
      else assert.equal((await page.request.get(base+await page.getByRole('link',{name:'Đọc bài trước đã'}).getAttribute('href'))).status(),200);
      const questions = await (await page.request.get(base+'/api/v1/quiz/topics/'+t.cd+'/questions')).json();
      await page.locator('[data-start]').click();
      for(const [i,q] of questions.entries()) {
        await page.locator('#qq').waitFor();
        assert.equal(await page.locator('#qq').innerText(),q.q);
        const chosen=i===0?q.opt.find(([k])=>k!==q.ans)[0]:q.ans;
        await page.locator(`.qopt[data-k="${chosen}"]`).click();
        await page.locator('#qhead').waitFor();
        assert((await page.locator('.qexp').innerText()).includes(q.exp[q.ans]));
        assert.equal(await page.locator('.qexp > p').count(),Object.values(q.exp).filter(Boolean).length);
        if(q.sec>0) assert(await page.locator('#qnext').isDisabled());
        await page.clock.fastForward((q.sec+1)*1000);
        await page.locator('#qnext:not(:disabled)').click();
      }
      await page.locator('.exam__done').waitFor();
      assert.match(await page.locator('.exam__done').innerText(),new RegExp(`đúng ${questions.length-1} trên ${questions.length} câu`));
    }
    await page.goto(base+'/ngan-hang/'); await page.locator('#examview .toplist a').first().waitFor();
    assert.equal(await page.locator('#examview .toplist').first().locator('.lock').count(),0,'Foundation completion unlocks seven general topics');
    for (const t of common.slice(1)) {
      await page.goto(base+'/ngan-hang/#chuyen-de-'+t.cd); await page.locator('[data-start]').waitFor();
      const questions=await(await page.request.get(base+'/api/v1/quiz/topics/'+t.cd+'/questions')).json();
      await page.locator('[data-start]').click(); await page.locator('#qq').waitFor();
      assert.equal(await page.locator('#qq').innerText(),questions[0].q);
      await page.locator(`.qopt[data-k="${questions[0].ans}"]`).click(); await page.locator('#qhead').waitFor();
      for(const width of [1440,768,390,320]) { await page.setViewportSize({width,height:1000}); assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Question overflow '+t.cd+'/'+width); }
    }
    assert.deepEqual(writes,[],'Practice must not submit contest answers or register participants');
    assert.deepEqual(errors,[]);
    console.log('PASS: 8 samples, 200 common + 78 enterprise counts, all A/B/C questions and reading timers, results/retry navigation, foundation gate, seven other topic intros/questions, source links, mobile and no server writes.');
  } catch(error) { console.error('Page at failure',page.url(),(await page.locator('#examview').innerText()).slice(0,1200)); await page.screenshot({path:'artifacts/self-check/tools-demo-20261111/knowledge-failure.png'}); throw error; } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
