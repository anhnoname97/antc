const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.resolve(__dirname, '../../Umbraco.Web.UI/wwwroot/assets/js/situation-engine.js'), 'utf8');
const engine = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
function fixture() {
  const step = (text, actionId, priority) => ({ text, actionId, priority, details: [], url: '/guide/', title: 'Source' });
  return {
    situations: [{ id: 'test', title: 'Tình huống', keywords: 'ngan hang otp', level: 'h', firstAction: 'Không nộp thêm', actionId: 'no-more-money', priority: 3, nextActions: ['Phản ánh tới 156.'] }],
    consequences: [
      { code: 'threat', steps: ['8:0', '8:1', '8:2', '8:6'].map(source => ({ source })) },
      { code: 'app', steps: ['3:0', '3:7', '3:6'].map(source => ({ source })) },
      { code: 'otp', steps: [{ source: '3:1' }] },
      { code: 'money', steps: ['2:0', '5:0', '2:4'].map(source => ({ source })) }
    ],
    guides: {
      '8:0': step('Gọi 113 nếu nguy hiểm', 'c113', 0), '8:1': step('Nói với người thân', 'tell-trust', 1.5),
      '8:2': step('Không đưa thêm tiền', 'no-more-money', 3), '8:6': step('Trình báo đe dọa', 'report', 7),
      '3:0': step('Ngắt mạng máy bị kiểm soát', 'offline', 1), '3:1': step('Hỏi ngân hàng về OTP', 'bank-otp', 2.05),
      '3:7': step('Trình báo thiết bị', 'report', 7), '3:6': step('Xử lý thiết bị', 'repair', 8),
      '2:0': step('Gọi ngân hàng', 'bank-money', 2.2), '5:0': step('Không nộp phí', 'no-more-money', 3), '2:4': step('Trình báo tiền', 'report', 7)
    }
  };
}
test('Threat, device and money actions follow priority and contain one report and one stop-money action', async () => {
  const { computeSituation } = await engine;
  const r = computeSituation(fixture(), 'test', ['threat', 'app', 'otp', 'money']);
  assert.equal(r.level, 'd');
  assert.deepEqual(r.steps.slice(0, 4).map(x => x.actionId), ['c113', 'offline', 'tell-trust', 'bank-money']);
  assert.equal(r.steps.filter(x => x.actionId === 'report').length, 1);
  assert.equal(r.steps.find(x => x.actionId === 'report').text, 'Trình báo đe dọa');
  assert.equal(r.steps.filter(x => x.actionId === 'no-more-money').length, 1);
  assert(!r.steps.some(x => x.actionId === 'bank-otp'));
  assert(r.steps.findIndex(x => x.actionId === 'report') < r.steps.findIndex(x => x.actionId === 'repair'));
});
test('Unknown answers increase caution and absence of a consequence retains the situation-specific first action', async () => {
  const { computeSituation } = await engine, data = fixture(); data.situations[0].level = 'n';
  assert.equal(computeSituation(data, 'test', ['none']).level, 'n');
  assert.equal(computeSituation(data, 'test', ['unk']).level, 'h');
  assert.equal(computeSituation(data, 'test', ['none']).steps[0].text, 'Không nộp thêm');
});
test('Missing published sources fail closed instead of returning an incomplete plan', async () => {
  const { computeSituation } = await engine, data = fixture(); delete data.guides['2:0'];
  assert.deepEqual(computeSituation(data, 'test', ['money']), { unavailable: true });
});
test('Search supports Vietnamese accents and a minor typo', async () => {
  const { searchSituations } = await engine, data = fixture();
  assert.equal(searchSituations(data.situations, 'ngân hàng')[0].id, 'test');
  assert.equal(searchSituations(data.situations, 'ngan hag')[0].id, 'test');
  assert.deepEqual(searchSituations(data.situations, ''), []);
});
