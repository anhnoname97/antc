const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const load = import(pathToFileURL(path.resolve(__dirname, '../../Umbraco.Web.UI/wwwroot/assets/js/self-check-rules.mjs')).href);
const choices = [{ mean: 'co' }, { mean: 'khong' }, { mean: 'chuaBiet' }];
const questions = ['phaiDung', 'phaiDung', 'phaiDung', 'tamHoan', 'canKiemTra'].map(kind => ({ kind, options: choices }));
questions[4] = { ...questions[4], options: [{ mean: 'co' }, { mean: 'co' }, { mean: 'khong' }, { mean: 'chuaBiet' }] };

test('all 324 answer combinations follow stop/hold/check semantics, including the custom self-initiated choice', async () => {
  const { evaluateAnswers } = await load;
  let count = 0;
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) for (let d = 0; d < 3; d++) for (let e = 0; e < 4; e++) {
    const answers = [a, b, c, d, e];
    const stop = [a, b, c].indexOf(0);
    const expected = stop >= 0 ? 'd' : [a, b, c].includes(2) || d !== 1 || e >= 2 ? 'h' : 'n';
    const result = evaluateAnswers(questions, answers);
    assert.equal(result.level, expected, JSON.stringify(answers));
    if (stop >= 0) { assert.equal(result.lastIndex, stop); assert.equal(result.reasons.length, 1); }
    count++;
  }
  assert.equal(count, 324);
});
test('unknown at a stop question continues; yes stops without treating unanswered questions as reasons', async () => {
  const { evaluateAnswers } = await load;
  assert.equal(evaluateAnswers(questions, [2]), null);
  assert.deepEqual(evaluateAnswers(questions, [0]), { level: 'd', reasons: [{ index: 0, prefix: 'Bạn chọn “Có” ở câu: ' }], lastIndex: 0 });
  assert.equal(evaluateAnswers(questions, [2, 1, 1, 1, 0]).level, 'h');
});
test('missing answers, invalid option indices, unknown meanings and unknown kinds never return a reassuring result', async () => {
  const { evaluateAnswers } = await load;
  for (const answers of [[], [1, 1], [1, 1, 1, 1], [1, 1, 1, 1, -1], [1, 1, 1, 1, '0'], [1, 1, 1, 1, 4]]) assert.equal(evaluateAnswers(questions, answers), null);
  assert.equal(evaluateAnswers([{ kind: 'unknown', options: choices }], [1]), null);
  assert.equal(evaluateAnswers([{ kind: 'canKiemTra', options: [{ mean: 'unsafe' }] }], [0]), null);
  assert.equal(evaluateAnswers([], []), null);
});

test('all 243 investment combinations respect two stop, one hold and two verification questions', async () => {
  const { evaluateAnswers } = await load;
  const investment = ['phaiDung', 'phaiDung', 'tamHoan', 'canKiemTra', 'canKiemTra'].map(kind => ({ kind, options: choices }));
  let count = 0;
  for (let a=0; a<3; a++) for (let b=0; b<3; b++) for (let c=0; c<3; c++) for (let d=0; d<3; d++) for (let e=0; e<3; e++) {
    const answers=[a,b,c,d,e];
    const stop=[a,b].indexOf(0);
    const expected=stop>=0?'d':a===2 || b===2 || c!==1 || d!==0 || e!==0?'h':'n';
    const result=evaluateAnswers(investment,answers);
    assert.equal(result.level,expected,JSON.stringify(answers));
    if(stop>=0) { assert.equal(result.lastIndex,stop); assert.equal(result.reasons.length,1); }
    count++;
  }
  assert.equal(count,243);
});
