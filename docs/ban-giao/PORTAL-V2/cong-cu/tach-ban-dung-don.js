// Tach ban dung mot file (antoantaichinh_co_anh_nen_sang.html) thanh build/app.js, build/data.json
// va anh/minh-hoa-<so>.jpg + anh/alt.json, de chay tiep tach-du-lieu-ban-dung.js va build_bo.py.
// node tach-ban-dung-don.js <file ban dung .html> <thu muc ra>
const fs = require('fs'), path = require('path');
const [src, out] = process.argv.slice(2);
const s = fs.readFileSync(src, 'utf8');
const build = path.join(out, 'build'), anh = path.join(out, 'anh');
fs.mkdirSync(build, { recursive: true }); fs.mkdirSync(anh, { recursive: true });

// Doc mot gia tri JSON bat dau tu vi tri i (dem ngoac, bo qua chuoi)
function jsonAt(i) {
  let d = 0, q = false, e = false;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (q) { if (e) e = false; else if (c === '\\') e = true; else if (c === '"') q = false; continue; }
    if (c === '"') q = true; else if (c === '{' || c === '[') d++;
    else if ((c === '}' || c === ']') && --d === 0) return JSON.parse(s.slice(i, j + 1));
  }
  throw new Error('JSON chua dong tu vi tri ' + i);
}
function after(mark) { const i = s.indexOf(mark); if (i < 0) throw new Error('Khong thay ' + mark); return i + mark.length; }

const data = jsonAt(after('window.__DATA__='));
fs.writeFileSync(path.join(build, 'data.json'), JSON.stringify(data));

// Ma ung dung: khoi <script> co ham vTool (khoi chua du lieu va anh nam o khoi khac)
const scripts = [...s.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const app = scripts.find(x => x.includes('function vTool('));
if (!app) throw new Error('Khong thay khoi ma ung dung');
fs.writeFileSync(path.join(build, 'app.js'), app);

const img = jsonAt(after('ATTC_IMG='));
const alt = jsonAt(after('ATTC_IMG_ALT='));
let n = 0;
for (const [k, v] of Object.entries(img)) {
  const m = v.match(/^data:image\/(jpeg|png|webp);base64,(.*)$/);
  if (!m) { console.error('Bo qua anh', k); continue; }
  fs.writeFileSync(path.join(anh, 'minh-hoa-' + k + '.' + (m[1] === 'jpeg' ? 'jpg' : m[1])), Buffer.from(m[2], 'base64')); n++;
}
fs.writeFileSync(path.join(anh, 'alt.json'), JSON.stringify(alt, null, 1));
console.log('data.json, app.js,', n, 'anh');
