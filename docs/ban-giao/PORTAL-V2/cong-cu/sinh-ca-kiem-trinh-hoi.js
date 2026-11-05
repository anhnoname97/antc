// Sinh bo ca kiem trinh hoi (wizard-cases.json) tu ham wzCompute cua mockup va du lieu mau (QD-056).
// Cach chay: node sinh-ca-kiem-trinh-hoi.js <mockup-o-nhap-backoffice.html> <seed-portal-v2.json> <wizard-cases.json>
// C# (WizardResult, V2-07b) va JS website (V2-13d) phai ra dung ket qua trong file nay.
const fs = require('fs');
const [mockPath, seedPath, outPath] = process.argv.slice(2);
const html = fs.readFileSync(mockPath, 'utf8');
const tag = '<script type="application/json" id="data">';
const d0 = html.indexOf(tag) + tag.length;
const dataJson = html.slice(d0, html.indexOf('</script>', d0));
let js = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
js = js.slice(0, js.indexOf('/* ---------- khởi động'));
const noop = () => {};
global.document = { getElementById: () => ({ textContent: dataJson }), addEventListener: noop, querySelectorAll: () => [], createElement: noop, createElementNS: noop };
global.addEventListener = noop;
const { wzCompute, N } = new Function(js + '\nreturn {wzCompute,N};')();

const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
const keyOf = Object.fromEntries(seed.nodes.map(n => [n.mockupId, n.key]));
const wizardSeed = seed.nodes.find(n => n.contentType === 'wizardPage');
const wizard = N.find(n => n.type === 'wizardPage');
const v = wizard.v;
// khoa dong trong seed = GUID v5 cua 'row:wizard:<ma>'; lay theo nhan de doi chieu
const rowKey = {};
[1, 2, 3].forEach(s => wizardSeed.values['step' + s + 'Options'].forEach((o, i) => { rowKey[v['o' + s][i]._k] = o.key; }));
const label = k => ([1, 2, 3].map(s => (v['o' + s] || []).find(o => o._k === k)).find(Boolean) || {}).t || k;
const tacs = N.filter(n => n.type === 'tacticItem').sort((a, b) => a.o - b.o);

// [ma ca, mo ta, kenh, cau 2, cau 3] theo ma ngan cua ban dung (o1-dt, o2-otp...); 'none', 'unk' la dong co dinh
const CASES = [
  ['ngan-hang-otp', 'Gọi điện đòi OTP, dọa khóa tài khoản', 'dt', ['otp'], ['threat']],
  ['cong-an-bi-mat', 'Giả cơ quan chức năng bắt chuyển tiền, giữ bí mật', 'dt', ['money'], ['threat', 'rush']],
  ['dau-tu-loi-nhuan', 'Mạng xã hội mời đầu tư lãi cao, nạp tiền', 'mxh', ['money'], ['profit']],
  ['cho-muon-tai-khoan', 'Rủ cho thuê tài khoản ngân hàng kiếm tiền công', 'mxh', ['acct'], ['profit']],
  ['link-hoan-tien', 'Tin nhắn gửi link nhận tiền, không dọa', 'tn', ['link'], ['none']],
  ['nguoi-than-can-tien', 'Người quen nhắn cần tiền gấp', 'tn', ['money'], ['relative']],
  ['chua-biet', 'Không nhớ họ yêu cầu gì', 'x', ['unk'], ['unk']],
  ['khong-co-gi', 'Chưa yêu cầu, không hứa hẹn: mức Cần thận trọng, không khớp', 'web', ['none'], ['none']],
  ['nhieu-lua-chon', 'Chọn rất nhiều: chỉ hiện tối đa maxSituations tình huống', 'dt', ['otp', 'app', 'money', 'link'], ['held', 'rush', 'nocall', 'threat']],
  ['kenh-khong-nho', 'Kênh khác: không cộng điểm kênh', 'x', ['money'], ['held']],
];
const k1 = c => c === 'x' ? 'x' : 'o1-' + c;
const kk = (s, c) => (c === 'none' || c === 'unk') ? c : 'o' + s + '-' + c;
const signOut = x => x.sign ? { stopSign: keyOf[x.sign] } : { text: x.text };
const actOut = x => x.text ? { text: x.text } : { page: keyOf[x.page], stepNumber: Number(x.step) };
const cases = CASES.map(([id, desc, c1, c2, c3]) => {
  const a1 = k1(c1), a2 = new Set(c2.map(c => kk(2, c))), a3 = new Set(c3.map(c => kk(3, c)));
  const r = wzCompute(v, tacs, a1, a2, a3);
  const ins = s => [...s].map(k => rowKey[k] || k);
  return {
    id, description: desc,
    input: { step1: rowKey[a1] || a1, step2: ins(a2), step3: ins(a3) },
    inputLabels: { step1: a1 === 'x' ? v.o1x : label(a1), step2: [...a2].map(label), step3: [...a3].map(label) },
    expect: {
      cautionLevel: r.lv,
      situations: r.sit.map(x => ({ tactic: keyOf[x.t.id], name: x.t.name, score: x.score })),
      signs: r.signs.map(signOut), actions: r.acts.map(actOut), ifAlready: r.lost.map(x => keyOf[x.trang]),
      guideArticle: r.article ? keyOf[r.article] : null, checklist: r.checklist ? keyOf[r.checklist] : null
    }
  };
});
const out = {
  format: 'antc-wizard-cases', version: 2,
  rule: 'QĐ-056. Mức độ: có lựa chọn câu 2, 3 loại Phải dừng thì ratCao; còn lại có lựa chọn Tạm hoãn hoặc "Tôi chưa biết" thì cao; không thì thuong. Tình huống: thủ đoạn đang dùng có wizardAnswers trùng ít nhất 1 lựa chọn; điểm = 2 × số trùng + 3 nếu kênh của lựa chọn câu 1 nằm trong channels của thủ đoạn; sắp điểm giảm dần, hòa theo thứ tự trong Danh mục › Thủ đoạn; lấy tối đa maxSituations. Dấu hiệu (tối đa 3): lựa chọn Phải dừng (stopSign hoặc signText) theo thứ tự câu 2 rồi câu 3, rồi lựa chọn Tạm hoãn (signText), rồi unknownSignText. Việc cần làm (tối đa 4): bảng của mức, giữ dòng có onlyIf trống hoặc trùng và skipIf không trùng (onlyIf, skipIf gồm cả lựa chọn câu 1). Bài chi tiết: bài chứa thủ đoạn đầu; danh sách kiểm tra: của chuyên đề bài đó, không có thì defaultChecklist.',
  seedNode: wizardSeed.key, maxSituations: Number(v.maxShow),
  cases
};
fs.writeFileSync(outPath, JSON.stringify(out, null, 1) + '\n');
console.log('cases', cases.length);
cases.forEach(c => console.log(c.id, c.expect.cautionLevel, c.expect.situations.map(s => s.name.slice(0, 40) + '(' + s.score + ')').join(' | ')));
