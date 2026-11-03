// Xuat du lieu mau Portal v2 (seed) tu mockup backoffice, theo alias chuan cua Phu luc A.
// Cach chay: node xuat-seed.js <mockup-o-nhap-backoffice.html> <seed-portal-v2.json>
// Khoa nut va khoa dong la GUID v5 tinh tu ma trong mockup, nen chay lai luon ra cung khoa.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { G, TY, NE } = require(path.join(__dirname, 'alias_map.js'));

const [mockPath, outPath] = process.argv.slice(2);
if (!mockPath || !outPath) { console.error('Cach chay: node xuat-seed.js <mockup.html> <seed.json>'); process.exit(2); }
const html = fs.readFileSync(mockPath, 'utf8');
const tag = '<script type="application/json" id="data">';
const d0 = html.indexOf(tag) + tag.length;
const dataJson = html.slice(d0, html.indexOf('</script>', d0));
const DATA = JSON.parse(dataJson);
let js = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
js = js.slice(0, js.indexOf('/* ---------- khởi động'));
const noop = () => {};
global.document = { getElementById: () => ({ textContent: dataJson }), addEventListener: noop, querySelectorAll: () => [], createElement: noop, createElementNS: noop };
global.addEventListener = noop;
const { T, MXF, FIX } = new Function(js + '\nreturn {T,MXF,FIX};')();

// ---- khoa GUID v5
const NS = Buffer.from('6b1f3c1e5a0e4c4b9a5e2f0c8d7a9e11', 'hex');
function uuid5(name) {
  const hsh = crypto.createHash('sha1').update(Buffer.concat([NS, Buffer.from(name, 'utf8')])).digest();
  hsh[6] = (hsh[6] & 0x0f) | 0x50; hsh[8] = (hsh[8] & 0x3f) | 0x80;
  const x = hsh.subarray(0, 16).toString('hex');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}
const nodeKey = id => uuid5('node:' + id);
const rowKey = (nodeId, k) => uuid5('row:' + nodeId + ':' + k);

// ---- danh sach co dinh theo Phu luc B1 (ma, chu hien thi)
const CODEMAP = { HT: { ca2: 'goiVaNhanTin', nhan: 'nhanTin' }, DOORKIND: { trang: 'moTrang', luaChon: 'moDanhSach' } };
const LISTNAME = { LEVEL: 'Danh mục · Mức độ cần thận trọng', KIND: 'Danh mục · Loại bài', HT: 'Danh mục · Hình thức liên hệ', DOORKIND: 'Danh mục · Kiểu cửa vào', ILL: 'Danh mục · Hình minh họa cửa vào', BAR: 'Danh mục · Dải trên cùng', ICONS: 'Danh mục · Biểu tượng', QKIND: 'Danh mục · Loại câu kiểm tra', ANSMEAN: 'Danh mục · Nghĩa câu trả lời' };
const fixedLists = {};
for (const [k, name] of Object.entries(LISTNAME)) {
  fixedLists[name] = FIX[k].map(it => {
    const code = (CODEMAP[k] && CODEMAP[k][it.id]) || it.id;
    let label = it.name;
    if (k === 'ILL') label = label.replace(/^Hình “(.+)”$/, '$1');
    if (k === 'ICONS') label = `${it.name} · ${it.id}`;
    return { code, label };
  });
}
const fixedCode = (src, v) => (CODEMAP[src] && CODEMAP[src][v]) || v;

// ---- doi alias
let CT = '';
const top = k => (TY[CT] && TY[CT][k]) || G[k] || k;
const sub = (pk, k) => (NE[pk] && NE[pk][k]) || k;

