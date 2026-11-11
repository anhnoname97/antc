"""Đóng gói 157 bài: bai-viet.js (toàn văn, nạp khi cần) và art_index.js (mục lục nhúng vào trang)."""
import os,re,json,sys
D,OUTJS,OUTIDX=sys.argv[1],sys.argv[2],sys.argv[3]
idx=[];full={}
def plain(s):
    s=re.sub(r'\*\*|__|\*|`','',s); return re.sub(r'\s+',' ',s).strip()
for f in sorted(os.listdir(D)):
    if not f.endswith('.md'):continue
    n=int(f[:3]); s=open(os.path.join(D,f),encoding='utf8').read().replace('\r\n','\n')
    lines=s.split('\n'); assert lines[0].startswith('# '),f
    title=lines[0][2:].strip()
    short=re.sub(r'\s*:\s*nhận diện và phòng tránh\s*$','',title,flags=re.I)
    body='\n'.join(lines[1:]).strip('\n')
    m=re.search(r'^>\s*\*\*Ghi nhớ:\*\*\s*(.+)$',body,flags=re.M)
    summ=plain(m.group(1)) if m else ''
    summ=re.sub(r'Khuyến nghị của website:\s*(\w)',lambda m:m.group(1).upper(),summ).strip()
    if len(summ)>190: summ=summ[:summ.rfind(' ',0,185)]+'…'
    words=len(re.sub(r'[#>*|\-]',' ',body).split())
    slug=re.sub(r'^\d+_','',f[:-3]).lower()
    idx.append([n,slug,short,max(1,round(words/200)),summ])
    full[n]=body
open(OUTJS,'w',encoding='utf8').write('window.__ARTICLES__='+json.dumps(full,ensure_ascii=False,separators=(',',':'))+';\n')
open(OUTIDX,'w',encoding='utf8').write('var ARTIDX='+json.dumps(idx,ensure_ascii=False,separators=(',',':'))+';\n')
print(len(idx), os.path.getsize(OUTJS), os.path.getsize(OUTIDX))
print(idx[0]); print(idx[98])
