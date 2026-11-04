// Read-only browser and validation checks for the branch tool. No saves or publishes.
const {chromium}=require(process.env.ANTC_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');const {randomUUID}=require('node:crypto');const path=require('node:path');const fs=require('node:fs');
const base=process.env.ANTC_TEST_URL||'http://localhost:11000',id=process.env.ANTC_BRANCH_TOOL_ID||'d5b92e9b-7470-40b1-916d-4a718360d9a4';
const val=(d,a)=>d.values.find(v=>v.alias===a)?.value;const nested=(r,a)=>r.values.find(v=>v.alias===a);
function set(d,alias,value){const p=d.values.find(v=>v.alias===alias);if(p)p.value=value;else d.values.push({alias,value,culture:null,segment:null});}
function resize(list,count){const rows=Array.from({length:count},()=>({...structuredClone(list.contentData[0]),key:randomUUID()}));list.contentData=rows;list.layout['Umbraco.BlockList']=rows.map(r=>({contentKey:r.key}));list.expose=rows.map(r=>({contentKey:r.key,culture:null,segment:null}));}
async function api(page,method,options){return page.evaluate(async({method,options})=>{const {DocumentService}=await import('@umbraco-cms/backoffice/external/backend-api');const r=await DocumentService[method]({...options,throwOnError:false});return {status:r.response.status,data:r.data,error:r.error};},{method,options});}
(async()=>{
 assert(process.env.ANTC_BACKOFFICE_USERNAME&&process.env.ANTC_BACKOFFICE_PASSWORD,'Set backoffice credentials.');
 const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1600,height:1100},reducedMotion:'reduce'});page.setDefaultTimeout(20000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const out=process.env.ANTC_SELF_CHECK_ARTIFACTS;if(out)fs.mkdirSync(out,{recursive:true});
 try{
  await page.goto(`${base}/umbraco`);await page.locator('input[name=username]').fill(process.env.ANTC_BACKOFFICE_USERNAME);await page.locator('input[name=password]').fill(process.env.ANTC_BACKOFFICE_PASSWORD);
  await page.getByRole('button',{name:/^(Đăng nhập|Login|Log in)$/}).click();await page.getByRole('button',{name:/Hồ sơ người dùng|User profile/}).waitFor({timeout:45000});
  await page.goto(`${base}/umbraco/section/content/workspace/document/edit/${id}`);const field=a=>page.locator(`umb-content-workspace-property[alias="${a}"]`);
  await field('title').waitFor({timeout:30000});assert.equal(await field('title').locator('input').inputValue(),'Khi nghi ngờ bị lừa');
  for(const a of ['slug','icon','card','lead','urgT','urg','bq','noneT','none','noneAct','hitT','hitX','more','illustration','illustrationAlt'])await field(a).waitFor();
  const original=(await api(page,'getDocumentById',{path:{id}})).data;
  assert.equal(val(original,'slug'),'khi-nghi-bi-lua');assert.equal(val(original,'urgT'),'Đang có nguy hiểm tức thời?');
  assert.equal(val(original,'noneT'),'Bạn chưa mất gì');assert.equal(val(original,'hitT'),'Có {n} việc cần xử lý, làm theo thứ tự dưới đây');
  const rows=val(original,'bq').contentData;assert.equal(rows.length,4);
  assert.deepEqual(rows.map(r=>nested(r,'take').value),['1,2,3,4','1,2,4,6','1,2,3,4','1,2,3,8']);
  assert.deepEqual(rows.map(r=>nested(r,'yes').value||''),['','','Rồi','Rồi']);assert.deepEqual(rows.map(r=>nested(r,'no').value||''),['','','Chưa','Chưa']);
  assert.deepEqual(val(original,'noneAct').contentData.map(r=>nested(r,'step').value),[1,2,4]);assert.equal(val(original,'more').contentData.length,2);
  const body={template:original.template,variants:original.variants,values:structuredClone(original.values),cultures:['*']};
  // Existing valid reference used only for the validator; never written into mockup links.
  const target=[{type:'document',unique:process.env.ANTC_ACTION_TEST_ID||'c306935d-90ce-427e-9309-802a3ff9b1a5'}];
  for(const r of val(body,'bq').contentData)nested(r,'to').value=target;
  for(const r of val(body,'noneAct').contentData)nested(r,'page').value=target;
  for(const r of val(body,'more').contentData)nested(r,'trang').value=target;
  let result=await api(page,'putDocumentByIdValidate',{path:{id},body});assert(result.status<300,JSON.stringify(result));
  const bad=[];for(const [a,max] of [['title',90],['card',160],['lead',240],['urgT',80],['urg',300],['noneT',80],['none',300],['hitT',120],['hitX',300],['seoTitle',60],['seoDescription',160],['illustrationAlt',160]])bad.push([`${a} too long`,d=>set(d,a,'x'.repeat(max+1))]);
  bad.push(['slug format',d=>set(d,'slug','Sai đường dẫn')],['slug too long',d=>set(d,'slug','x'.repeat(61))],
   ['1 branch',d=>resize(val(d,'bq'),1)],['9 branches',d=>resize(val(d,'bq'),9)],
   ['question too long',d=>nested(val(d,'bq').contentData[0],'q').value='x'.repeat(301)],
   ['label too long',d=>nested(val(d,'bq').contentData[0],'label').value='x'.repeat(121)],
   ['yes too long',d=>nested(val(d,'bq').contentData[0],'yes').value='x'.repeat(21)],
   ['no too long',d=>nested(val(d,'bq').contentData[0],'no').value='x'.repeat(21)],
   ['missing target',d=>nested(val(d,'bq').contentData[0],'to').value=[]],
   ['missing steps',d=>nested(val(d,'bq').contentData[0],'take').value=''],
   ['step zero',d=>nested(val(d,'bq').contentData[0],'take').value='0,2'],
   ['non-numeric step',d=>nested(val(d,'bq').contentData[0],'take').value='1,a'],
   ['empty step',d=>nested(val(d,'bq').contentData[0],'take').value='1,,2'],
   ['steps too long',d=>nested(val(d,'bq').contentData[0],'take').value='1'.repeat(41)],
   ['5 actions',d=>resize(val(d,'noneAct'),5)],['7 links',d=>resize(val(d,'more'),7)]);
  for(const [name,mutate] of bad){const invalid=structuredClone(body);mutate(invalid);result=await api(page,'putDocumentByIdValidate',{path:{id},body:invalid});assert(result.status>=400,`Missing validation ${name}: ${JSON.stringify(result)}`);}
  await field('bq').scrollIntoViewIfNeeded();const cards=field('bq').locator('umb-block-list-entry');await cards.nth(3).locator('ufm-antc-question-label').first().waitFor();assert.equal(await cards.count(),4);
  const first=cards.first(),badge=first.locator('ufm-antc-question-label').first().locator('.badge');assert.equal((await badge.innerText()).trim(),'Bước 1,2,3,4');assert(!await first.getByRole('combobox').count());
  await first.hover();assert.equal(await first.locator('uui-symbol-expand').first().evaluate(e=>getComputedStyle(e).display),'none');
  if(out)await page.screenshot({path:path.join(out,'branch-cards.png')});
  await first.getByRole('button').first().click();
  // Match by stored value so the test does not depend on Umbraco's internal property wrapper tags.
  const inputs=first.locator('input');
  await inputs.last().waitFor();
  let stepIndex=-1;for(let i=0;i<await inputs.count();i++)if(await inputs.nth(i).inputValue()==='1,2,3,4')stepIndex=i;
  assert(stepIndex>=0,'Step editor is missing');const editor=inputs.nth(stepIndex);
  await editor.fill('1,3');await badge.getByText('Bước 1,3',{exact:true}).waitFor();await editor.fill('1,2,3,4');
  if(out)await page.screenshot({path:path.join(out,'branch-question.png')});
  await page.waitForLoadState('networkidle');await page.getByRole('tab',{name:'SEO và chia sẻ',exact:true}).click();
  for(const a of ['pageUrl','seoTitle','seoDescription','ogImage','hideFromSearch','canonicalUrl','updatedDate'])await field(a).waitFor();
  const seo=field('seoTitle').locator('input'),old=await seo.inputValue();await seo.fill('Kiểm tra SEO phân nhánh');
  await page.getByRole('tab',{name:'Nội dung',exact:true}).last().click();await field('title').waitFor();await page.getByRole('tab',{name:'SEO và chia sẻ',exact:true}).click();assert.equal(await seo.inputValue(),'Kiểm tra SEO phân nhánh');await seo.fill(old);
  if(out)await page.screenshot({path:path.join(out,'branch-seo.png')});
  assert.deepEqual((await api(page,'getDocumentById',{path:{id}})).data.values,original.values);assert.deepEqual(errors,[]);
  console.log(`PASS: branch form, 4 questions, result groups, image, live step badges, SEO and ${bad.length} validation cases. No content saved.`);
 }catch(e){if(out)await page.screenshot({path:path.join(out,'branch-error.png')});console.error('Browser errors:',errors);throw e;}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
