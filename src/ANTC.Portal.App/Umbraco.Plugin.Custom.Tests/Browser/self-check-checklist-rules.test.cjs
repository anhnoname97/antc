const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=import(pathToFileURL(path.resolve(__dirname,'../../Umbraco.Web.UI/wwwroot/assets/js/self-check-checklist-rules.mjs')).href);
test('all 62,208 combinations of five answers and eight pocket checks follow D/H/N priority',async()=>{
  const {checklistResult}=await load;
  const questions=Array.from({length:5},(_,i)=>'Q'+i),items=Array.from({length:8},(_,i)=>'I'+i);
  let count=0;
  for(let a=0;a<243;a++){
    const answers=questions.map((_,i)=>['y','n','u'][Math.floor(a/3**i)%3]);
    for(let mask=0;mask<256;mask++){
      const checked=items.map((_,i)=>!!(mask & 1<<i));
      const expected=answers.includes('y')?'d':answers.includes('u')||mask!==255?'h':'n';
      const result=checklistResult(questions,items,answers,checked);
      assert.equal(result.level,expected);
      assert.equal(result.reasons.length,expected==='d'?answers.filter(a=>a==='y').length:expected==='h'?answers.filter(a=>a==='u').length+checked.filter(c=>!c).length:0);
      count++;
    }
  }
  assert.equal(count,62208);
});
test('incomplete, sparse or malformed inputs cannot yield a reassuring result',async()=>{
  const {checklistResult}=await load;
  for(const answers of [[],['n'],['n',''],['y',null],['n','bad'],new Array(2)])assert.equal(checklistResult(['a','b'],['c'],answers,[true]),null);
  for(const flags of [[],['true'],[null],new Array(1)])assert.equal(checklistResult(['a','b'],['c'],['n','n'],flags),null);
  assert.equal(checklistResult([],['c'],[],[true]),null);
  assert.equal(checklistResult(['a'],[],['n'],[]),null);
  assert.deepEqual(checklistResult(['a'],['b'],['u'],[false]),{level:'h',reasons:['Chưa biết chắc: a','Chưa trả lời được: b']});
});
