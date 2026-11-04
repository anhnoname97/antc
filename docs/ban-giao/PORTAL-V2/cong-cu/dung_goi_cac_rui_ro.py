"""Dong goi ban giao phan Cac rui ro cho dev: goi-cac-rui-ro/index.html + 2 mockup.

python dung_goi_cac_rui_ro.py
Chay trong thu muc cong-cu, sau khi da dung mockup (README). Lay task tu 1-thiet-ke.md, truong tu phu-luc-a.md,
quyet dinh tu docs/quyet-dinh.md, luat tu lay tu dung_bo_cac_rui_ro.py. Khong sua tay file trong goi.
"""
import os, re, html, runpy, sys, json, tempfile, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
P = lambda *x: os.path.normpath(os.path.join(HERE, *x))
OUT = P('..', 'goi-cac-rui-ro')
os.makedirs(OUT, exist_ok=True)
E = html.escape

OWN = ['V2-03a', 'V2-03b', 'V2-03c', 'V2-04a', 'V2-04b', 'V2-13h', 'V2-13i']
DEPS = ['V2-01a', 'V2-01b', 'V2-01d', 'V2-01e', 'V2-01f', 'V2-01h', 'V2-01i', 'V2-01j', 'V2-01l', 'V2-01m', 'V2-01q', 'V2-01s', 'V2-01t', 'V2-01v',
        'I-01', 'V2-02a', 'V2-05a', 'V2-10a', 'V2-10b', 'V2-11a', 'V2-13a']
TYPES = ['ruiRoPage', 'alertListPage', 'riskCategoryPage', 'alertPage', 'riskArticlePage', 'tacticItem', 'topicItem', 'channelItem', 'audienceItem',
         'stopSignItem', 'popularityItem', 'sharedSnippet', 'alertFolder', 'articleFolder', 'snippetFolder', 'libraryFolder', 'channelFolder', 'audienceFolder',
         'stopSignFolder', 'popularityFolder', 'topicFolder', 'tacticFolder']
QDS = ['QĐ-038', 'QĐ-051', 'QĐ-053', 'QĐ-054', 'QĐ-055']

def inline(t):
    t = E(t).replace('&lt;br&gt;', '<br>')
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    t = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', t)
    return t

# ---- task
design = open(P('..', '1-thiet-ke.md'), encoding='utf-8').read()
rows = {}
for l in design.split('\n'):
    m = re.match(r'^\| ((?:V2|I)-[0-9a-z]+) \|', l)
    if m: rows[m.group(1)] = [c.strip() for c in l.strip().strip('|').split(' | ')]
def task_table(codes, full):
    head = '<tr><th>Mã</th><th>Việc</th><th>Luồng</th><th>Phạm vi, file</th><th>Phụ thuộc</th><th>Hoàn thành khi</th><th>Kiểm chứng</th><th>Trạng thái</th></tr>' if full else '<tr><th>Mã</th><th>Việc</th><th>Luồng</th><th>Trạng thái</th></tr>'
    body = []
    for c in codes:
        r = rows.get(c)
        if not r: continue
        cells = r if full else [r[0], r[1], r[2], r[-1]]
        body.append('<tr id="t-%s">%s</tr>' % (c, ''.join('<td>%s</td>' % inline(x) for x in cells)))
    return '<div class="tblwrap"><table class="%s"><thead>%s</thead><tbody>%s</tbody></table></div>' % ('tasks' if full else 'deps', head, ''.join(body))

# ---- truong (Phu luc A)
pla = open(P('phu-luc-a.md'), encoding='utf-8').read()
secs = re.split(r'\n(?=#### `)', pla)
def md_table(block):
    lines = [l for l in block.split('\n') if l.startswith('|')]
    if not lines: return ''
    hdr = [c.strip() for c in lines[0].strip().strip('|').split('|')]
    out = ['<tr>%s</tr>' % ''.join('<th>%s</th>' % inline(c) for c in hdr)]
    for l in lines[2:]:
        cells = [c.strip() for c in l.strip().strip('|').split('|')]
        cls = ' class="sub"' if cells and not cells[0] else ''
        out.append('<tr%s>%s</tr>' % (cls, ''.join('<td>%s</td>' % inline(c) for c in cells)))
    return '<div class="tblwrap"><table class="fields">%s</table></div>' % ''.join(out)
