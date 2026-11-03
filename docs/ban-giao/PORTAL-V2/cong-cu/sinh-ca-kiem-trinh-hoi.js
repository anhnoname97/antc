// Sinh bo ca kiem trinh hoi (wizard-cases.json) tu ham tinh diem cua mockup va ma tran trong seed.
// Cach chay: node sinh-ca-kiem-trinh-hoi.js <mockup-o-nhap-backoffice.html> <seed-portal-v2.json> <wizard-cases.json>
// C# (WizardScoring, V2-07b), JS backoffice (V2-07d) va JS website (V2-13d) phai ra dung ket qua trong file nay.
const fs = require('fs');
const [mockPath, seedPath, outPath] = process.argv.slice(2);
const html = fs.readFileSync(mockPath, 'utf8');
let js = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
js = js.slice(0, js.indexOf('/* ---------- khởi động'));
const noop = () => {};
global.document = { getElementById: () => ({ textContent: '{"N":[],"MEDIA":[]}' }), addEventListener: noop, querySelectorAll: () => [], createElement: noop, createElementNS: noop };
global.addEventListener = noop;
const { mxCompute } = new Function(js + '\nreturn {mxCompute};')();

const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
const wizard = seed.nodes.find(n => n.contentType === 'wizardPage');
const v = wizard.values;
const opt = s => Object.fromEntries(v['step' + s + 'Options'].map(o => [o.label, o.key]));
const O = [null, opt(1), opt(2), opt(3)];
// ten ngan cho de doc; tra ve key cua dong lua chon
const CODE = {
  1: { dt: 'Cuộc gọi', tn: 'Tin nhắn SMS/Zalo/WhatsApp', mail: 'Email', mxh: 'Facebook/TikTok/YouTube', web: 'Website hoặc quảng cáo', tt: 'Người quen giới thiệu' },
  2: { money: 'Chuyển tiền hoặc đặt cọc', otp: 'Cung cấp OTP, mật khẩu, mã PIN', app: 'Cài ứng dụng hoặc nhấn link', invest: 'Đầu tư, mua coin, mở tài khoản', loan: 'Vay tiền hoặc trả phí trước', id: 'Gửi ảnh CCCD, ảnh khuôn mặt, chữ ký' },
  3: { profit: '“Lợi nhuận cao, bảo đảm vốn”', lock: '“Tài khoản sẽ bị khóa”', gov: '“Cơ quan chức năng đang liên hệ”', job: '“Việc nhẹ, lương cao”', refund: '“Hoàn tiền, trúng thưởng, hỗ trợ hoàn vốn”', rush: '“Cần quyết định ngay hôm nay”' } };
const key = (s, c) => { const k = O[s][CODE[s][c]]; if (!k) throw new Error('Không thấy lựa chọn ' + s + ':' + c); return k; };

// Chuyen ma tran seed ve dang mxCompute cua mockup dung (s1, s2, s3, level, on, maxShow)
const level = { thuong: 'thuong', cao: 'cao', ratCao: 'ratCao' };
const mv = { maxShow: v.maxSituations, matrix: v.situationMatrix.rows.map(r => ({ _k: r.key, name: r.name, level: level[r.cautionLevel], s1: r.match.step1, s2: r.match.step2, s3: r.match.step3, on: r.enabled !== false, signs: r.signs, actions: r.actions })) };

const CASES = [
  ['ngan-hang-otp', 'Gọi điện đòi OTP, dọa khóa tài khoản', 'dt', ['otp'], ['lock']],
  ['cong-an-chuyen-tien', 'Giả công an bắt chuyển tiền gấp', 'dt', ['money'], ['gov', 'rush']],
  ['dau-tu-loi-nhuan', 'Mạng xã hội mời đầu tư lãi cao', 'mxh', ['invest'], ['profit']],
  ['viec-lam-coc', 'Việc nhẹ lương cao, bắt đặt cọc', 'mxh', ['money'], ['job']],
  ['vay-phi-truoc', 'Website cho vay đòi phí trước, thúc gấp', 'web', ['loan'], ['rush']],
  ['nguoi-than-can-tien', 'Tin nhắn người quen cần tiền gấp', 'tn', ['money'], ['rush']],
  ['giay-to', 'Người quen xin ảnh CCCD', 'tt', ['id'], []],
  ['hoan-tien-qr', 'Mạng xã hội gửi link hoàn tiền', 'mxh', ['app'], ['refund']],
  ['toi-da-ba-tinh-huong', 'Chọn rất nhiều: chỉ hiện tối đa maxSituations tình huống', 'dt', ['money', 'otp', 'app', 'id'], ['lock', 'gov', 'rush']],
  ['chi-co-kenh', 'Chỉ chọn kênh, không chọn bước 2, 3: không khớp', 'dt', [], []],
  ['chi-buoc-3', 'Chỉ chọn bước 3, kênh không trùng: vẫn khớp, 2 điểm', 'tt', [], ['job']],
  ['kenh-khong-trung', 'Lựa chọn trùng nhưng kênh không trùng: vẫn khớp, ít điểm hơn', 'mail', ['loan'], []],
];
const cases = CASES.map(([id, desc, c1, c2, c3]) => {
  const a1 = key(1, c1), a2 = new Set(c2.map(c => key(2, c))), a3 = new Set(c3.map(c => key(3, c)));
  const res = mxCompute(mv, a1, a2, a3);
  return {
    id, description: desc,
    input: { step1: a1, step2: [...a2], step3: [...a3] },
    inputLabels: { step1: CODE[1][c1], step2: c2.map(c => CODE[2][c]), step3: c3.map(c => CODE[3][c]) },
    expect: res ? {
      noMatch: false, cautionLevel: res.lv,
      situations: res.rows.map(x => ({ key: x.r._k, name: x.r.name, score: x.score })),
      signs: (res.top.signs || []).slice(0, 3), actions: (res.top.actions || []).slice(0, 4)
    } : { noMatch: true }
  };
});
const out = {
  format: 'antc-wizard-cases', version: 1,
  rule: 'Điểm = 2 × số lựa chọn bước 2, 3 trùng + 3 nếu kênh bước 1 trùng. Chỉ tính hàng đang dùng có ít nhất 1 lựa chọn bước 2 hoặc 3 trùng. Sắp điểm giảm dần, hòa điểm theo thứ tự hàng. Lấy tối đa maxSituations hàng. Mức độ là mức cao nhất trong các hàng lấy ra. Dấu hiệu (tối đa 3) và việc cần làm (tối đa 4) lấy từ hàng đầu. Không hàng nào khớp thì noMatch.',
  matrixFrom: { seed: 'seed-portal-v2.json', node: wizard.key, maxSituations: Number(v.maxSituations) },
  cases
};
fs.writeFileSync(outPath, JSON.stringify(out, null, 1) + '\n');
console.log('cases', cases.length, 'noMatch', cases.filter(c => c.expect.noMatch).length);
cases.forEach(c => console.log(c.id, c.expect.noMatch ? 'KHONG KHOP' : c.expect.cautionLevel + ' ' + c.expect.situations.map(s => s.name + '(' + s.score + ')').join(' | ')));
