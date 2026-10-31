const {chromium}=require(process.env.ANTC_PLAYWRIGHT_MODULE || 'playwright');
// Exercises the real Lit inbox UI with an isolated API and auth/modal adapters.
// Does not log in to Umbraco, send messages, or modify application databases.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),os=require('os');
const {execFileSync}=require('child_process');
const assetsVersion=fs.readFileSync(path.resolve(__dirname,'../../Directory.Build.props'),'utf8').match(/<UmbracoCoreVersion[^>]*>([^<]+)/)[1];
const packageFile=path.join(os.homedir(),'.nuget/packages/umbraco.cms.staticassets',assetsVersion,'umbraco.cms.staticassets.'+assetsVersion+'.nupkg');
const litModule=process.env.ANTC_LIT_MODULE?fs.readFileSync(process.env.ANTC_LIT_MODULE):execFileSync('unzip',['-p',packageFile,'staticwebassets/umbraco/backoffice/external/lit/index.js']);
const screenshot=process.env.ANTC_SCREENSHOT || path.join(os.tmpdir(),'antc-questions-inbox.png');
const root=path.resolve(__dirname,'../../Umbraco.Web.UI/wwwroot/App_Plugins/AntcQuestions');
const sample=[
[1042,'cau-hoi','Có người gọi báo tôi trúng thưởng xe máy, bắt nộp phí trước','Họ nói là chương trình tri ân khách hàng của nhà mạng, yêu cầu chuyển 2 triệu phí trước bạ thì mới giao xe. Tôi có nên chuyển không?','moi'],
[1041,'cau-hoi','Có người giả ngân hàng yêu cầu tôi đọc mã OTP','Người gọi bảo cần mã OTP để khóa tài khoản, tôi nên làm gì?','moi'],
[1050,'cau-hoi','Người lạ gọi xin mã OTP để làm gì?','Tôi cần làm gì khi người tự xưng ngân hàng yêu cầu mã OTP?','moi'],
[1040,'gop-y','Nên thêm cảnh báo về mã QR giả dán ở quán ăn','Gần nhà tôi có quán bị dán đè mã QR chuyển khoản.','moi'],
[1039,'kiennghi','Đề nghị chặn các trang tuyển dụng giả mạo trên mạng xã hội','Nhiều trang dùng tên công ty lớn để tuyển cộng tác viên.','dang-xu-ly'],
[1038,'cau-hoi','Ứng dụng vay đòi quyền truy cập danh bạ có hợp pháp không?','Tôi cài một ứng dụng vay, nó đòi quyền đọc danh bạ.','cho-duyet'],
[1037,'cau-hoi','Cách kiểm tra trang web ngân hàng thật hay giả','Tôi nhận được đường dẫn đăng nhập ngân hàng qua tin nhắn.','da-xu-ly']];
let rows=sample.map(([id,type,title,content,status],i)=>({id,type,content:title+'\n'+content,status,createdAt:new Date(Date.now()-i*3600000).toISOString(),source:'portal',createdBy:i===0?'N. T. Hoa':null,contact:'h•••@gmail.com',wantReply:true,reviewVersion:0,answer:i===0?'Chào bạn, bạn nên kiểm tra thông tin qua kênh chính thức trước khi quyết định.':'',adminNote:i===0?'Trường hợp khẩn, đã gọi lại hướng dẫn liên hệ ngân hàng lúc 08:55.':'',isPublished:i===5,assignedTo:'editor',guidanceLabel:'',guidanceUrl:''}));
let writes=[];let failNextApproval=false;
function matches(r,key){return key==='da-cong-khai'?r.isPublished:key==='da-tra-loi'?r.status==='da-xu-ly'&&!r.isPublished:key==='luu-tru'?['luu-tru','bo-qua'].includes(r.status):r.status===key&&!r.isPublished}
const page=`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font:14px Lato,Arial,sans-serif}antc-questions-section{height:100vh}</style><script type="importmap">${JSON.stringify({imports:{'@umbraco-cms/backoffice/external/lit':'/lit.js','@umbraco-cms/backoffice/lit-element':'/base.js','@umbraco-cms/backoffice/auth':'/auth.js','@umbraco-cms/backoffice/modal':'/modal.js','@umbraco-cms/backoffice/style':'/style.js'}})}</script></head><body><antc-questions-section></antc-questions-section><script type="module" src="/questions.section.js"></script></body></html>`;
const modules={
'/base.js':`import {LitElement} from '/lit.js';export class UmbLitElement extends LitElement{consumeContext(t,cb){queueMicrotask(()=>cb({getLatestToken:async()=>'',validateToken:async()=>true}))}async getContext(){return{open(){return{onSubmit:async()=>{}}}}}}`,
'/auth.js':`export const UMB_AUTH_CONTEXT={};`,
'/modal.js':`export const UMB_MODAL_MANAGER_CONTEXT={};export class UmbModalToken{constructor(a,b){}}export const UMB_CONFIRM_MODAL={};export async function umbOpenModal(){if(window.rejectDiscard)throw Error('cancelled')}`,
'/style.js':`import{css}from'/lit.js';export const UmbTextStyles=css\`\`;`};
const server=http.createServer(async(req,res)=>{const url=new URL(req.url,'http://localhost');res.setHeader('Content-Type','application/javascript');
if(url.pathname==='/'){res.setHeader('Content-Type','text/html');return res.end(page)}
if(modules[url.pathname])return res.end(modules[url.pathname]);if(url.pathname==='/lit.js')return res.end(litModule);
if(url.pathname.startsWith('/umbraco/management/api/v1/antc/questions')){
 res.setHeader('Content-Type','application/json');const endpoint=url.pathname.split('/questions')[1];let data='';for await(const chunk of req)data+=chunk;const body=data?JSON.parse(data):{};
 if(endpoint==='/aggregate'){
 const sources=body.items.map(item=>rows.find(r=>r.id===item.id));
 if(sources.some((r,i)=>!r||r.reviewVersion!==body.items[i].reviewVersion||r.isPublished||r.aggregatedIntoId)){res.statusCode=409;return res.end(JSON.stringify({error:{message:'Có câu hỏi đã thay đổi.'}}))}
 const id=2000+rows.filter(r=>r.source==='tong-hop').length;
 const summary={...sources[0],id,source:'tong-hop',status:'moi',content:body.draft.content,answer:body.draft.answer,adminNote:body.draft.adminNote,isPublished:false,reviewVersion:0,aggregatedIntoId:null,aggregatedSourceIds:sources.map(r=>r.id),guidanceLabel:'',guidanceUrl:'',assignedTo:''};
 sources.forEach(r=>{r.status='da-xu-ly';r.aggregatedIntoId=id;r.reviewVersion++});rows.unshift(summary);writes.push({id,path:endpoint,body});return res.end(JSON.stringify(summary));
 }
 if(endpoint==='/handlers')return res.end(JSON.stringify([{value:'editor',name:'Biên tập viên'},{value:'reviewer',name:'Quản trị viên'}]));
 if(endpoint==='/inbox-counts')return res.end(JSON.stringify(Object.fromEntries(['moi','dang-xu-ly','cho-duyet','da-tra-loi','da-cong-khai','luu-tru'].map(k=>[k,rows.filter(r=>matches(r,k)&&(!url.searchParams.get('type')||r.type===url.searchParams.get('type'))).length]))));
 if(!endpoint&&req.method==='POST'){const row={...rows[0],...body,id:3000,status:'moi',isPublished:false,source:'backoffice',reviewVersion:0,aggregatedIntoId:null,aggregatedSourceIds:[],createdAt:new Date().toISOString()};rows.unshift(row);writes.push({path:'',body});return res.end(JSON.stringify(row))}
 if(!endpoint){const filtered=rows.filter(r=>(!url.searchParams.get('inbox')||matches(r,url.searchParams.get('inbox')))&&(!url.searchParams.get('type')||r.type===url.searchParams.get('type'))&&(!url.searchParams.get('search')||r.content.includes(url.searchParams.get('search'))));return res.end(JSON.stringify({items:filtered,total:filtered.length,page:1,totalPages:1}))}
 const id=Number(endpoint.split('/')[1]),row=rows.find(r=>r.id===id);if(!row){res.statusCode=404;return res.end('{}')}
 if(req.method!=='GET'){writes.push({id,path:endpoint,body});if(endpoint.endsWith('/approve')&&failNextApproval){failNextApproval=false;res.statusCode=400;return res.end(JSON.stringify({error:{message:'Lỗi công bố mô phỏng, hãy thử lại.'}}))}if(body.reviewVersion!==row.reviewVersion){res.statusCode=409;return res.end(JSON.stringify({error:{message:'Câu hỏi đã được người khác xử lý.'}}))}Object.assign(row,body,{reviewVersion:row.reviewVersion+1});if(endpoint.endsWith('/approve')){row.isPublished=true;row.status='da-xu-ly'}if(endpoint.endsWith('/unpublish')||body.status==='luu-tru')row.isPublished=false}
 return res.end(JSON.stringify(row));
}
const f=path.join(root,url.pathname.slice(1));if(fs.existsSync(f))return res.end(fs.readFileSync(f));res.statusCode=404;res.end('');});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true});try{const p=await browser.newPage({viewport:{width:1445,height:768}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:'+server.address().port);await p.locator('.answer-editor').waitFor();const host=p.locator('antc-questions-section');
assert.equal(await host.locator('.message-item').count(),4);assert.equal(await host.locator('.mail-detail h2').textContent(),sample[0][2]);
const boxes=await host.evaluate(el=>{const q=x=>{const r=el.shadowRoot.querySelector(x).getBoundingClientRect();return{x:r.x,width:r.width}};return{left:q('.mail-sidebar'),list:q('.mail-list'),detail:q('.mail-detail'),overflow:el.shadowRoot.querySelector('.inbox-layout').scrollWidth>innerWidth}});assert.equal(boxes.left.width,230);assert.equal(boxes.list.width,362);assert(!boxes.overflow);
assert.equal(await host.getByLabel('Người được phân công xử lý').inputValue(),'editor');
assert.equal(await host.locator('.type-nav button').count(),3);
const recommendationFilter=p.waitForResponse(r=>{const u=new URL(r.url());return u.pathname.endsWith('/questions')&&u.searchParams.get('type')==='kiennghi'&&u.searchParams.get('inbox')==='moi'});
await host.locator('.type-nav').getByRole('button',{name:'Kiến nghị',exact:true}).click();await recommendationFilter;
await p.waitForFunction(()=>!document.querySelector('antc-questions-section')._busy);
assert.equal(await host.locator('.message-item').count(),0);assert.equal(await host.locator('.folders .folder b').first().textContent(),'0');
await host.locator('.type-nav').getByRole('button',{name:'Kiến nghị',exact:true}).click();
await host.locator('.answer-editor').waitFor();
await p.screenshot({path:screenshot});
// An unsaved answer must survive cancellation of changing the selected question.
await host.locator('.answer-editor').fill('Bản nháp cần được giữ nguyên khi chưa lưu.');await p.evaluate(()=>window.rejectDiscard=true);await host.locator('.message-button').nth(1).click();assert.equal(await host.locator('.answer-editor').inputValue(),'Bản nháp cần được giữ nguyên khi chưa lưu.');await p.evaluate(()=>window.rejectDiscard=false);
// Saving a note must preserve the unsaved answer and persist only the note.
const answerBeforeNote=rows[0].answer;
await host.locator('.note-toggle').click();
await host.locator('.note-editor textarea').fill('Ghi chú được lưu riêng.');
await host.locator('.note-actions').getByRole('button',{name:'Lưu',exact:true}).click();
await host.locator('.inbox-notice.success').waitFor();
assert.equal(rows[0].adminNote,'Ghi chú được lưu riêng.');
assert.equal(rows[0].answer,answerBeforeNote);
assert.equal(await host.locator('.answer-editor').inputValue(),'Bản nháp cần được giữ nguyên khi chưa lưu.');
await host.getByLabel('Người được phân công xử lý').selectOption('reviewer');
await host.locator('.answer-actions').getByRole('button',{name:'Lưu',exact:true}).click();await host.locator('.inbox-notice.success').waitFor();assert.equal(writes.at(-1).body.status,'da-xu-ly');assert.equal(await host.locator('.folders').getByRole('button',{name:/^Lưu trữ/}).count(),0);assert.equal(await host.evaluate(el=>el._mailbox),'da-tra-loi');assert.equal(writes.at(-1).body.assignedTo,'reviewer');assert(!rows[0].isPublished);
assert.equal(await host.locator('.answer-actions button').count(),3);assert.equal(await host.locator('.detail-utilities').count(),0);assert.equal(await host.locator('.answer-actions').getByRole('button',{name:'Xóa',exact:true}).count(),1);
assert.equal(await host.getByRole('button',{name:'Gửi duyệt',exact:true}).count(),0);
assert.equal(await host.getByRole('button',{name:'Lưu trả lời',exact:true}).count(),0);
// The single approval action turns on publication and still validates guidance.
await host.getByRole('button',{name:'Duyệt và công bố',exact:true}).click();await host.locator('.inbox-notice.error').waitFor();assert.equal(rows[0].isPublished,false);assert.equal(writes.length,2);assert.equal(await host.getByRole('switch').count(),0);
await host.getByLabel('Tên hướng dẫn đã thẩm định').fill('Hướng dẫn xác minh');await host.getByLabel('Liên kết hướng dẫn').fill('/ung-pho/');await host.getByRole('button',{name:'Duyệt và công bố',exact:true}).click();await p.waitForFunction(()=>document.querySelector('antc-questions-section')._review.isPublished);assert(rows[0].isPublished);assert.equal(writes.at(-1).path,'/1042/approve');assert.equal(writes.at(-1).body.status,'da-xu-ly');
// Unpublishing must not overwrite a locally edited, unsaved answer.
await host.getByRole('button',{name:'Gỡ công bố',exact:true}).waitFor();
const savedAnswer=rows[0].answer;
await host.locator('.answer-editor').fill('Bản đang sửa không được mất khi gỡ công bố.');
await host.getByRole('button',{name:'Gỡ công bố',exact:true}).click();
await p.waitForFunction(()=>!document.querySelector('antc-questions-section')._review.isPublished);
assert.equal(writes.at(-1).path,'/1042/unpublish');assert.deepEqual(Object.keys(writes.at(-1).body),['reviewVersion']);
assert.equal(rows[0].answer,savedAnswer);assert.equal(await host.locator('.answer-editor').inputValue(),'Bản đang sửa không được mất khi gỡ công bố.');
assert.equal(await host.getByRole('button',{name:'Gỡ công bố',exact:true}).count(),0);assert.equal(await host.getByRole('switch').count(),0);
await host.evaluate(el=>el._saveInline('archive'));await p.waitForFunction(()=>document.querySelector('antc-questions-section')._review.status==='luu-tru');assert(!rows[0].isPublished);
// Common-answer flow: explicitly choose two original questions, then save one private summary.
await host.getByRole('button',{name:'Mới tiếp nhận',exact:false}).first().click();
await host.getByRole('button',{name:'Trả lời chung với câu hỏi tương tự',exact:true}).click();
assert(await host.getByRole('checkbox',{name:'Chọn nội dung #1041',exact:true}).isChecked());
assert(await host.getByRole('checkbox',{name:'Chọn nội dung #1040',exact:true}).isDisabled());
await host.getByRole('checkbox',{name:'Chọn nội dung #1050',exact:true}).check();
await host.getByRole('button',{name:'Soạn trả lời chung',exact:true}).click();
assert.equal(await host.locator('.common-sources details').count(),2);
await host.getByLabel('Câu hỏi chung',{exact:true}).fill('Nên làm gì khi có người gọi yêu cầu cung cấp mã OTP?');
await host.getByLabel('Câu trả lời',{exact:true}).fill('Không cung cấp mã OTP cho người gọi. Dừng cuộc gọi và tự xác minh qua số chính thức.');
await p.screenshot({path:screenshot.replace(/\.png$/,'-common-editor.png')});
await host.locator('.answer-actions').getByRole('button',{name:'Lưu',exact:true}).click();
await p.waitForFunction(()=>document.querySelector('antc-questions-section')._review?.source==='tong-hop'&&!document.querySelector('antc-questions-section')._busy);
const summary=rows.find(r=>r.source==='tong-hop');assert.deepEqual(summary.aggregatedSourceIds,[1041,1050]);assert(!summary.isPublished);
assert(rows.filter(r=>r.aggregatedIntoId===summary.id).every(r=>r.status==='da-xu-ly'));
assert.equal(rows.filter(r=>r.source==='tong-hop').length,1);
// A failed publication validation keeps the same saved summary for retry.
await host.getByRole('button',{name:'Duyệt và công bố',exact:true}).click();await host.locator('.inbox-notice.error').waitFor();
await host.getByLabel('Tên hướng dẫn đã thẩm định').fill('Hướng dẫn xác minh cuộc gọi');await host.getByLabel('Liên kết hướng dẫn').fill('/ung-pho/');
await host.getByRole('button',{name:'Duyệt và công bố',exact:true}).click();
await p.waitForFunction(()=>document.querySelector('antc-questions-section')._review?.isPublished&&!document.querySelector('antc-questions-section')._busy);
assert(summary.isPublished);assert.equal(rows.filter(r=>r.source==='tong-hop').length,1);
// The common-answer controls exist only in the newly received inbox, even when selecting multiple elsewhere.
for(const [key,label] of [['da-tra-loi','Đã trả lời'],['da-cong-khai','Đã công khai']]){
 await host.locator('.folders').getByRole('button',{name:new RegExp('^'+label)}).click();
 await p.waitForFunction(key=>document.querySelector('antc-questions-section')._mailbox===key&&!document.querySelector('antc-questions-section')._busy,key);
 assert.equal(await host.getByRole('button',{name:'Trả lời chung với câu hỏi tương tự',exact:true}).count(),0);
 const choose=host.getByRole('button',{name:'Chọn nhiều nội dung',exact:true});if(await choose.count())await choose.click();
 await host.getByRole('checkbox',{name:'Chọn tất cả nội dung trên trang',exact:true}).check();
 assert.equal(await host.getByRole('button',{name:'Soạn trả lời chung',exact:true}).count(),0);
 await host.getByRole('button',{name:'Đóng chế độ chọn',exact:true}).click();
}
// Direct common publication also creates exactly one summary.
const original=rows.find(r=>r.id===1041);
rows.push({...original,id:1060,status:'moi',aggregatedIntoId:null,reviewVersion:0,content:'Có người tự xưng công an yêu cầu tôi chuyển tiền xác minh.'});
rows.push({...original,id:1061,status:'moi',aggregatedIntoId:null,reviewVersion:0,content:'Người gọi tự nhận cơ quan chức năng bắt chuyển khoản để xác minh.'});
await host.getByRole('button',{name:'Mới tiếp nhận',exact:false}).first().click();
await host.locator('.message-item').filter({hasText:'Có người tự xưng công an'}).locator('.message-button').click();
await host.getByRole('button',{name:'Trả lời chung với câu hỏi tương tự',exact:true}).click();
await host.getByRole('checkbox',{name:'Chọn nội dung #1061',exact:true}).check();
await host.getByRole('button',{name:'Soạn trả lời chung',exact:true}).click();
await host.getByLabel('Câu hỏi chung',{exact:true}).fill('Ứng phó thế nào khi người tự nhận công an đòi chuyển tiền?');
await host.getByLabel('Câu trả lời',{exact:true}).fill('Không chuyển tiền theo yêu cầu cuộc gọi lạ. Tự liên hệ cơ quan có thẩm quyền để xác minh.');
const beforeCommon=writes.length;
await host.getByRole('button',{name:'Duyệt và công bố',exact:true}).click();await host.locator('.inbox-notice.error').waitFor();assert.equal(writes.length,beforeCommon);
await host.getByLabel('Tên hướng dẫn đã thẩm định').fill('Hướng dẫn ứng phó');await host.getByLabel('Liên kết hướng dẫn').fill('/ung-pho/');
failNextApproval=true;
await host.getByRole('button',{name:'Duyệt và công bố',exact:true}).click();
await host.locator('.inbox-notice.error').waitFor();
assert.equal(rows.filter(r=>r.source==='tong-hop').length,2);
assert.equal(await host.getByLabel('Câu trả lời',{exact:true}).inputValue(),'Không chuyển tiền theo yêu cầu cuộc gọi lạ. Tự liên hệ cơ quan có thẩm quyền để xác minh.');
await host.getByRole('button',{name:'Duyệt và công bố',exact:true}).click();
await p.waitForFunction(()=>document.querySelector('antc-questions-section')._review?.source==='tong-hop'&&document.querySelector('antc-questions-section')._review?.isPublished&&!document.querySelector('antc-questions-section')._busy);
const publishedSummary=rows.find(r=>r.aggregatedSourceIds?.includes(1060));assert(publishedSummary.isPublished);assert.deepEqual(publishedSummary.aggregatedSourceIds,[1060,1061]);
assert.equal(writes.filter(w=>w.path==='/aggregate').length,2);
await host.getByRole('button',{name:'Tạo câu hỏi mới',exact:false}).click();
await host.getByRole('region',{name:'Tạo câu hỏi mới',exact:true}).waitFor();
await host.getByRole('button',{name:'Lưu và xuất bản',exact:true}).click();
await host.locator('.inbox-notice.error').waitFor();
assert.equal(writes.filter(w=>w.path==='').length,0);
await host.getByLabel('Loại nội dung mới').selectOption('kiennghi');
await host.getByLabel('Nội dung câu hỏi mới').fill('Kiến nghị bổ sung cảnh báo lừa đảo mới.');
await host.getByLabel('Câu trả lời mới',{exact:true}).fill('Chúng tôi sẽ cập nhật cảnh báo và hướng dẫn kiểm tra thông tin.');
await host.getByLabel('Ghi chú nội bộ mới',{exact:true}).fill('Ghi chú nội bộ không công khai.');
await host.getByLabel('Tên hướng dẫn đã thẩm định').fill('Hướng dẫn kiểm tra');
await host.getByLabel('Liên kết hướng dẫn').fill('/ung-pho/');
await host.getByLabel('Người xử lý nội dung mới').selectOption('reviewer');
failNextApproval=true;
await host.getByRole('button',{name:'Lưu và xuất bản',exact:true}).click();
await host.locator('.inbox-notice.error').waitFor();
assert.equal(rows.filter(r=>r.id===3000).length,1);assert.equal(rows[0].isPublished,false);
assert.equal(await host.getByLabel('Câu trả lời',{exact:true}).inputValue(),'Chúng tôi sẽ cập nhật cảnh báo và hướng dẫn kiểm tra thông tin.');
await host.getByRole('button',{name:'Duyệt và công bố',exact:true}).click();
await p.waitForFunction(()=>document.querySelector('antc-questions-section')._review?.id===3000&&document.querySelector('antc-questions-section')._review?.isPublished&&!document.querySelector('antc-questions-section')._busy);
assert.equal(rows[0].type,'kiennghi');assert.equal(rows[0].isPublished,true);assert.equal(rows[0].assignedTo,'reviewer');assert.equal(rows[0].adminNote,'Ghi chú nội bộ không công khai.');assert.equal(writes.filter(w=>w.path==='').length,1);
assert.equal(await host.locator('.mail-detail h2').textContent(),'Kiến nghị bổ sung cảnh báo lừa đảo mới.');
assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,layout:boxes,writes:writes.length,screenshot}));
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
