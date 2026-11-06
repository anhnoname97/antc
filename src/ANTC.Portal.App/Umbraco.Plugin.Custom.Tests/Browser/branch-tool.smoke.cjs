const { chromium } = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base=process.env.ANTC_TEST_URL || 'http://localhost:11000';
const path='/hay-tu-kiem-tra/khi-nghi-bi-lua/';
(async()=>{
  const browser=await chromium.launch();
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[],requests=[];let interacting=false;
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(interacting && !(r.method()==='GET' && r.resourceType()==='font' && r.url().startsWith(base+'/assets/fonts/')))requests.push([r.method(),r.url()]);});
  const choose=a=>page.locator(`[data-answer=${a}]`).click();
  const reset=()=>page.getByRole('button',{name:'Làm lại từ đầu',exact:true}).click();
  try {
    assert.equal((await page.goto(base+path)).status(),200);
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('h1').innerText(),'Khi nghi ngờ bị lừa');
    assert.match(await page.locator('#self-check-urgent-title').innerText(),/nguy hiểm tức thời/);
    assert.match(await page.locator('.self-check-urgent').innerText(),/113/);
    const data=JSON.parse(await page.locator('[data-self-check-data]').textContent());
    assert.equal(data.ready,true);assert.equal(data.questions.length,4);
    assert.deepEqual(data.questions.map(q=>q.actions.length),[4,4,4,4]);
    assert.match(data.questions[2].actions[2].text,/Lưu lại bằng chứng/);
    assert.match(data.questions[2].actions[3].text,/Đến Công an/);
    const storageBefore=await page.evaluate(()=>[JSON.stringify(localStorage),JSON.stringify(sessionStorage)]);
    interacting=true;
    for (let i=0;i<4;i++) {
      assert.equal(await page.locator('.self-check-position').innerText(),`Câu ${i+1} / 4`);
      assert.equal(await page.locator('[data-answer=n]').innerText(),i<2?'Không':'Chưa');
      await choose('n');
    }
    await page.locator('.self-check-state--n').waitFor();
    assert.equal(await page.locator('.self-check-state h2').innerText(),'Bạn chưa mất gì');
    assert.equal(await page.locator('.self-check-actions li').count(),3);
    assert.equal(await page.locator('[data-self-check-more] a').count(),2);
    assert.equal(await page.locator('[data-self-check-more] .self-check-card--pending').count(),0);
    await reset();
    // All groups must appear, including unknown, without stopping at the first yes.
    await choose('y'); await choose('u'); await choose('y'); await choose('u');
    await page.locator('.self-check-state--d').waitFor();
    assert.equal(await page.locator('.self-check-state h2').innerText(),'Có 4 việc cần xử lý, làm theo thứ tự dưới đây');
    assert.deepEqual(await page.locator('.self-check-branch-group').evaluateAll(es=>es.map(e=>e.dataset.question)),['1','2','3','4']);
    assert.equal(await page.locator('.self-check-branch-group h2 small').count(),2);
    assert.equal(await page.locator('.self-check-actions li').count(),16);
    assert.equal(await page.locator('.self-check-bank-hint').count(),3);
    assert.equal(await page.locator('[data-self-check-hit-notes]').isVisible(),true);
    await page.locator('.self-check-review summary').click();
    await page.getByRole('button',{name:'Sửa câu 2',exact:true}).click();
    assert.equal(await page.locator('[data-answer=u]').getAttribute('aria-pressed'),'true');
    await choose('n'); await choose('n'); await choose('n');
    await page.locator('.self-check-state--d').waitFor();
    assert.equal(await page.locator('.self-check-branch-group').count(),1);
    assert.equal(await page.locator('.self-check-branch-group').getAttribute('data-question'),'1');
    await reset();
    await choose('n'); await choose('n'); await choose('n');
    await page.getByRole('button',{name:'← Câu trước',exact:true}).click();
    assert.equal(await page.locator('.self-check-position').innerText(),'Câu 3 / 4');
    await choose('u'); await choose('n');
    await page.locator('.self-check-state--d').waitFor();
    assert.equal(await page.locator('.self-check-branch-group').getAttribute('data-question'),'3');
    assert.equal(await page.locator('.self-check-branch-group h2 small').count(),1);
    assert.deepEqual(await page.evaluate(()=>[JSON.stringify(localStorage),JSON.stringify(sessionStorage)]),storageBefore);
    assert.deepEqual(requests,[],'Answers sent requests');interacting=false;
    // Test every full guidance destination and its bank/telephone/cross-link content.
    for(const [i,q] of data.questions.entries()) {
      const response=await page.request.get(base+q.url);assert.equal(response.status(),200,q.url);
      const text=await response.text();
      if(i===0)assert.match(text,/href="tel:113"/);
      if(i===1) {assert.match(text,/Đừng vội gỡ ứng dụng/);assert.match(text,/đừng mở ứng dụng trên máy đó/);}
      if(i===2){assert.match(text,/href="\/hay-tu-kiem-tra\/huong-dan\/bao-ve-tai-khoan-va-dien-thoai\/"/);assert.match(text,/href="sms:5656"/);}
    }
    const noneSource=await page.request.get(base+'/hay-tu-kiem-tra/huong-dan/co-nguoi-dang-thuc-ban-lam-ngay/');assert.equal(noneSource.status(),200);assert.match(await noneSource.text(),/href="tel:156"/);
    for(const width of [1440,768,390,320]) {
      await page.setViewportSize({width,height:1000});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Result overflow '+width);
    }
    await page.locator('[data-font-toggle]').click();await page.locator('[data-font-toggle]').click();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await page.emulateMedia({media:'print'});
    assert.equal(await page.locator('.self-check-controls').isVisible(),false);
    assert.equal(await page.locator('.self-check-branch-group').isVisible(),true);
    await page.emulateMedia({media:'screen'});
    await page.reload();await page.locator('.self-check-position').waitFor();
    assert.equal(await page.locator('.self-check-position').innerText(),'Câu 1 / 4');
    assert.equal(await page.locator('.self-check-option[aria-pressed=true]').count(),0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    for(const old of ['/quan-ly-trang/trang-chu/hay-tu-kiem-tra/khi-nghi-ngo-bi-lua/','/cong-cu-checklist/khi-nghi-bi-lua/','/hay-tu-kiem-tra/khi-nghi-ngo-bi-lua/']) {
      const response=await page.request.get(base+old+'?source=test',{maxRedirects:0});assert.equal(response.status(),301);assert.equal(response.headers().location,path+'?source=test');
    }
    await page.goto(base+'/hay-tu-kiem-tra/');assert.equal(await page.locator(`a.self-check-card[href="${path}"]`).count(),1);
    const noJs=await browser.newContext({javaScriptEnabled:false});const plain=await noJs.newPage();await plain.goto(base+path);assert.equal(await plain.locator('noscript a').count(),4);await noJs.close();
    assert.deepEqual(errors,[]);
    console.log('PASS: four questions, unknown/priority groups, correct money steps, none result, editing/back/reset/privacy, guidance links, print, mobile/large text, no-JS fallback and redirects.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