fields = []
for t in TYPES:
    sec = next((x for x in secs if x.lstrip().startswith('#### `%s`' % t)), None)
    if not sec: continue
    first, rest = sec.lstrip().split('\n', 1)
    title = re.sub(r'^#### ', '', first)
    meta = next((l for l in rest.split('\n') if l.strip() and not l.startswith('|')), '')
    fields.append('<details class="ft" id="f-%s"><summary>%s</summary><p class="small">%s</p>%s</details>' % (t, inline(title), inline(meta), md_table(rest)))

# ---- quyet dinh
qd = open(P('..', '..', '..', 'quyet-dinh.md'), encoding='utf-8').read()
qblocks = re.split(r'\n(?=### QĐ-)', qd)
def qd_html(code):
    b = next((x for x in qblocks if x.startswith('### %s ' % code)), None)
    if not b: return ''
    lines = b.split('\n'); title = lines[0][4:]
    items = []
    for l in lines[1:]:
        if not l.strip(): continue
        lvl = (len(l) - len(l.lstrip())) // 2
        items.append('<li class="l%d">%s</li>' % (lvl, inline(l.strip().lstrip('- '))))
    return '<details class="qd"><summary>%s</summary><ul>%s</ul></details>' % (inline(title), ''.join(items))

# ---- luat tu lay, doi truong
tmp = tempfile.NamedTemporaryFile(suffix='.html', delete=False).name
argv = sys.argv; sys.argv = ['x', P('anh-portal-rui-ro'), tmp]
G = runpy.run_path(P('dung_bo_cac_rui_ro.py')); sys.argv = argv; os.unlink(tmp)
rules = ''.join('<tr><td><b>%s</b></td><td>%s</td></tr>' % (E(n), inline(r)) for n, r in G['RULES'])
drop = ''.join('<tr><td><code>%s.%s</code></td><td>%s</td><td>%s</td></tr>' % (E(t), E(a), E(l), inline(w)) for t, a, l, w in G['DROP'])
add = ''.join('<tr><td><code>%s.%s</code></td><td>%s</td><td>%s</td></tr>' % (E(t), E(a), E(l), E(k)) for t, a, l, k in G['ADD'])
screens = ''.join('<li><a href="website-va-backoffice.html#%s">%s</a> <code>%s</code></li>' % (s['id'], E(s['nav']), E(s['url'])) for s in G['SCREENS'])

# ---- du lieu mau
seed = json.load(open(P('seed-portal-v2.json'), encoding='utf-8'))
cnt = {}
for n in seed['nodes']:
    if n['contentType'] in TYPES: cnt[n['contentType']] = cnt.get(n['contentType'], 0) + 1
seedrows = ''.join('<tr><td><code>%s</code></td><td>%d</td></tr>' % (k, v) for k, v in sorted(cnt.items(), key=lambda x: -x[1]))

# ---- chep 2 mockup, them dau trang HTML
def copy(src, dst):
    s = open(src, encoding='utf-8').read()
    if not s.lstrip().lower().startswith('<!doctype'):
        s = '<!doctype html>\n<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n' + s
    open(dst, 'w', encoding='utf-8', newline='\n').write(s)
copy(P('..', 'mockup', 'bo-cac-rui-ro.html'), os.path.join(OUT, 'website-va-backoffice.html'))
copy(P('..', 'mockup', 'backoffice-cac-rui-ro.html'), os.path.join(OUT, 'backoffice.html'))

tpl = open(P('goi-cac-rui-ro.tpl.html'), encoding='utf-8').read()
own_list = ''.join('<li><a href="#t-%s"><b>%s</b></a> %s</li>' % (c, c, inline(rows[c][1])) for c in OWN if c in rows)
for k, v in {'{{DATE}}': datetime.date.today().strftime('%d/%m/%Y'), '{{OWN}}': task_table(OWN, True), '{{OWNLIST}}': own_list, '{{DEPS}}': task_table(DEPS, False),
             '{{FIELDS}}': ''.join(fields), '{{RULES}}': rules, '{{DROP}}': drop, '{{ADD}}': add, '{{QD}}': ''.join(qd_html(c) for c in QDS),
             '{{SCREENS}}': screens, '{{SEED}}': seedrows, '{{NOWN}}': str(len(OWN))}.items():
    tpl = tpl.replace(k, v)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8', newline='\n').write(tpl)
print('index', len(tpl), 'own', len(OWN), 'deps', len(DEPS), 'types', len(fields))
