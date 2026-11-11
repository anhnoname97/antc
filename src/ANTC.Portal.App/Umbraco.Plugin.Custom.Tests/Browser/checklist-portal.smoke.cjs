// Public-only checks. Does not modify CMS or upload the printed test PDF.
const {chromium}=require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const base=process.env.ANTC_TEST_URL || 'http://localhost:11000';
(async()=>{
  const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[],requests=[];let interacting=false;
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(interacting && !(r.method()==='GET' && r.resourceType()==='font' && r.url().startsWith(base+'/assets/fonts/')))requests.push([r.method(),r.url()]);});
  const submit=()=>page.getByRole('button',{name:'Xem kết quả',exact:true}).click();
  try{
    assert.equal((await page.goto(base+'/hay-tu-kiem-tra/')).status(),200);
    const links=await page.locator('.self-check-lists a').evaluateAll(es=>es.map(e=>({url:e.getAttribute('href'),title:e.querySelector('b').textContent})));
    assert.equal(links.length,8);const sources=[];
    for(const [index,link]of links.entries()){
      assert.equal((await page.goto(base+link.url)).status(),200,link.url);await page.waitForLoadState('networkidle');
      assert.equal(await page.locator('h1').innerText(),link.title);
      assert.doesNotMatch(await page.locator('.self-check-checklist-meta').innerText(),/Phiên bản/);
      assert.match(await page.locator('.self-check-checklist-meta').innerText(),/Ngày rà soát:/);
      const data=JSON.parse(await page.locator('[data-checklist-data]').textContent());
      assert.equal(data.ready,true);assert.equal(data.questions.length,5);
      assert.equal(await page.locator('[data-checklist-question]').count(),5);
      assert.equal(await page.locator('[data-checklist-item]').count(),[6,8,7,8,7,7,6,8][index]);
      assert.equal(await page.locator('[data-checklist-item]').count(),data.items.length);
      assert.equal(await page.locator('a[download]').count(),0,'No selected PDF should create a fake download');
      assert.equal(await page.locator('[data-checklist-form] form').count(),0);
      const source=await page.locator('.self-check-source-link').getAttribute('href');
      assert.equal(source,`/hay-tu-kiem-tra/bai-doc/chuyen-de-${index+1}/`);sources.push(source);
      assert.equal((await page.request.get(base+source)).status(),200);
      const storage=await page.evaluate(()=>[JSON.stringify(localStorage),JSON.stringify(sessionStorage)]);
      interacting=true;
      await submit();assert.match(await page.locator('[data-checklist-error]').innerText(),/Còn 5 câu/);
      assert.equal(await page.locator('.self-check-state').count(),0);
      assert.equal(await page.locator('input:focus').getAttribute('name'),'checklist-answer-0');
      for(let q=0;q<5;q++)await page.locator(`input[name=checklist-answer-${q}][value=n]`).check();
      await submit();await page.locator('.self-check-state--h').waitFor();
      assert.equal(await page.locator('.self-check-reasons li').count(),data.items.length);
      assert.equal(await page.locator('.self-check-checklist-action').innerText(),'Làm ngay: '+data.holdAction);
      for(const box of await page.locator('[data-checklist-item]').all())await box.check();
      assert.equal(await page.locator('.self-check-state').count(),0,'Changing answers must clear stale results');
      await submit();await page.locator('.self-check-state--n').waitFor();
      assert.match(await page.locator('.self-check-state').innerText(),/không có nghĩa giao dịch an toàn/);
      await page.locator('input[name=checklist-answer-0][value=u]').check();await submit();await page.locator('.self-check-state--h').waitFor();
      assert.equal(await page.locator('.self-check-reasons li').count(),1);
      await page.locator('input[name=checklist-answer-0][value=y]').check();await submit();await page.locator('.self-check-state--d').waitFor();
      assert.equal(await page.locator('.self-check-checklist-action').innerText(),'Làm ngay: '+data.stopAction);
      assert.equal(await page.locator('[data-checklist-output] a').getAttribute('href'),'/khan-cap/');
      await page.getByRole('button',{name:'Xóa đánh dấu',exact:true}).click();
      assert.equal(await page.locator('[data-checklist-item]:checked').count(),0);
      assert.equal(await page.locator('input[type=radio]:checked').count(),5);
      await page.getByRole('button',{name:'Làm lại từ đầu',exact:true}).click();
      assert.equal(await page.locator('input:checked').count(),0);
      assert.equal(await page.locator('.self-check-state').count(),0);
      assert.deepEqual(await page.evaluate(()=>[JSON.stringify(localStorage),JSON.stringify(sessionStorage)]),storage);
      interacting=false;
      for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`Checklist ${index+1} overflow ${width}`);}
      await page.setViewportSize({width:1440,height:1000});
      const old=await page.request.get(base+'/quan-ly-noi-dung/danh-sach-kiem-tra/'+link.url.split('/').filter(Boolean).at(-1)+'/?ref=test',{maxRedirects:0});
      assert.equal(old.status(),301);assert.equal(old.headers().location,link.url+'?ref=test');
    }
    // The full source articles remain readable at phone size, including tables.
    for(const source of sources){await page.goto(base+source);const reading=page.locator('.self-check-reading-body, [data-reading-body]');assert((await reading.innerText()).length>4000);assert.equal(await reading.locator('.k-stop').count(),1);assert.equal(await reading.locator('.k-pocket').count(),1);await page.setViewportSize({width:320,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,source);}
    await page.goto(base+links[0].url);await page.locator('[data-font-toggle]').first().click();await page.locator('[data-font-toggle]').first().click();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Large text overflow');
    const first=page.locator('input[name=checklist-answer-0][value=y]');await first.focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('input[name=checklist-answer-0][value=n]').isChecked(),true);
    await page.locator('[data-checklist-item]').first().check();await page.reload();assert.equal(await page.locator('input:checked').count(),0,'Reload retained answers');
    for(let q=0;q<5;q++)await page.locator(`input[name=checklist-answer-${q}][value=n]`).check();for(const box of await page.locator('[data-checklist-item]').all())await box.check();await submit();
    await page.emulateMedia({media:'print'});
    assert.equal(await page.locator('.site-header').isVisible(),false);assert.equal(await page.locator('[data-checklist-result]').isVisible(),false);assert.equal(await page.locator('.self-check-state--n').isVisible(),true);assert.equal(await page.locator('[data-checklist-question]').first().isVisible(),true);
    if(process.env.ANTC_CHECKLIST_PDF){const pdf=await page.pdf({path:process.env.ANTC_CHECKLIST_PDF,preferCSSPageSize:true,printBackground:true});assert.equal(pdf.subarray(0,4).toString(),'%PDF');assert(pdf.length>20000);}
    await page.emulateMedia({media:'screen'});
    const context=await browser.newContext({javaScriptEnabled:false});const plain=await context.newPage();await plain.goto(base+links[0].url);assert.equal(await plain.locator('[data-checklist-question]').count(),5);await plain.locator('input[type=radio]').first().check();await plain.getByRole('button',{name:'Xem kết quả',exact:true}).click();assert.equal(new URL(plain.url()).search,'');assert.equal(await plain.locator('noscript').isVisible(),true);await context.close();
    assert.deepEqual(requests,[],'Checklist interactions sent requests');assert.deepEqual(errors,[]);
    console.log('PASS: 8 checklists and source readings, missing-answer guard, D/H/N/actions, invalidation, reset/keyboard/privacy, all responsive widths, print/PDF, no-JS and redirects.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
