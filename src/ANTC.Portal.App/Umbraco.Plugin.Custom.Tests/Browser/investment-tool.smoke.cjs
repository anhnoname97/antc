// Public UI and routing only; no CMS writes or persisted answers.
const { chromium } = require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.ANTC_TEST_URL || 'http://localhost:11000';
const path = '/hay-tu-kiem-tra/truoc-khi-dau-tu-vay/';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport:{width:1440,height:1000} });
  const errors=[], requests=[];
  let interacting=false;
  page.on('pageerror', e=>errors.push(e.message));
  page.on('request', r=>{if(interacting)requests.push([r.method(),r.url()]);});
  const choose=label=>page.locator('.self-check-options').getByRole('button',{name:label,exact:true}).click();
  const state=code=>page.locator('.self-check-state--'+code).waitFor();
  const reset=()=>page.getByRole('button',{name:'Làm lại từ đầu',exact:true}).click();
  try {
    assert.equal((await page.goto(base+path)).status(),200);
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('h1').innerText(),'Trước khi đầu tư, vay');
    assert.equal(await page.locator('.self-check-advice').count(),1);
    assert.equal(await page.locator('.self-check-must li').count(),2);
    assert.match(await page.locator('.self-check-must').innerText(),/Thua lỗ do biến động thị trường không phải là lừa đảo/);
    const initial=await page.evaluate(()=>[JSON.stringify(localStorage),JSON.stringify(sessionStorage)]);
    const data=JSON.parse(await page.locator('[data-self-check-data]').textContent());
    assert.equal(data.questions.length,5);
    assert.equal(data.ready,true);
    assert.deepEqual(data.questions.map(q=>q.kind),['phaiDung','phaiDung','tamHoan','canKiemTra','canKiemTra']);
    interacting=true;
    await choose('Có'); await state('d');
    assert.equal(await page.locator('.self-check-state h2').innerText(),'Không nên tham gia');
    assert.equal(await page.locator('.self-check-reasons li').count(),1);
    assert.equal(await page.locator('.self-check-actions li').count(),3);
    assert.match(await page.locator('.self-check-actions li').nth(0).innerText(),/Xin toàn bộ điều kiện bằng văn bản/);
    assert.match(await page.locator('.self-check-actions li').nth(1).innerText(),/Không vay tiền/);
    await page.getByRole('button',{name:'← Sửa câu trả lời',exact:true}).click();
    assert.equal(await page.locator('[data-answer=co]').getAttribute('aria-pressed'),'true');
    await choose('Không'); await choose('Không'); await choose('Không');
    assert.match(await page.locator('.self-check-question__help').innerText(),/Đầu tư:.*Vay:/s);
    assert.equal(await page.locator('.self-check-options button').count(),3);
    await choose('Rồi, đã rõ'); await choose('Rồi'); await state('n');
    assert.equal(await page.locator('.self-check-state h2').innerText(),'Cần thẩm định kỹ');
    assert.equal(await page.locator('.self-check-actions li').count(),2);
    assert.match(await page.locator('.self-check-state').innerText(),/không có nghĩa giao dịch an toàn/);
    await page.locator('.self-check-review summary').click();
    await page.getByRole('button',{name:'Sửa câu 2',exact:true}).click();
    await choose('Có'); await state('d');
    assert.equal(await page.locator('.self-check-review__row').count(),2);
    await reset();
    await choose('Tôi chưa biết'); await choose('Không'); await choose('Không'); await choose('Rồi, đã rõ'); await choose('Rồi'); await state('h');
    assert.equal(await page.locator('.self-check-state h2').innerText(),'Rủi ro cao');
    assert.equal(await page.locator('.self-check-actions li').count(),3);
    await reset();
    await choose('Không'); await choose('Không'); await choose('Có'); await choose('Chưa rõ'); await choose('Chưa'); await state('h');
    assert.equal(await page.locator('.self-check-reasons li').count(),3);
    assert.deepEqual(await page.evaluate(()=>[JSON.stringify(localStorage),JSON.stringify(sessionStorage)]),initial);
    assert.deepEqual(requests,[],'Answers triggered network traffic');
    interacting=false;
    const links=await page.locator('[data-self-check-more] a').evaluateAll(es=>es.map(e=>e.getAttribute('href')));
    assert.equal(links.length,4);
    assert.equal(await page.locator('[data-self-check-more] .self-check-card--pending').count(),0);
    for (const href of links) {
      const response=await page.request.get(base+href); assert.equal(response.status(),200);
      const body=await response.text();
      if(href.includes('/huong-dan/'))assert.match(body,/Đừng trả phí cho người hứa lấy lại tiền/);
      else assert.match(body,/data-self-check-checklist/);
      if(href.includes('tien-da-dua'))assert.match(body,/Nếu đây là hợp đồng hợp pháp mà bạn chưa hiểu hết/);
    }
    await page.emulateMedia({media:'print'});
    assert.equal(await page.locator('.self-check-controls').isVisible(),false);
    assert.equal(await page.locator('.self-check-state--h').isVisible(),true);
    await page.emulateMedia({media:'screen'});
    await page.reload(); await page.locator('.self-check-position').waitFor();
    assert.equal(await page.locator('.self-check-position').innerText(),'Câu 1 / 5');
    assert.equal(await page.locator('[aria-pressed=true].self-check-option').count(),0);
    for(const width of [1440,768,390,320]) {
      await page.setViewportSize({width,height:1000});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Overflow '+width);
    }
    await page.locator('[data-font-toggle]').click(); await page.locator('[data-font-toggle]').click();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    for(const old of ['/quan-ly-trang/trang-chu/hay-tu-kiem-tra/truoc-khi-dau-tu-vay/','/cong-cu-checklist/truoc-khi-dau-tu-vay/']) {
      const redirect=await page.request.get(base+old+'?source=test',{maxRedirects:0});
      assert.equal(redirect.status(),301); assert.equal(redirect.headers().location,path+'?source=test');
    }
    await page.goto(base+'/hay-tu-kiem-tra/');
    assert.equal(await page.locator(`a.self-check-card[href="${path}"]`).count(),1);
    assert.deepEqual(errors,[]);
    console.log('PASS: investment questions, D/H/N, editing, advice, source content, draft checklist isolation, print, mobile/font, privacy and redirects.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
