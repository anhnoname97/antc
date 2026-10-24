const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const source=readFileSync(resolve(__dirname,'../../Umbraco.Web.UI/wwwroot/assets/js/contest/submit.js'),'utf8');
let sequence=0;
async function panel(phase,localOnly,notice,answeringClosed=false){
  global.document={getElementById:()=>null};
  global.__submissionState={practice:false,entry:{code:'AD-TEST'},synced:true,status:'in_progress',contest:{phase},topics:[{cd:'1',count:1}],total:1,answers:new Map([['Q',{a:'A',correct:true,localOnly}]])};
  global.__submissionState.answeringClosed=answeringClosed;
  const store=uri(`// fixture ${sequence}\n
export const state=globalThis.__submissionState;export const hasLateAnswers=()=>[...state.answers.values()].some(a=>a.localOnly);export const restartLocalAnswers=()=>false;export const submit=async()=>{};export const attachContact=async()=>{};export const pendingCount=()=>0;export const topicProgress=()=>[{cd:'1',count:1,answered:state.testAnswered ?? 1,done:state.testAnswered !== 0}];`);
  const copy=uri('export const blockCopy=(a,b,fallback)=>fallback;');
  const phone=uri('export const checkContact=()=>({});');
  const ui=uri('export const esc=value=>String(value);export const eyebrowHtml=()=>"";');
  const modified=source.replace("from './contest-store.js'",`from '${store}'`).replace("from './block-copy.js'",`from '${copy}'`).replace("from './phone.js'",`from '${phone}'`).replace("from '../quiz/quiz-ui.js'",`from '${ui}'`);
  const module=await import(uri(modified+`\n// test ${sequence++}`));
  if(notice){
    global.__submissionState.testAnswered=0;
    module.setNotice(notice);
    module.panelHtml([{cd:'1',count:1}]);
    global.__submissionState.testAnswered=1;
  }
  return module.panelHtml([{cd:'1',count:1}]);
}
test('open contest with local answers must not be described as expired',async()=>{
  const html=await panel('open',true);
  assert(!html.includes('Đã hết hạn nộp bài'));
  assert(html.includes('chưa được ghi nhận trên máy chủ'));
  assert(html.includes('data-restart-local'));
  assert(!html.includes('data-submit-open'));
});
test('actually closed contest displays a single expiry warning',async()=>{
  const html=await panel('closed',true);
  assert.equal((html.match(/Đã hết hạn nộp bài/g)||[]).length,1);
  assert(!html.includes('data-submit-open'));
});
test('expiry received while answering overrides the old open phase on completion',async()=>{
  const html=await panel('open',true,undefined,true);
  assert(html.includes('Đã hết hạn nộp bài.'));
  assert(html.includes('chế độ luyện tập'));
  assert(!html.includes('data-restart-local'));
  assert(!html.includes('data-submit-open'));
});
test('open contest with server answers can submit normally',async()=>{
  const html=await panel('open',false);
  assert(html.includes('data-submit-open'));assert(!html.includes('Đã hết hạn nộp bài'));
});
test('answering after a restart clears the old notice before showing submit',async()=>{
  const html=await panel('open',false,'Bạn có thể làm lại phần chưa được ghi nhận để dự thi.');
  assert(html.includes('data-submit-open'));
  assert(!html.includes('infobox--warn'));
  assert(!html.includes('Bạn có thể làm lại'));
});
test('submission grace is not the same as an expired submission deadline',async()=>{
  assert((await panel('submit_only',false)).includes('data-submit-open'));
  const html=await panel('submit_only',true);
  assert(html.includes('Đã hết hạn nộp bài'));assert(!html.includes('data-submit-open'));
});
