// Doc schema T trong mockup, in phu luc alias truong dang markdown
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
let js = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
js = js.slice(0, js.indexOf('/* ---------- khởi động'));
const noop = () => {};
global.document = { getElementById: () => ({ textContent: '{"N":[],"MEDIA":[]}' }), addEventListener: noop, querySelectorAll: () => [], createElement: noop, createElementNS: noop };
global.addEventListener = noop;
const out = new Function(js + '\nreturn {T,COLL,ALLOW,MXF};')();
const { T, COLL, ALLOW, MXF } = out;

const NODESRC = { CH: 'Chọn · Kênh', AUD: 'Chọn · Đối tượng', SIGN: 'Chọn · Dấu hiệu phải dừng', POP: 'Chọn · Mức độ phổ biến', TOPIC: 'Chọn · Chuyên đề', TAC: 'Chọn · Thủ đoạn', SNIP: 'Chọn · Đoạn dùng chung', VCL: 'Chọn · Việc cần làm', TOOL: 'Chọn · Kiểm tra nhanh', CHK: 'Chọn · Danh sách kiểm tra', ART: 'Chọn · Bài viết', ALERT: 'Chọn · Cảnh báo', GRP: 'Chọn · Nhóm rủi ro', REL: 'Chọn · Bài liên quan', GUIDE: 'Chọn · Bài hoặc cảnh báo', DOORTO: 'Chọn · Việc cần làm hoặc trình hỏi', PAGES: 'Chọn · Trang trong website' };
const FIXSRC = { LEVEL: 'Danh mục · Mức độ cần thận trọng', KIND: 'Danh mục · Loại bài', TOOLKIND: 'Danh mục · Kiểu công cụ', COLOR: 'Danh mục · Màu kết quả', YESNO: 'Danh mục · Trả lời là dấu hiệu', HT: 'Danh mục · Hình thức liên hệ', DOORKIND: 'Danh mục · Kiểu cửa vào', ILL: 'Danh mục · Hình minh họa cửa vào', BAR: 'Danh mục · Dải trên cùng', ICONS: 'Danh mục · Biểu tượng', QKIND: 'Danh mục · Loại câu kiểm tra', ANSMEAN: 'Danh mục · Nghĩa câu trả lời' };
function editor(f) {
  switch (f.t) {
    case 'text': case undefined: return f.max ? 'Chữ · ' + f.max : 'Textstring';
    case 'area': return 'Đoạn · ' + (f.max || '');
    case 'url': return 'Chữ · Liên kết https';
    case 'num': return 'Số' + (f.lo != null ? ' ' + f.lo + '–' + f.hi : '');
    case 'date': return 'Ngày';
    case 'code': return 'Chữ · Mã danh mục';
    case 'toggle': return 'Bật/tắt';
    case 'pick': return FIXSRC[f.src] ? FIXSRC[f.src] : (NODESRC[f.src] || f.src) + ' (một)';
    case 'multi': return (NODESRC[f.src] || f.src) + ' (nhiều' + (f.max ? ', ≤ ' + f.max : '') + (f.sort ? ', sắp được' : '') + ')';
    case 'tags': return 'Thẻ · Từ khóa';
    case 'media': return 'Chọn ảnh';
    case 'file': return 'Chọn tệp PDF';
    case 'lines': return 'Danh sách dòng' + (f.min || f.max ? ' (' + (f.min || 0) + '–' + (f.max || 'n') + ')' : '');
    case 'table': return 'InlineList · Bảng';
    case 'cards': return 'InlineList · Thẻ';
    case 'rte': return f.mode === 'limited' ? (f.lists ? 'Soạn thảo · Rút gọn' : 'Soạn thảo · Chỉ in đậm') : 'Soạn thảo · Bài đọc';
    case 'info': return 'Không lưu (hiển thị)';
    case 'matrix': return 'Antc.WizardMatrix';
  }
  return f.t;
}
const req = f => typeof f.req === 'function' ? 'có điều kiện' : f.req === 'xb' ? 'khi đăng' : f.req ? '✔' : '';
const esc = s => String(s || '').replace(/\|/g, '/');
function note(f) {
  const a = [];
  if (f.adm) a.push('chỉ Quản trị');
  if (f.when) a.push('hiện có điều kiện');
  if (f.unique) a.push('duy nhất');
  if (f.lockPub || f.t === 'code') a.push('khóa sau xuất bản');
  if (f.help) a.push(f.help);
  return esc(a.join('; '));
}
let md = '';
const { G, TY, NE } = require(require('path').join(__dirname, 'alias_map.js'));
let CT = '';
const top = k => (TY[CT] && TY[CT][k]) || G[k] || k;
const sub = (pk, k) => (NE[pk] && NE[pk][k]) || k;
function rows(list, tab, group, path, pk) {
  list.forEach(f => {
    if (f.g) { rows(f.f, tab, f.g + (f.adm ? ' (chỉ Quản trị)' : ''), path, pk); return; }
    const me = pk ? path + sub(pk, f.k) : top(f.k);
    const al = f.t === 'info' ? '— (không lưu)' : '`' + me + '`';
    md += `| ${tab} | ${esc(group)} | ${al} | ${esc(f.l)} | ${esc(editor(f))} | ${req(f)} | ${note(f)} |\n`;
    if (f.t === 'table') (f.cols.concat(f.extra || [])).forEach(c => { md += `| | ↳ cột | \`${me}[].${sub(f.k, c.k)}\` | ${esc(c.l)} | ${esc(editor(c))} | ${req(c)} | ${(f.extra || []).includes(c) ? 'ở dòng mở rộng' : ''}${c.digits ? ' chỉ chữ số 3–6' : ''} |\n`; });
    if (f.t === 'cards') { rows(f.fields, '', '↳ ô trong thẻ', me + '[].', f.k); if (f.opt) rows(f.opt.f, '', '↳ phần "' + f.opt.l + '" (bật bằng `' + sub(f.k, f.opt.on) + '`)', me + '[].', f.k); }
    if (f.t === 'matrix') rows(MXF, '', '↳ mỗi hàng ma trận (JSON)', me + '.rows[].', 'matrix');
  });
}
const order = Object.keys(T);
for (const a of order) {
  const t = T[a]; CT = a;
  md +=`\n#### \`${a}\` · ${t.name}\n\n`;
  const facts = [];
  facts.push(t.page ? 'Có template và đường dẫn' : t.folder ? 'Thư mục, không có trang' : 'Không có trang');
  if (t.create) facts.push('Tạo: ' + (t.create === 'bt' ? 'Biên tập viên' : 'chỉ Quản trị viên'));
  if (t.del === false) facts.push('Không xóa (trang cố định)'); else if (t.del) facts.push('Xóa: ' + (t.del === 'bt' ? 'Biên tập viên' : 'chỉ Quản trị viên'));
  if (t.admOnly) facts.push('Chỉ Quản trị viên mở');
  if (t.nameMax) facts.push('Tên node ≤ ' + t.nameMax + ' ký tự');
  if (ALLOW[a]) facts.push('Con được tạo: ' + ALLOW[a].map(x => '`' + x + '`').join(', '));
  if (COLL[a]) facts.push('Có Collection (tab danh sách)' + (COLL[a].sortable ? ', kéo sắp thứ tự' : '') + (COLL[a].cols ? ': cột ' + COLL[a].cols.map(c => c[0]).join(', ') : '') + (COLL[a].filters ? '; lọc ' + COLL[a].filters.map(c => c[0]).join(', ') : ''));
  md += facts.join(' · ') + '\n';
  if (t.info) { md += '\nKhông có trường mới: ' + t.info + '\n'; continue; }
  const tabs = (t.tabs || []).filter(x => !x.list && !x.dash);
  if (!tabs.length) continue;
  md += '\n| Tab | Nhóm | Alias | Tên trường | Kiểu nhập (data type) | Bắt buộc | Ghi chú |\n|---|---|---|---|---|---|---|\n';
  tabs.forEach(tb => { if (tb.t === 'SEO và chia sẻ') { md += `| SEO và chia sẻ | | (composition \`seoBase\`, \`publishMetaBase\`) | | | | Mục 6.13 file phân tích |\n`; return; } rows(tb.f, tb.t + (tb.adm ? ' (chỉ Quản trị)' : ''), '', '', ''); });
}
fs.writeFileSync(process.argv[3], md);
console.log('types', order.length, 'bytes', md.length);
