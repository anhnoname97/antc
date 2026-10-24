const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const source = readFileSync(resolve(__dirname, '../../Umbraco.Web.UI/wwwroot/assets/js/contest/contest-store.js'), 'utf8');
const uri = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const api = uri(`
const f = () => globalThis.__lateFixture;
export const loadEntry = () => f().entry;
export const saveEntry = value => (f().entry = value);
export const clearEntry = () => { f().entry = null; };
export const allEntries = () => f().entry ? [f().entry] : [];
export const markPractice = () => {};
export const getMe = async () => ({ok:true,data:structuredClone(f().server)});
export const saveAnswer = async (q,a) => { f().answerCalls++; return f().rejectClosed ? {ok:false,error:{code:'CONTEST_CLOSED'}} : {ok:true,data:{a,correct:true,stored:true}}; };
export const attachContact = async () => ({ok:true,data:{}});
export const submitEntry = async () => { f().submitCalls++;return {ok:true,data:{status:'submitted'}}; };
export const fetchTopics = async () => ({ok:true,data:[]});
export const fetchQuestions = async () => ({ok:true,data:[]});
`);
let version = 0;
async function load() {
  return import(uri(source.replace(/from '\.\/contest-api\.js'/, `from '${api}'`) + `\n// instance ${version++}`));
}
function setup(phase = 'open') {
  const storage = new Map();
  global.localStorage = {getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
  global.__lateFixture = {
    entry:{code:'AD-FIRST',token:'test-token',contestId:1,mode:'named',maxAttempts:2},
    server:{code:'AD-FIRST',mode:'named',attemptNo:1,maxAttempts:2,status:'in_progress',total:3,score:null,answers:[{q:'Q1',a:'A',correct:true,cd:'1'}],topics:[{cd:'1',count:3}],contest:{id:1,phase}},
    answerCalls:0,submitCalls:0,rejectClosed:false,
  };
  return global.__lateFixture;
}

test('expiry during an answer preserves the selected answer locally and allows all remaining questions', async () => {
  const f=setup();f.rejectClosed=true;const s=await load();await s.init(1);
  assert.equal((await s.answer('Q2','B','1',false)).ok,true);
  assert.equal(s.getAnswer('Q2').localOnly,true);
  assert.equal(s.pendingCount(),0);
  assert.equal((await s.answer('Q3','A','1',true)).ok,true);
  assert.equal(f.answerCalls,1);
  assert.equal(s.allDone([{cd:'1',count:3}]),true);
  const result=await s.submit();assert.equal(result.error.code,'CONTEST_CLOSED');assert.equal(f.submitCalls,0);
  assert.equal(f.server.answers.length,1);
});

test('already expired entry answers locally; reload preserves progress and server answers take precedence', async () => {
  const f=setup('closed');let s=await load();await s.init(1);
  await s.answer('Q2','B','1',false);assert.equal(f.answerCalls,0);
  s=await load();await s.init(1);assert.equal(s.getAnswer('Q1').stored,true);assert.equal(s.getAnswer('Q2').a,'B');assert.equal(s.getAnswer('Q2').localOnly,true);
  f.server.answers.push({q:'Q2',a:'A',correct:true,cd:'1'});
  s=await load();await s.init(1);assert.equal(s.getAnswer('Q2').a,'A');assert.equal(s.getAnswer('Q2').localOnly,undefined);
});

test('submit-only phase keeps late answers noncompetitive and local data cannot leak into another entry', async () => {
  const f=setup('submit_only');let s=await load();await s.init(1);await s.answer('Q2','B','1',false);
  assert.equal(f.answerCalls,0);assert.equal((await s.submit()).error.code,'CONTEST_CLOSED');assert.equal(f.submitCalls,0);
  f.entry={...f.entry,code:'AD-SECOND',token:'another-token'};f.server={...f.server,code:'AD-SECOND',answers:[]};
  s=await load();await s.init(1);assert.equal(s.getAnswer('Q2'),null);
});

test('submitted server result is never replaced with locally completed answers', async () => {
  const f=setup('closed');let s=await load();await s.init(1);await s.answer('Q2','B','1',false);
  f.server.status='submitted';s=await load();await s.init(1);assert.equal(s.getAnswer('Q2'),null);assert.equal(s.hasLateAnswers(),false);assert.equal(s.state.status,'submitted');
});


test('queued offline answers become local after expiry without being sent again', async () => {
  const f=setup('closed');
  localStorage.setItem('at_queue',JSON.stringify([
    {entry:'AD-FIRST',q:'Q2',a:'B',cd:'1',correct:false},
    {entry:'AD-FIRST',q:'Q3',a:'A',cd:'1',correct:true},
  ]));
  const s=await load();await s.init(1);await s.flush();
  assert.equal(f.answerCalls,0);assert.equal(s.pendingCount(),0);
  assert.equal(s.getAnswer('Q2').localOnly,true);assert.equal(s.getAnswer('Q3').localOnly,true);
  assert.equal(s.allDone([{cd:'1',count:3}]),true);
});


test('open contest continues to save ordinary answers to the server', async () => {
  const f=setup('open');const s=await load();await s.init(1);
  const result=await s.answer('Q2','A','1',true);
  assert.equal(result.ok,true);assert.equal(f.answerCalls,1);
  assert.equal(s.getAnswer('Q2').stored,true);assert.equal(s.hasLateAnswers(),false);
});

test('reopened contest resumes official answers without importing old local practice', async () => {
  const f=setup('closed');let s=await load();await s.init(1);await s.answer('Q2','B','1',false);
  assert.equal(s.restartLocalAnswers(),false);
  f.server.contest.phase='open';s=await load();await s.init(1);
  assert.equal(s.hasLateAnswers(),false);assert.equal(s.answeringLocally(),false);
  assert(localStorage.getItem('at_late_answers').includes('Q2'));
  assert.equal(s.getAnswer('Q1').stored,true);assert.equal(s.getAnswer('Q2'),null);
  await s.answer('Q2','A','1',true);assert.equal(f.answerCalls,1);assert.equal(s.getAnswer('Q2').stored,true);
});
