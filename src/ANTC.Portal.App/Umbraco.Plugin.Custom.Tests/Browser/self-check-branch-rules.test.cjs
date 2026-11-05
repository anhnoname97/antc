const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const load = import(pathToFileURL(path.resolve(__dirname, '../../Umbraco.Web.UI/wwwroot/assets/js/self-check-branch-rules.mjs')).href);

test('all 81 branch combinations retain yes/unknown in editorial priority order', async () => {
  const { branchResult } = await load;
  let count = 0;
  for (const a of ['y','n','u']) for (const b of ['y','n','u']) for (const c of ['y','n','u']) for (const d of ['y','n','u']) {
    const answers=[a,b,c,d];
    const expected=[];
    answers.forEach((answer,index)=>{if(answer!=='n')expected.push({index,unsure:answer==='u'});});
    assert.deepEqual(branchResult(4,answers),expected);
    count++;
  }
  assert.equal(count,81);
});
test('incomplete, sparse, invalid and excessive answers never return a no-issue result', async () => {
  const { branchResult } = await load;
  for (const answers of [[], ['n'], ['n','n','n'], ['n','n','n',''], ['n','n','n',null], ['n','n','n','bad'], ['n','n','n','n','n'], new Array(4)]) assert.equal(branchResult(4,answers),null);
  assert.equal(branchResult(1,['n']),null);
  assert.equal(branchResult(9,new Array(9).fill('n')),null);
  assert.equal(branchResult(4,null),null);
  assert.deepEqual(branchResult(4,['n','n','n','n']),[]);
});