const byId = Object.fromEntries(DATA.N.map(n => [n.id, n]));
const MEDIA = Object.fromEntries(DATA.MEDIA.map(m => [m.id, m.name]));
const unresolved = [];
const fieldsMeta = {};
function meta(type, alias, f) {
  const m = fieldsMeta[type] || (fieldsMeta[type] = {});
  if (m[alias]) return;
  const kind = f.t || 'text';
  const o = { kind };
  if ((kind === 'pick' || kind === 'multi') && FIX[f.src]) { o.kind = 'fixed'; o.list = LISTNAME[f.src]; o.multiple = kind === 'multi'; }
  else if (kind === 'pick' || kind === 'multi') { o.kind = 'content'; o.multiple = kind === 'multi'; o.source = f.src; }
  if (f.max) o.max = f.max;
  m[alias] = o;
}
function ref(id, where) {
  if (!id) return null;
  if (!byId[id]) { unresolved.push(`${where} -> ${id}`); return null; }
  return nodeKey(id);
}
function convert(f, v, ctx, alias) {
  meta(ctx.type, alias, f);
  if (v === undefined || v === null) return null;
  switch (f.t || 'text') {
    case 'pick': return FIX[f.src] ? (v ? fixedCode(f.src, v) : null) : ref(v, ctx.where + '.' + alias);
    case 'multi': return FIX[f.src] ? v.map(x => fixedCode(f.src, x)) : v.map(x => ref(x, ctx.where + '.' + alias)).filter(Boolean);
    case 'media': case 'file': return v ? { media: MEDIA[v] || v } : null;
    case 'toggle': return !!v;
    case 'lines': case 'tags': return [...v];
    case 'table': return v.map(r => {
      const o = { key: rowKey(ctx.nodeId, r._k) };
      f.cols.concat(f.extra || []).forEach(c => { const a = sub(f.k, c.k); const x = convert(c, r[c.k], ctx, alias + '[].' + a); if (x !== null && x !== '') o[a] = x; });
      return o;
    });
    case 'cards': return v.map(it => {
      const o = { key: rowKey(ctx.nodeId, it._k) };
      const walk = list => list.forEach(c => { const a = sub(f.k, c.k); const x = convert(c, it[c.k], ctx, alias + '[].' + a); if (x !== null && x !== '') o[a] = x; });
      walk(f.fields);
      if (f.opt) { o[sub(f.k, f.opt.on)] = !!it[f.opt.on]; if (it[f.opt.on]) walk(f.opt.f); }
      return o;
    });
    case 'matrix': return { rows: v.map(r => {
      const o = { key: rowKey(ctx.nodeId, r._k) };
      MXF.forEach(c => { const a = sub('matrix', c.k); const x = convert(c, r[c.k], ctx, alias + '.rows[].' + a); if (x !== null && x !== '') o[a] = x; });
      o.match = {};
      [1, 2, 3].forEach(s => { o.match['step' + s] = (r['s' + s] || []).map(k => rowKey(ctx.nodeId, k)); });
      return o;
    }) };
    default: return v;
  }
}
function fieldsOf(type) {
  const out = [];
  const walk = list => list.forEach(f => { if (f.g) walk(f.f); else if (f.t !== 'info') out.push(f); });
  (T[type].tabs || []).filter(t => !t.list).forEach(t => walk(t.f));
  return out;
}

const siblingsOrder = {};
const nodes = DATA.N.map(n => {
  let type = n.type;
  if (type === 'toolPage') type = n.v.kind === 'nhanh' ? 'toolBranchPage' : 'toolCountPage';
  CT = n.type;
  const ctx = { type, nodeId: n.id, where: n.id };
  const values = {};
  fieldsOf(n.type).forEach(f => {
    if (n.type === 'toolPage' && f.k === 'kind') return;
    const alias = top(f.k);
    const x = convert(f, n.v[f.k], ctx, alias);
    if (x === null || x === '' || (Array.isArray(x) && !x.length)) return;
    values[alias] = x;
  });
  const p = n.p || '';
  siblingsOrder[p] = (siblingsOrder[p] || 0) + 1;
  return { key: nodeKey(n.id), mockupId: n.id, parentKey: n.p ? nodeKey(n.p) : null, contentType: type, name: n.name, state: n.st === 'pub' ? 'published' : 'draft', sortOrder: siblingsOrder[p] - 1, values };
});

const counts = {};
nodes.forEach(n => { counts[n.contentType] = (counts[n.contentType] || 0) + 1; });
const seed = { format: 'antc-portal-v2-seed', version: 1, source: path.basename(mockPath), note: 'Sinh bang xuat-seed.js. Khong sua tay; sua mockup roi chay lai.', fixedLists, media: DATA.MEDIA.map(m => ({ name: m.name, description: m.sub })), fields: fieldsMeta, counts, nodes };
fs.writeFileSync(outPath, JSON.stringify(seed, null, 1) + '\n');
console.log('nodes', nodes.length, 'types', Object.keys(counts).length, 'unresolved', unresolved.length);
if (unresolved.length) { console.error(unresolved.join('\n')); process.exit(1); }
